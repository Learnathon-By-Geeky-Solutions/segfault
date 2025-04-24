import os

from base_consumer import BaseKafkaConsumer

class ReferenceSolutionValidationConsumer(BaseKafkaConsumer):
    def __init__(self, topic_name, group_id, bootstrap_servers):
        super().__init__(topic_name, group_id, bootstrap_servers)

    def process_message(self, message):
        """Kafka consumer for handling hidden test messages."""

        def __init__(self):
            super().__init__(
                broker_url=f"{os.environ.get('TAILSCALE_VPN_IP')}:9092",
                topic="reference_solution_validation",
                group_id="reference_solution_validation_group",
                log_file="reference_solution_validation.log",
            )
            log_level = os.environ.get("LOG_LEVEL", "INFO")
            self.set_logger_level(log_level)

        def process_message(self, message: dict):
            self.logger.info(f"Processing message: {message}")
            processor = ReferenceSolutionValidationProcessor(
                problem_id=message["problem_id"],
                client_id=message["client_id"],
                bucket_name=message["bucket_name"],
                grpc_server=message["grpc_server"],
            )
            processor.initiate()
            self.logger.info("Message processed successfully")
