from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

User = get_user_model()


class SignupSerializer(serializers.Serializer):
    """
    Serializer for signing up a new user.
    """

    firstName = serializers.CharField(
        min_length=1,
        max_length=255,
        error_messages={
            "required": "First name is required.",
            "blank": "First name is required.",
            "min_length": "First name is too short.",
            "max_length": "First name is too long.",
        },
        source="first_name",
    )
    lastName = serializers.CharField(
        source="last_name", required=False, allow_blank=True
    )
    email = serializers.EmailField(
        error_messages={
            "blank": "Email is required",
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
            "blank": "Username is required",
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
            "blank": "Password is required",
            "required": "Password is required",
            "blank": "Password is required",
            "min_length": "Password is too short",
        },
    )
    password2 = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={
            "blank": "Password confirmation is required",
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

        return user
