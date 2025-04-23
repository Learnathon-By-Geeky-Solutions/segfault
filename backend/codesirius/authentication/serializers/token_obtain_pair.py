from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
)


class CodesiriusTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer for obtaining JWT token pairs (access and refresh) for user authentication.

    This serializer extends the `TokenObtainPairSerializer` from the
    `rest_framework_simplejwt` library, customizing it for the Codesirius
    application.  It primarily focuses on:

        Customizing error messages for the 'username' and 'password' fields
        to provide more user-friendly feedback.
        Overriding the `validate` method to include additional checks:
            Authentication of the user using Django's `authenticate` function.
            Checking if the user account is active.

    Usage:
    This serializer is used to validate user credentials (username and password)
    and, upon successful validation, generate a pair of JWT tokens.  These tokens
    are then used for subsequent API authentication.
    """

    def __init__(self, *args, **kwargs):
        """
        Initializes the serializer.

        This overrides the parent class's `__init__` method to customize the
        error messages for the 'username' and 'password' fields.  This provides
        more specific and user-friendly error messages when these fields are
        missing or blank.
        """
        super().__init__(*args, **kwargs)
        self.fields["username"].error_messages["required"] = "Username is required."
        self.fields["username"].error_messages["blank"] = "Username is required."

        self.fields["password"].error_messages["required"] = "Password is required."
        self.fields["password"].error_messages["blank"] = "Password is required."

    def validate(self, attrs):
        """
        Validates the user's credentials and checks account status.

        This method overrides the parent class's `validate` method to perform
        the following steps:

        1.  Constructs a dictionary of credentials from the input 'attrs'.
        2.  Authenticates the user using Django's `authenticate` function.
        3.  Raises an `AuthenticationFailed` exception with the message
            "Invalid credentials." if authentication fails.
        4.  Checks if the user account is active.
        5.  Raises an `AuthenticationFailed` exception with the message
            "Account is not active." if the account is not active.
        6.  If authentication is successful and the account is active, calls
            the parent class's `validate` method to generate the token pair.
        7.  Returns the validated attributes.

        Args:
            attrs (dict): A dictionary containing the input data (username and password).

        Returns:
            dict: The validated data, including the token pair.

        Raises:
            AuthenticationFailed: If authentication fails or the user account is not active.
        """
        username_field = self.username_field
        credentials = {
            username_field: attrs[username_field],
            "password": attrs["password"],
        }

        user = authenticate(**credentials)
        if not user:
            raise AuthenticationFailed("Invalid credentials.")
        if not user.is_active:
            raise AuthenticationFailed("Account is not active.")
        return super().validate(attrs)
