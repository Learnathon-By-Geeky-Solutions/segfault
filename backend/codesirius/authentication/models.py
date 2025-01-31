import string
from random import choices
from datetime import datetime, timedelta

from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db import models

from codesirius.models import BaseModel


class UserManager(BaseUserManager):

    def create_user(self, first_name, email, username, password=None, **extra_fields):
        if not first_name:
            raise ValueError("User must have a first name")
        if not email:
            raise ValueError("User must have an email address")
        if not username:
            raise ValueError("User must have a username")
        if not password:
            raise ValueError("User must have a password")

        user = self.model(
            first_name=first_name,
            email=self.normalize_email(email),
            username=username,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(
        self, first_name, email, username, password=None, **extra_fields
    ):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(first_name, email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)
    username = models.CharField(unique=True, max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["first_name", "email"]


class VerificationCode(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
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
