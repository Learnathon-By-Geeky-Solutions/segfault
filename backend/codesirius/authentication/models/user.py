from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db import models

from codesirius.models import BaseModel


class UserManager(BaseUserManager):
    """
    Custom user manager for the User model.

    This manager provides helper functions for creating users and superusers.
    """

    def create_user(self, first_name, email, username, password=None, **extra_fields):
        """
        Creates and saves a User with the given first name, email, username,
        and password.

        Args:
            first_name (str): The first name of the user.
            email (str): The email address of the user.
            username (str): The username of the user.
            password (str, optional): The password for the user. If None, the
                user will be created with an unusable password.
            **extra_fields: Additional fields to be set on the User instance.

        Returns:
            User: The created User object.

        Raises:
            ValueError: If any of the required fields (first_name, email,
                username) are not provided.
        """
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
        """
        Creates and saves a superuser with the given first name, email,
        username, and password.

        Args:
            first_name (str): The first name of the superuser.
            email (str): The email address of the superuser.
            username (str): The username of the superuser.
            password (str, optional): The password for the superuser.
            **extra_fields: Additional fields to be set on the User instance.
                Defaults for is_staff, is_superuser, and is_active are
                automatically set to True.

        Returns:
            User: The created superuser object.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(first_name, email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Custom user model that extends AbstractBaseUser and PermissionsMixin.

    This model represents a user in the system and includes fields for
    first name, last name, email, username, active status, and staff status.
    It uses a custom user manager (`UserManager`) and defines the field used
    for authentication (`USERNAME_FIELD`) and the required fields for user
    creation.
    """
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)
    username = models.CharField(unique=True, max_length=255)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["first_name", "email"]
