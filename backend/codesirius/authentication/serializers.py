"""
Serializers for authentication app.
"""

from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenVerifySerializer,
    TokenRefreshSerializer,
)

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
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password1"],
        )
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
            raise AuthenticationFailed("User is inactive")

        return super().validate(attrs)


class CustomTokenVerifySerializer(TokenVerifySerializer):
    token = serializers.CharField(
        required=True, error_messages={"required": "Token is required"}
    )

    def validate(self, data):
        try:
            super().validate(data)
        except TokenError as e:
            raise ValidationError(str(e))
        return data


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    token = serializers.CharField(
        required=True, error_messages={"required": "Token is required"}
    )

    def validate(self, data):
        try:
            super().validate(data)
        except TokenError as e:
            raise ValidationError(str(e))
        return data
