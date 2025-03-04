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
    if err:
        print(f"❌ Message delivery failed: {err}")
    else:
        print(f"✅ Message delivered to {msg.topic()} [{msg.partition()}]")


class VerificationCode(BaseModel):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    def __init__(self, *args, **kwargs):
        """
        Generate a random verification code if not provided.
        Set the expiration time to 5 minutes if not provided.
        """
        self._regenerated = False
        super().__init__(*args, **kwargs)
        if not self.code:
            self.code = VerificationCode._generate_verification_code()
        if not self.expires_at:
            self.expires_at = now() + timedelta(minutes=5)  # 5 minutes

    def regenerate_verification_code(self):
        """
        Regenerate the verification code
        and set the expiration time to 5 minutes from now.
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
        Generate a random verification code.
        This is a static method so that
        it can be used without an instance of the class.
        This is also a private method so that
        it should NOT be called from outside the class.
        """
        return "".join(
            choice(string.ascii_uppercase + string.digits) for _ in range(length)
        )

    def __str__(self):
        return f"{self.user.username} - {self.code}"

    def _is_expired(self):
        return self.expires_at < now()

    def is_valid(self):
        return not self.is_used and not self._is_expired()

    def mark_as_used(self):
        self.is_used = True
        self.used_at = now()
        self.save()

    def save(self, *args, **kwargs):
        """
        Save the verification code and send it to the user.
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
        verbose_name = "Verification Code"
        verbose_name_plural = "Verification Codes"
        ordering = ["-created_at"]
