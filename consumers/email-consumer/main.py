import json
import logging
import os

import requests
from confluent_kafka import Consumer
from django.db.backends.base.schema import logger

from lib.generate_html_verification_email import generate

logger = logging.getLogger(__name__)


def send_verification_email(
    email: str, verification_code: str, username: str, user_id: str
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
        logger.error(f"Failed to send email: {e}")
        return None


conf = {
    "bootstrap.servers": f"{os.environ.get('TAILSCALE_VPN_IP')}:9092",
    "group.id": "email-consumer",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
    "partition.assignment.strategy": "roundrobin",
}

topic = "email"
logger.info(f"Connecting to Kafka broker at {conf['bootstrap.servers']}")
consumer = Consumer(conf)
consumer.subscribe([topic])

try:
    while True:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            logger.error(f"Consumer error: {msg.error()}")
            continue
        logger.info(f"Received message: {msg.value()}")
        try:
            msg_data = json.loads(msg.value())
            res = send_verification_email(**msg_data)
            if res.status_code == 200:
                logger.info(f"Email sent to {msg_data['email']}")
            else:
                logger.error(f"Failed to send email to {msg_data['email']}")
        except json.JSONDecodeError:
            logger.error("Failed to decode message")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
        consumer.commit(asynchronous=False)
except KeyboardInterrupt:
    pass
