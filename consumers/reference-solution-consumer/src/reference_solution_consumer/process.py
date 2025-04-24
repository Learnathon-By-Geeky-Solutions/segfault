import os
import logging
import zipfile
from random import randint
from time import sleep
from typing import Iterator, Generator, TypedDict

import grpc

from reference_solution_consumer.aws_client import AWSClient
from reference_solution_consumer.ref_sol_validation_process_pb2 import (
    ProcessRequest,
    Status,
)
from reference_solution_consumer.ref_sol_validation_process_pb2_grpc import (
    RefSolValidationProcessStub,
)


def setup_logger(name: str, log_file: str | None = None):
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


class ReferenceSolutionValidationProcessor:
    def __init__(
        self, problem_id: int, client_id: str, bucket_name: str, grpc_server: str
    ):
        self.logger = setup_logger("HiddenTestProcessor")

        self.problem_id = problem_id
        self.client_id = client_id
        self.bucket_name = bucket_name
        self.grpc_server = grpc_server

        self.download_dir = os.environ.get("DOWNLOAD_DIR", "/tmp")
        # TODO: implement data persistence by leveraging env variable
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

    def download_hidden_test_data(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 1: Download the hidden test data from the S3 bucket.
        """

        aws_client = AWSClient("s3").get_client()
        self.logger.info(f"AWS Client: {aws_client}")

        try:
            self.logger.info(
                f"Collecting hidden test data for problem ID: {self.problem_id}"
            )
            path = os.path.join(self.download_dir, "hidden-tests.zip")
            # clear from local if exists
            if os.path.exists(path):
                self.logger.info("Removing existing hidden-tests.zip")
                os.remove(path)

            self.logger.info(f"Downloading hidden test into {path}")
            aws_client.download_file(
                Bucket=self.bucket_name,
                Key=f"processed/{self.problem_id}/hidden-tests.zip",
                Filename=path,
            )
            yield ProcessRequest(
                status=Status.SUCCESS,
                message="✅ Hidden test data downloaded successfully",
            )
        except Exception as e:
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

    def process(self) -> Iterator[ProcessRequest]:
        steps = [
            self.download_hidden_test_data,
        ]
        yield ProcessRequest(
            status=Status.INFO, message="⚙️ Started processing hidden test data"
        )

        for idx, step in enumerate(steps, start=1):
            try:
                self.logger.info(f"Processing step {idx}/{len(steps)}")
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
            stub = RefSolValidationProcessStub(channel)
            metadata = (("client_id", self.client_id),)
            stub.streamRefSolValidationProcess(self.process(), metadata=metadata)


if __name__ == "__main__":
    processor = ReferenceSolutionValidationProcessor(
        problem_id=20,
        client_id="cb4ec4ee-4d7f-4294-9f16-685bb84be75f",
        bucket_name="codesirius-tests-data",
        grpc_server="localhost:50051",
    )
    # processor.download_hidden_test_data()
    processor.initiate()
