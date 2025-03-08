import os

import requests

from base_consumer import BaseKafkaConsumer
from lib.generate_html_verification_email import generate


class EmailConsumer(BaseKafkaConsumer):
    """Kafka consumer for handling email messages."""

    def __init__(self):
        super().__init__(
            broker_url=f"{os.environ.get('TAILSCALE_VPN_IP')}:9092",
            topic="email",
            group_id="email-consumer",
            log_file="email_consumer.log",
        )
        log_level = os.environ.get("LOG_LEVEL", "INFO")
        self.set_logger_level(log_level)

    def send_verification_email(
        self, email: str, verification_code: str, username: str, user_id: str
    ) -> requests.Response | None:
        try:
            return requests.post(
                "https://api.mailgun.net/v3/mail.codesirius.tech/messages",
                auth=("api", os.environ.get("MAILGUN_API_KEY")),
                data={
                    "from": f"Codesirius <no-reply@{os.environ.get('MAILGUN_DOMAIN')}>",
                    "to": email,
                    "subject": "Verify Codesirius Account",
                    "html": generate(username, user_id, verification_code),
                },
            )
        except Exception as e:
            self.logger.error(f"Failed to send email: {e}")
            return None

    def process_message(self, message: dict):
        self.logger.debug(f"Processing message: {message}")
        res = self.send_verification_email(**message)
        if res and res.status_code == 200:
            self.logger.info(f"Email sent to {message['email']}")
        else:
            self.logger.error(f"Failed to send email to {message['email']}")


if __name__ == "__main__":
    consumer = EmailConsumer()
    consumer.consume()
