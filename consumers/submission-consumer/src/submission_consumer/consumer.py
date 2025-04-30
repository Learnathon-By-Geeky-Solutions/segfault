import os

from base_consumer import BaseKafkaConsumer
from submission_consumer.process import SubmissionProcessor

class SubmissionConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(
            broker_url=f"{os.environ.get('TAILSCALE_VPN_IP')}:9092",
            topic="python_submission",
            group_id="python_submission_group",
            log_file="consumer.log",
        )
        log_level = os.environ.get("LOG_LEVEL", "INFO")
        self.set_logger_level(log_level)

    def process_message(self, message: dict):
        self.logger.info(f"Processing message: {message}")
        processor = SubmissionProcessor(
            submission_id=message["submission_id"],
            problem_id=message["problem_id"],
            client_id=message["client_id"],
            bucket_name=message["bucket_name"],
            # grpc_server=message["grpc_server"],
            grpc_server="100.64.65.66:50051"
        )
        processor.initiate()
        self.logger.info("Message processed successfully")
