import json
import os
import shutil
import logging
import zipfile
from random import randint
from time import sleep
from code_executor.python312 import PythonCodeExecutor
import requests
from typing import Iterator, Generator, TypedDict
from reference_solution_consumer.logger import setup_logger
import grpc

from arbiterx.exceptions import EarlyExitError

from reference_solution_consumer.aws_client import AWSClient
from reference_solution_consumer.ref_sol_validation_process_pb2 import (
    ProcessRequest,
    Status,
)
from reference_solution_consumer.ref_sol_validation_process_pb2_grpc import (
    RefSolValidationProcessStub,
)

class ReferenceSolutionValidationProcessor:
    def __init__(
        self, 
        problem_id: int,
        client_id: str,
        bucket_name: str,
        grpc_server: str,
        reference_solution_id: int
    ):
        log_level = os.environ.get("LOG_LEVEL", "INFO")
        self.logger = setup_logger("HiddenTestProcessor", log_level, "consumer.log")

        self.problem_id = str(problem_id)
        self.client_id = client_id
        self.bucket_name = bucket_name
        self.grpc_server = grpc_server
        self.reference_solution_id = reference_solution_id

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
        
        self.problem = None
        self.reference_solution = None
        self.constraints = None
        self.memory_usage = -1
        self.execution_time = -1
        self.verdict = None

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
            path = os.path.join(self.download_dir, self.problem_id, "hidden-tests.zip")
            # clear from local if exists
            if os.path.exists(path):
                self.logger.info("Removing existing hidden-tests.zip")
                os.remove(path)

            self.logger.info(f"Downloading hidden test into {path}")
            os.makedirs(os.path.join(self.download_dir, self.problem_id), exist_ok=True)
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
            path = os.path.join(self.download_dir, self.problem_id, "hidden-tests.zip")
            with zipfile.ZipFile(
                path
            ) as zip_ref:
                zip_ref.extractall(os.path.join(self.download_dir, self.problem_id))
        except Exception as e:
            yield ProcessRequest(
                status=Status.ERROR, message="❌ Error unzipping hidden test data"
            )
            raise e
        
    def pull_problem(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 3: Pull the problem from Django API.
        """
        yield ProcessRequest(
            status=Status.INFO, message="📥 Pulling reference solution..."
        )
        try:
            url = f"{self.backend_url}/api/internal/v1/problems/{self.problem_id}/"
            headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()['data']
                if not data:
                    raise ValueError("No reference solution found.")
                self.logger.info(f"Reference solution data: {data}")
                self.problem = data
                yield ProcessRequest(
                    status=Status.SUCCESS,
                    message="✅ Problem pulled successfully",
                )
        except Exception as e:
            yield ProcessRequest(
                status=Status.ERROR,
                message="❌ Error pulling reference solution",
            )
            raise e

    def collect_reference_solution(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 4:
        """
        try:
            yield ProcessRequest(
                status=Status.INFO, message="Collecting reference solution..."
            )
            self.reference_solution = next(filter(
                lambda x: x["id"] == self.reference_solution_id,
                self.problem["reference_solutions"],
            ), None)
            if not self.reference_solution:
                raise ValueError("Reference solution not found.")
            self.logger.info(f"Reference solution: {self.reference_solution}")
            # reference_solution.code holds the code of the reference solution
            # we need to save it into a file
            path = os.path.join(
            self.download_dir,
            self.problem_id, "reference_solution.py"
            )
            with open(path, "w") as f:
                f.write(self.reference_solution["code"])
            
            with open(path, "r") as f:
                self.logger.info(f"Reference solution code:\n{f.read()}")

            self.logger.info(f"Reference solution saved to {path}")
            self.logger.info("Reference solution collected successfully")
            yield ProcessRequest(
                status=Status.SUCCESS,
                message="✅ Reference solution collected successfully",
            )
        except Exception as e:
            yield ProcessRequest(
                status=Status.ERROR,
                message="❌ Error collecting reference solution",
            )
            raise e
    
    def collect_constraints(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 5: Collect the constraints from the reference solution.
        """
        try:
            yield ProcessRequest(
                status=Status.INFO, message="Collecting constraints..."
            )
            # first, we need to get the language ID from the reference solution
            language_id = self.reference_solution["language_id"]
            if not language_id:
                raise ValueError("Language ID not found.")
            self.logger.info(f"Language ID: {language_id}")
            # then, we need to get the constraints from the reference solution
            self.constraints = next(filter(
                lambda x: x["language_id"] == language_id,
                self.problem["execution_constraints"],
            ), None)
            if not self.constraints:
                raise ValueError("Constraints not found.")
            self.logger.info(f"Constraints: {self.constraints}")
            yield ProcessRequest(
                status=Status.SUCCESS,
                message="✅ Constraints collected successfully",
            )
        except Exception as e:
            yield ProcessRequest(
                status=Status.ERROR,
                message="❌ Error collecting constraints",
            )
            raise e

    def run(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 6: Run the reference solution.
        """
        try:
            yield ProcessRequest(
                status=Status.INFO, message="Running reference solution..."
            )
            constraints = {
                "time_limit": self.constraints["time_limit"],
                "memory_limit": self.constraints["memory_limit"],
                "memory_swap_limit": 0,  # No swap
                # cpu quota and period are in microseconds
                "cpu_quota": 1000000,
                "cpu_period": 1000000,
            }
            with open(os.environ.get("LANGUAGE_IMAGE_MAP_PATH"), "r") as f:
                language_image_map = json.load(f)
            self.logger.info(f"Language image map: {language_image_map}")
            # Now find the language by self.reference_solution["language_id"]
            lang = next(filter(
                lambda x: x["id"] == self.reference_solution["language_id"],
                self.problem["languages"]
            ), None)
            self.logger.info(f"Language: {lang}")
            
            normalized_language_key = f"{lang['name'].lower()}:{lang['version'].lower()}"

            with PythonCodeExecutor(
                    user="sandbox", # Default is "nobody"
                    docker_image=language_image_map[normalized_language_key],
                    volume=os.environ.get("DOCKER_VOLUME"),
                    src_in_volume=self.problem_id,
                    src=os.path.join(self.download_dir, self.problem_id),
                    constraints=constraints,
                    disable_compile=True,
                    log_file="arbiterx.log"
            ) as executor:
                try:
                    for result in executor.run():
                        self.verdict = result["verdict"]
                        # convert the memory usage from byte to MB
                        memory_usage_mb = int(result["stats"]["memory_peak"]) >> 20
                        self.memory_usage = max(self.memory_usage, memory_usage_mb)
                        # convert the execution time from microsonds to seconds
                        execution_time_s = int(result["stats"]["cpu_stat"]["usage_usec"]) / 1_000_000
                        self.execution_time = max(self.execution_time, execution_time_s)

                        # Limit the input, actual_output, and expected_output to 1000 characters
                        for key in ["input", "actual_output", "expected_output"]:
                            if key in result and isinstance(result[key], str) and len(result[key]) > 100:
                                result[key] = result[key][:100] + "..."

                        yield ProcessRequest(
                            status=Status.VERDICT,
                            message=json.dumps(result)
                        )
                except EarlyExitError as e:
                    self.logger.error(
                        f"Error running reference solution: {e}"
                    )
                    raise e
        except Exception as e:
            yield ProcessRequest(
                status=Status.ERROR,
                message="❌ Error running reference solution",
            )
            raise e

    def update_verdict(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 8: Update the verdict in the Django API.
        """

        def _convert_verdict(verdict: str) -> str:
            if verdict == "WA":
                return "WRONG_ANSWER"
            elif verdict == "AC":
                return "ACCEPTED"
            elif verdict == "MLE":
                return "MEMORY_LIMIT_EXCEEDED"
            elif verdict == "TLE":
                return "TIME_LIMIT_EXCEEDED"
            elif verdict == "RE":
                return "RUNTIME_ERROR"
            elif verdict == "CE":
                return "COMPILATION_ERROR"
            return "PENDING"
        try:
            yield ProcessRequest(
                status=Status.INFO, message="Updating verdict..."
            )
            url = f"{self.backend_url}/api/internal/v1/problems/{self.problem_id}/reference-solutions/{self.reference_solution_id}/"
            headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
            data = {
                "verdict": _convert_verdict(self.verdict),
                "memory_usage": self.memory_usage,
                "execution_time": self.execution_time
            }
            response = requests.patch(url, headers=headers, json=data)
            if response.status_code == 200:
                yield ProcessRequest(
                    status=Status.SUCCESS,
                    message="✅ Verdict updated successfully",
                )
            else:
                raise ValueError("Error updating verdict.")
        except Exception as e:
            yield ProcessRequest(
                status=Status.ERROR,
                message="❌ Error updating verdict",
            )
            raise e
    
    def cleanup(self) -> Generator[ProcessRequest, None, None]:
        """
        STEP 7: Cleanup the downloaded files.
        """
        try:
            yield ProcessRequest(
                status=Status.INFO, message="Cleaning up..."
            )
            path = os.path.join(self.download_dir, self.problem_id)
            if os.path.exists(path):
                self.logger.info(f"Removing {path}")
                shutil.rmtree(path)
            yield ProcessRequest(
                status=Status.SUCCESS,
                message="✅ Cleanup successful",
            )
        except Exception as e:
            self.logger.error(
                f"Error cleaning up: {e}"
            )

            yield ProcessRequest(
                status=Status.ERROR,
                message="❌ Error cleaning up",
            )
            raise e

    def process(self) -> Iterator[ProcessRequest]:
        steps = [
            self.download_hidden_test_data,
            self.unzip_hidden_test_data,
            self.pull_problem,
            self.collect_reference_solution,
            self.collect_constraints,
            self.run,
            self.update_verdict,
            self.cleanup,
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
                yield from self.update_verdict()
                yield from self.cleanup()
                # yield ProcessRequest(status=Status.ERROR, message="❌ Error processing")
                yield ProcessRequest(status=Status.INFO, message="FINISHED_ERROR")
                return
        yield ProcessRequest(
            status=Status.FINAL_VERDICT,
            message=json.dumps({
                "verdict": self.verdict,
                "memory_usage": self.memory_usage,
                "execution_time": self.execution_time,
            })
        )
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
        client_id="9c0fb4ce-094a-41dd-bddf-06778f7bc8f3",
        bucket_name="codesirius-tests-data",
        grpc_server="100.64.65.66:50051",
        reference_solution_id=45
    )
    # processor.download_hidden_test_data()
    processor.initiate()
    # constraints = {
    #     "time_limit": 2,
    #     "memory_limit": 10,
    #     "memory_swap_limit": 0,  # No swap
    #     # cpu quota and period are in microseconds
    #     "cpu_quota": 1000000,
    #     "cpu_period": 1000000,
    # }
    # DOWNLOAD_DIR = os.environ.get("DOWNLOAD_DIR")
    # WORK_DIR = os.path.join(DOWNLOAD_DIR, "20")
    # with PythonCodeExecutor(
    #         user="sandbox", # Default is "nobody"
    #         docker_image="python312:v1",
    #         volume=os.environ.get("DOCKER_VOLUME"),
    #         src=WORK_DIR,
    #         constraints=constraints,
    #         disable_compile=True,
    # ) as executor:
    #     for result in executor.run():
    #         print(json.dumps(result), indent=4)
