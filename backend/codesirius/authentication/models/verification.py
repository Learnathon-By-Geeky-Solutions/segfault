import string
from secrets import choice

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.timezone import now, timedelta
from rest_framework.exceptions import ValidationError

from codesirius.models import BaseModel


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

        TODO: Use celery to send the code asynchronously.
        """
        if self._regenerated:
            # If the verification code is regenerated, do not save it.
            # As the verification code is already saved in the database.
            raise ValidationError(
                {"detail": "You cannot save a regenerated verification code."}
            )
        super().save(*args, **kwargs)

        # for example, using celery
        # send_verification_code.delay(self.user.email, self.code)

    class Meta:
        verbose_name = "Verification Code"
        verbose_name_plural = "Verification Codes"
        ordering = ["-created_at"]
