import logging
import os

from confluent_kafka import Producer, KafkaError

kafka_conf = {
    "bootstrap.servers": f"{os.environ.get('TAILSCALE_VPN_IP')}:9092",
}


class KafkaProducerSingleton:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = Producer(kafka_conf)
        return cls._instance

    @classmethod
    def produce_message(cls, topic, value, callback=None):
        producer = cls.get_instance()
        try:
            producer.produce(topic, value, callback=callback)
            producer.flush()  # Ensure all messages are sent
        except KafkaError as e:
            logging.error(f"Kafka error occurred: {e}")
            raise Exception("Failed to send message to Kafka") from e
        except Exception as e:
            logging.error(f"An error occurred: {e}")
            raise Exception("An unexpected error occurred while sending message") from e
