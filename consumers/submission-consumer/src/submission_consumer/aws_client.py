from dotenv import load_dotenv

load_dotenv()
import os
from threading import Lock
from typing import Dict, Type
import boto3

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION")


class AWSClient:
    _instances: Dict[str, "AWSClient"] = (
        {}
    )  # Stores service-specific AWSClient instances
    _lock: Lock = Lock()  # Ensures thread safety

    def __new__(cls: Type["AWSClient"], service_name: str) -> "AWSClient":
        with cls._lock:
            if service_name in cls._instances:
                return cls._instances[service_name]
            instance = super().__new__(cls)
            instance.__client = boto3.client(  # Private attribute
                service_name,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
            )
            cls._instances[service_name] = instance
            return instance

    def get_client(self) -> boto3.client:
        """Public getter for the AWS client."""
        return self.__client
