import hashlib
import secrets

from django.db import models
from codesirius.models import BaseModel


class APIKey(BaseModel):
    """
    Model representing an API key for the internal API.
    Intended to be used by internal microservices to authenticate with the DRF server.

    Attributes:
        name (str): The name of the API key.
        key (str): The API key itself.
        is_active (bool): Whether the API key is active or not.
        expires_at (datetime): The date and time at which the API key expires.
    """

    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    @staticmethod
    def hash_key(raw_key: str) -> str:
        """
        Hash an API key using SHA-256.

        Args:
            raw_key (str): The raw API key to hash.

        Returns:
            str: The hashed API key.
        """
        return hashlib.sha256(raw_key.encode()).hexdigest()

    @staticmethod
    def generate_key() -> tuple[str, str]:
        """
        Generate a raw and hashed API key pair.

        Returns:
            tuple[str, str]: A tuple containing the raw and hashed API keys.
        """
        raw_key = secrets.token_urlsafe(32)
        hashed_key = APIKey.hash_key(raw_key)
        return raw_key, hashed_key

    class Meta:
        verbose_name = "API Key"
        verbose_name_plural = "API Keys"

    def __str__(self):
        return self.name
