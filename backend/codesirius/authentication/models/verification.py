import json
import logging
import string
from secrets import choice

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.timezone import now, timedelta
from rest_framework.exceptions import ValidationError

from codesirius.kafa_producer import KafkaProducerSingleton
from codesirius.models import BaseModel

logger = logging.getLogger(__name__)


def delivery_report(err, msg):
    """
    Callback function for Kafka producer to handle message delivery status.

    Args:
        err: The error object if delivery failed, None otherwise.
        msg: The message object that was delivered or attempted to be delivered.
    """
    if err:
        print(f"❌ Message delivery failed: {err}")
    else:
        print(f"✅ Message delivered to {msg.topic()} [{msg.partition()}]")


class VerificationCode(BaseModel):
    """
    Model to store verification codes for user verification process.

    This model extends Codesirius's BaseModel, providing fields for tracking
    creation and update information.  It stores a verification code associated
    with a user, its usage status, usage timestamp, and expiration time.

    Key Features and Design:
        User Association:  A ForeignKey to the User model.
        Code Storage:  Stores the verification code as a CharField.
        Usage Tracking:  Flags for whether the code has been used and when.
        Expiration:  A DateTimeField to ensure codes are valid for a limited time.
        Automatic Code Generation:  Generates a random code if not provided during initialization.
        Automatic Expiration: Sets a default expiration of 5 minutes.
        Code Regeneration:  Provides a method to regenerate the code and reset its usage status.
        Validation:  Provides a method to check if the code is valid.
        Automatic Email Sending:  Sends the verification code to the user's email upon saving.

    Usage:
    This model is used to manage the verification process, typically during user
    registration or password reset.  A VerificationCode instance is created for a
    user, the code is sent to the user, and the user must provide the code to
    complete the verification process.
    """
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    def __init__(self, *args, **kwargs):
        """
        Initializes a new VerificationCode instance.

            Generates a random verification code if one is not provided.
            Sets the expiration time to 5 minutes from the current time if not provided.
            Initializes the `_regenerated` attribute to False.

        Args:
            *args:  Positional arguments passed to the parent class.
            **kwargs: Keyword arguments passed to the parent class.
        """
        self._regenerated = False
        super().__init__(*args, **kwargs)
        if not self.code:
            self.code = VerificationCode._generate_verification_code()
        if not self.expires_at:
            self.expires_at = now() + timedelta(minutes=5)  # 5 minutes

    def regenerate_verification_code(self):
        """
        Regenerates the verification code, resets its usage status,
        and sets the expiration time to 5 minutes from now.
        """
        self.code = VerificationCode._generate_verification_code()
        self.expires_at = now() + timedelta(minutes=5)
        self.is_used = False
        self.used_at = None
        self.save()
        self._regenerated = True

    @staticmethod
    def _generate_verification_code(length=6):
        """
        Generates a random verification code of the specified length.

        This is a static and private method.  It should only be called from
        within the VerificationCode class.

        Args:
            length (int): The length of the verification code to generate.
                Defaults to 6.

        Returns:
            str: A random string of the specified length, containing
                uppercase letters and digits.
        """
        return "".join(
            choice(string.ascii_uppercase + string.digits) for _ in range(length)
        )

    def __str__(self):
        """
        Returns a string representation of the VerificationCode instance.

        The string includes the username of the associated user and the verification code.

        Returns:
            str: A string representing the VerificationCode instance.
        """
        return f"{self.user.username} - {self.code}"

    def _is_expired(self):
        """
        Checks if the verification code has expired.

        Returns:
            bool: True if the code has expired, False otherwise.
        """
        return self.expires_at < now()

    def is_valid(self):
        """
        Checks if the verification code is valid.

        A code is considered valid if it has not been used and has not expired.

        Returns:
            bool: True if the code is valid, False otherwise.
        """
        return not self.is_used and not self._is_expired()

    def mark_as_used(self):
        """
        Marks the verification code as used and records the usage time.
        """
        self.is_used = True
        self.used_at = now()
        self.save()

    def save(self, *args, **kwargs):
        """
        Saves the VerificationCode instance to the database and sends the
        verification code to the user's email via Kafka.

        If the code has been regenerated, it raises a ValidationError
        because the regenerated code is already saved.

        Args:
            *args:  Positional arguments passed to the parent class's save method.
            **kwargs: Keyword arguments passed to the parent class's save method.

        Raises:
            ValidationError: If the verification code has been regenerated
                (i.e., `self._regenerated` is True).
        """
        if self._regenerated:
            # If the verification code is regenerated, do not save it.
            # As the verification code is already saved in the database.
            raise ValidationError(
                {"detail": "You cannot save a regenerated verification code."}
            )
        super().save(*args, **kwargs)

        try:
            # Send the verification code to the user
            logger.info(f"Sending verification code to {self.user.email}")
            KafkaProducerSingleton.produce_message(
                topic="email",
                value=json.dumps(
                    {
                        "email": self.user.email,
                        "verification_code": self.code,
                        "username": self.user.username,
                        "user_id": str(self.user.id),
                    }
                ),
                callback=delivery_report,
            )
        except Exception as e:
            logger.error(f"Failed to send verification code: {e}")

    class Meta:
        """
        Metadata for the VerificationCode model.
        """
        verbose_name = "Verification Code"
        verbose_name_plural = "Verification Codes"
        ordering = ["-created_at"]
