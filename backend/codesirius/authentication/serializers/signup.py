from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

User = get_user_model()


class SignupSerializer(serializers.Serializer):
    """
    Serializer for signing up a new user.

    This serializer handles the validation and creation of new user accounts.
    It defines the fields required for signup, including first name, last name,
    email, username, and password (with confirmation).  It also ensures that
    the email and username are unique.

    The serializer performs the following actions:
        Validates input data for required fields, data types, and constraints.
        Ensures that the provided email and username are unique within the
        system.
        Confirms that the password and password confirmation match.
        Has a create method.

    Usage:
    This serializer is used to process user signup data.  It takes the raw input
    data from a request, validates it according to the defined fields and
    rules, and returns the validated data, which can then be used to create a
    new user account.
    """

    firstName = serializers.CharField(
        min_length=1,
        max_length=255,
        error_messages={
            "required": "First name is required.",
            "blank": "First name is required.",
            "null": "First name is required.",
            "min_length": "First name is too short.",
            "max_length": "First name is too long.",
        },
        source="first_name",
    )
    lastName = serializers.CharField(
        source="last_name",
        required=False,
        allow_blank=True,
        error_messages={
            "null": "Last name can either be left blank or excluded from the request.",
        },
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
        """
        Validates the input data for user signup.

        This method performs the following validation checks:
            Ensures that the two password fields match.
            Removes the password2 field from the validated data.
            Renames the password1 field to password.

        Args:
            data (dict): A dictionary containing the input data for signup.

        Returns:
            dict: The validated data.

        Raises:
            serializers.ValidationError: If the passwords do not match.
        """
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
        Creates a new user with is_active=False.

        This method creates a new user with the data provided.  It enforces
        that the user is initially inactive (`is_active=False`).

        Args:
            validated_data (dict): A dictionary containing the validated data
                for the new user.

        Returns:
            User: The newly created user object.
        """
        user = User.objects.create_user(
            is_active=False, **validated_data
        )  # enforce is_active=False

        return user
