from codesirius.models import BaseModel
from django.db import models
from django.contrib.auth import get_user_model

from random import choices
from datetime import datetime, timedelta
import string


class VerificationCode(BaseModel):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    @staticmethod
    def generate_verification_code(length=6):
        """Generate a random alphanumeric verification code."""
        return "".join(choices(string.ascii_uppercase + string.digits, k=length))

    def __str__(self):
        return f"{self.user.username} - {self.code}"

    def is_expired(self):
        return self.expires_at < datetime.now()

    def is_valid(self):
        return not self.is_used and not self.is_expired()

    def mark_as_used(self):
        self.is_used = True
        self.used_at = datetime.now()
        self.save()

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_verification_code()
        if not self.expires_at:
            self.expires_at = datetime.now() + timedelta(minutes=5)  # 5 minutes
        super().save(*args, **kwargs)

    def send_code(self):
        pass

    class Meta:
        verbose_name = "Verification Code"
        verbose_name_plural = "Verification Codes"
        ordering = ["-created_at"]
