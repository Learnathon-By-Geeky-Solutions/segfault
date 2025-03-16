import os

from base_consumer import BaseKafkaConsumer

from hidden_test_consumer.process import HiddenTestProcessor


class HiddenTestConsumer(BaseKafkaConsumer):
    """Kafka consumer for handling hidden test messages."""

    def __init__(self):
        super().__init__(
            broker_url=f"{os.environ.get('TAILSCALE_VPN_IP')}:9092",
            topic="hidden_test",
            group_id="hidden-test-consumer",
            log_file="hidden-test-consumer.log",
        )
        log_level = os.environ.get("LOG_LEVEL", "INFO")
        self.set_logger_level(log_level)

    def process_message(self, message: dict):
        self.logger.info(f"Processing message: {message}")
        processor = HiddenTestProcessor(
            problem_id=message["problem_id"],
            client_id=message["client_id"],
            bucket_name=message["bucket_name"],
            grpc_server=message["grpc_server"],
        )
        processor.initiate()
        self.logger.info("Message processed successfully")
