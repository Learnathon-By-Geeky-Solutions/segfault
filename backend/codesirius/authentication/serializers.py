"""
Serializers for authentication app.
"""

from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from rest_framework.exceptions import (
    AuthenticationFailed,
    ValidationError,
)
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenVerifySerializer,
    TokenRefreshSerializer,
)

from authentication.models import VerificationCode

User = get_user_model()


class SignupSerializer(serializers.Serializer):
    """
    Serializer for signing up a new user.
    """

    first_name = serializers.CharField(
        min_length=1,
        max_length=255,
        error_messages={
            "required": "First name is required",
            "blank": "First name is required",
            "min_length": "First name is too short",
            "max_length": "First name is too long",
        },
    )
    last_name = serializers.CharField()
    email = serializers.EmailField(
        error_messages={
            "required": "Email is required",
            "invalid": "Email is invalid",
        },
        validators=[
            UniqueValidator(
                queryset=User.objects.all(), message="Email is already taken"
            )
        ],
    )
    username = serializers.CharField(
        min_length=1,
        max_length=255,
        error_messages={
            "required": "Username is required",
            "min_length": "Username is too short",
            "max_length": "Username is too long",
        },
        validators=[
            UniqueValidator(
                queryset=User.objects.all(), message="Username is already taken"
            )
        ],
    )
    password1 = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            "required": "Password is required",
            "blank": "Password is required",
            "min_length": "Password is too short",
        },
    )
    password2 = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            "required": "Password confirmation is required",
            "min_length": "Password confirmation is too short",
        },
    )

    def validate(self, data):
        if data["password1"] != data["password2"]:
            raise serializers.ValidationError({"password2": ["Passwords do not match"]})
        # Remove password2 from the validated data
        data.pop("password2")
        # Set the password field to password1
        data["password"] = data.pop("password1")
        # Return the validated data
        return data

    def create(self, validated_data):
        """
        Step 1: Create a new user with is_active=False
        Step 2: Generate a verification code
        Step 3: Send the verification code to the user
        """
        user = User.objects.create_user(
            is_active=False, **validated_data
        )  # enforce is_active=False

        verification_code = VerificationCode.objects.create(user=user)
        verification_code.send_code()
        return user


class SigninSerializer(TokenObtainPairSerializer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].error_messages["required"] = "Username is required"
        self.fields["username"].error_messages["blank"] = "Username is required"

        self.fields["password"].error_messages["required"] = "Password is required"
        self.fields["password"].error_messages["blank"] = "Password is required"

    def validate(self, attrs):
        username_field = self.username_field
        credentials = {
            username_field: attrs[username_field],
            "password": attrs["password"],
        }

        user = authenticate(**credentials)
        if not user:
            raise AuthenticationFailed("Invalid credentials")
        if not user.is_active:
            raise AuthenticationFailed("Account is not active")
        return super().validate(attrs)


class CustomTokenVerifySerializer(TokenVerifySerializer):
    token = serializers.CharField(
        required=True,
        error_messages={
            "required": "Token is required",
            "blank": "Token is required",
        },
    )

    def validate(self, data):
        try:
            super().validate(data)
        except TokenError as e:
            raise ValidationError({"token": [str(e)]})
        return data


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    refresh = serializers.CharField(
        required=True,
        error_messages={
            "required": "Refresh token is required",
            "blank": "Refresh token is required",
        },
    )

    def validate(self, data):
        try:
            super().validate(data)
        except TokenError as e:
            raise ValidationError({"refresh": [str(e)]})
        return data
