import json
import os

import requests
from confluent_kafka import Consumer

from lib.generate_html_verification_email import generate


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
        print(f"Failed to send email: {e}")
        return None


conf = {
    "bootstrap.servers": f"{os.environ.get('TAILSCALE_VPN_IP')}:9092",
    "group.id": "email-consumer",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,
    "partition.assignment.strategy": "roundrobin",
}

topic = "email"
print(f"Connecting to Kafka at {conf['bootstrap.servers']}")
consumer = Consumer(conf)
consumer.subscribe([topic])

try:
    while True:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            print("Consumer error: {}".format(msg.error()))
            continue
        print(f'Message: {msg.value().decode("utf-8")} partition: {msg.partition()}')
        try:
            msg_data = json.loads(msg.value())
            send_verification_email(**msg_data)
        except json.JSONDecodeError:
            print("Failed to decode message")
        except Exception as e:
            print(f"Failed to send email: {e}")
        consumer.commit(asynchronous=False)
except KeyboardInterrupt:
    pass
