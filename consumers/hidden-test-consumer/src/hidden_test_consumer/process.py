import logging
import os
import shutil
import zipfile
from random import randint
from time import sleep
from typing import Iterator, Generator, TypedDict

import grpc
import requests

from hidden_test_consumer.aws_client import AWSClient
from hidden_test_consumer.hidden_test_process_pb2 import Status, ProcessRequest
from hidden_test_consumer.hidden_test_process_pb2_grpc import HiddenTestProcessStub


class HiddenTestBundleData(TypedDict):
    s3_path: str
    test_count: int


def setup_logger(name: str, log_file: str = None):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        "[%(asctime)s] p%(process)s {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s",
        "%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


class HiddenTestProcessor:
    """
    This class is responsible for processing the hidden test data.
    """

    def __init__(
        self, problem_id: int, client_id: str, bucket_name: str, grpc_server: str
    ):
        self.logger = setup_logger("HiddenTestProcessor")

        self.problem_id = problem_id
        self.client_id = client_id
        self.bucket_name = bucket_name
        self.grpc_server = grpc_server

        self.download_dir = os.environ.get("DOWNLOAD_DIR", "/tmp")
        self.persist_data = os.environ.get("PERSIST_DATA", "false").lower() == "true"
        self.backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
        self.api_key = os.environ.get("API_KEY", None)

        if not self.problem_id:
            raise ValueError("Problem ID is required.")
        if not self.client_id:
            raise ValueError("Client ID is required.")
        if not self.bucket_name:
            raise ValueError("Bucket name is required.")
        if not self.grpc_server:
            raise ValueError("gRPC server is required.")

        # channel = grpc.insecure_channel(self.grpc_server)
        # self.stub = HiddenTestProcessStub(channel)

    def download_hidden_test_data(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 1: Download the hidden test data from the S3 bucket.
        """

        aws_client = AWSClient("s3").get_client()

        try:
            yield ProcessRequest(
                status=Status.INFO, message="📥 Collecting hidden test data..."
            )
            # clear from local if exists
            if os.path.exists(f"{self.download_dir}/hidden-tests.zip"):
                os.remove(f"{self.download_dir}/hidden-tests.zip")
            aws_client.download_file(
                Bucket=self.bucket_name,
                Key=f"unprocessed/{self.problem_id}/hidden-tests.zip",
                Filename=f"{self.download_dir}/hidden-tests.zip",
            )
            yield ProcessRequest(
                status=Status.INFO, message="✔️ Hidden test data collected"
            )
        except Exception as e:
            yield ProcessRequest(
                status=Status.ERROR, message="Error collecting hidden test data"
            )
            raise e

    def unzip_hidden_test_data(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 2: Unzip the downloaded hidden test data.
        """

        yield ProcessRequest(
            status=Status.INFO, message="📦 Unzipping hidden test data..."
        )

        try:
            with zipfile.ZipFile(
                f"{self.download_dir}/hidden-tests.zip", "r"
            ) as zip_ref:
                zip_ref.extractall(f"{self.download_dir}/extracted")
        except Exception as e:
            yield ProcessRequest(
                status=Status.ERROR, message="❌ Error unzipping hidden test data"
            )
            raise e

    def check_directory_structure(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 3: Check the directory structure of the hidden test data.
        Expected directory structure:
        extracted/
        ├── input
        │   ├── input1.txt
        │   ├── input2.txt
        │   └── input3.txt
        └── output
            ├── output1.txt
            ├── output2.txt
            └── output3.txt
        """

        yield ProcessRequest(
            status=Status.INFO, message="📂 Checking directory structure..."
        )

        extracted_dir = f"{self.download_dir}/extracted"
        input_dir = f"{extracted_dir}/input"
        output_dir = f"{extracted_dir}/output"

        self.input_seqs = set()

        def is_valid_input_file(file: str) -> tuple[bool, str]:
            if not file.startswith("input") or not file.endswith(".txt"):
                return False, f"Invalid input file: {file}"
            seq = file[5:-4]
            if not seq.isdigit():
                return False, "❌ Input file sequence is not a positive integer"
            seq = int(seq)
            if f"output{seq}.txt" not in output_files:
                return False, f"❌ Output file output{seq}.txt not found"
            self.input_seqs.add(seq)
            return True, ""

        if not os.path.exists(input_dir):
            yield ProcessRequest(
                status=Status.ERROR, message=f"❌ input directory not found"
            )

        if not os.path.exists(output_dir):
            yield ProcessRequest(
                status=Status.ERROR, message=f"❌ output directory not found"
            )

        input_files = os.listdir(input_dir)
        output_files = set(os.listdir(output_dir))
        valid_inputs = True

        for input_file in input_files:
            if input_file.startswith("."):
                continue
            is_valid, message = is_valid_input_file(input_file)
            if not is_valid:
                yield ProcessRequest(status=Status.ERROR, message=message)
                valid_inputs = False
            else:
                yield ProcessRequest(
                    status=Status.INFO,
                    message=f"📝 Found valid input file: {input_file}",
                )
            # sleep(4)

        # check if input_seqs is contiguous
        if len(self.input_seqs) != max(self.input_seqs):
            yield ProcessRequest(
                status=Status.ERROR, message="❌ Input file sequence is not contiguous"
            )
            valid_inputs = False

        if not valid_inputs:
            raise Exception("❌ Invalid input files")

        yield ProcessRequest(
            status=Status.INFO, message=f"🔍 Found {len(self.input_seqs)} valid tests"
        )

    def bundle_and_upload(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 4: Bundle the hidden test data and upload it to the S3 bucket.
        """

        yield ProcessRequest(
            status=Status.INFO, message="📦 Bundling valid hidden test data"
        )

        try:
            # delete any folders that are not input or output
            extracted_dir = f"{self.download_dir}/extracted"
            for folder in os.listdir(extracted_dir):
                if folder not in ["input", "output"]:
                    shutil.rmtree(f"{extracted_dir}/{folder}")

            # delete any input files that are not in the input_seqs
            input_dir = f"{extracted_dir}/input"
            for file in os.listdir(input_dir):
                if file.startswith(".") or int(file[5:-4]) not in self.input_seqs:
                    os.remove(f"{input_dir}/{file}")

            # delete any output files that are not in the input_seqs
            output_dir = f"{extracted_dir}/output"
            for file in os.listdir(output_dir):
                if file.startswith(".") or int(file[6:-4]) not in self.input_seqs:
                    os.remove(f"{output_dir}/{file}")

            # bundle the extracted directory
            shutil.make_archive(
                f"{self.download_dir}/bundled-hidden-tests",
                "zip",
                f"{self.download_dir}/extracted",
            )
        except Exception as e:
            yield ProcessRequest(status=Status.ERROR, message="Error bundling tests")
            raise e

        try:
            # upload the bundled tests to the bucket
            aws_client = AWSClient("s3").get_client()
            aws_client.upload_file(
                Bucket=self.bucket_name,
                Filename=f"{self.download_dir}/bundled-hidden-tests.zip",
                Key=f"processed/{self.problem_id}/hidden-tests.zip",
            )
            # yield ProcessRequest(status=Status.INFO, message="✔️ Bundling successful")
        except Exception as e:
            yield ProcessRequest(status=Status.ERROR, message="Error bundling tests")
            raise e

        try:
            # create record in the database
            url = f"{self.backend_url}/api/internal/v1/problems/{self.problem_id}/hidden-test-bundle/"
            headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
            data: HiddenTestBundleData = {
                "s3_path": f"processed/{self.problem_id}/hidden-tests.zip",
                "test_count": len(self.input_seqs),
            }
            response = requests.post(url, headers=headers, json=data)
            if response.status_code != 201:
                self.logger.error(
                    f"Error creating hidden test bundle record: {response.text}"
                )
                raise Exception("Error creating hidden test bundle record")
        except Exception as e:
            yield ProcessRequest(status=Status.ERROR, message="Error creating record")
            raise e

    def cleanup(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP x: Cleanup the downloaded hidden test data.
        """
        yield ProcessRequest(status=Status.INFO, message="🧹 Cleaning up...")

        if self.persist_data:
            return

        # remove archived files
        try:
            if os.path.exists(f"{self.download_dir}/hidden-tests.zip"):
                os.remove(f"{self.download_dir}/hidden-tests.zip")
            if os.path.exists(f"{self.download_dir}/bundled-hidden-tests.zip"):
                os.remove(f"{self.download_dir}/bundled-hidden-tests.zip")

            # remove extracted directory
            if os.path.exists(f"{self.download_dir}/extracted"):
                shutil.rmtree(f"{self.download_dir}/extracted")

            # remove unprocessed hidden tests from the bucket
            aws_client = AWSClient("s3").get_client()
            aws_client.delete_object(
                Bucket=self.bucket_name,
                Key=f"unprocessed/{self.problem_id}/hidden-tests.zip",
            )
        except Exception as e:
            self.logger.error(f"Error cleaning up: {e}")
            yield ProcessRequest(status=Status.ERROR, message="Error cleaning up")

    def process(self) -> Iterator[ProcessRequest]:
        steps = [
            self.download_hidden_test_data,
            self.unzip_hidden_test_data,
            self.check_directory_structure,
            self.bundle_and_upload,
            self.cleanup,
        ]
        yield ProcessRequest(
            status=Status.INFO, message="⚙️ Started processing hidden test data"
        )

        for step in steps:
            try:
                yield from step()
                sleep(randint(1, 3))
            except Exception as e:
                self.logger.error(f"Error processing hidden test data: {e}")
                yield from self.cleanup()
                yield ProcessRequest(status=Status.ERROR, message="❌ Error processing")
                yield ProcessRequest(status=Status.INFO, message="FINISHED_ERROR")
                return

        yield ProcessRequest(status=Status.SUCCESS, message="🎉 Finished")
        yield ProcessRequest(status=Status.INFO, message="FINISHED_SUCCESS")

    def initiate(self):
        with grpc.insecure_channel(self.grpc_server) as channel:
            stub = HiddenTestProcessStub(channel)
            metadata = (("client_id", self.client_id),)
            stub.streamHiddenTestProcess(self.process(), metadata=metadata)


if __name__ == "__main__":
    processor = HiddenTestProcessor(
        problem_id=10,
        client_id="1b71e0e5-41cc-49b5-a927-371e88b67d31",
        bucket_name="codesirius-tests-data",
        grpc_server="localhost:50051",
    )
    # processor.download_hidden_test_data()
    processor.initiate()
