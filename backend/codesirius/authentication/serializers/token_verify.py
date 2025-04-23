from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenVerifySerializer


class CodesiriusTokenVerifySerializer(TokenVerifySerializer):
    """
    Serializer for verifying the validity of a JWT token.

    This serializer extends the 'TokenVerifySerializer' from
    'rest_framework_simplejwt' to customize token verification within the
    Codesirius application.  It primarily focuses on customizing error
    handling.

    Key Features and Design:
        Custom Error Messages:  Overrides default error messages for the
        'token' field to provide more specific feedback to the client.
        Error Handling:  Wraps the parent class's 'validate' method in a
        try-except block to catch 'TokenError' exceptions raised during
        the token verification process.
        Clear Validation Errors:  Raises a 'ValidationError' with a
        descriptive 'token' field error if the token is invalid.

    Usage:
    This serializer is used to validate a JWT token provided by the client.
    It takes a token as input, verifies its signature and expiration, and
    returns the validated data if the token is valid.  If the token is
    invalid, it raises a 'ValidationError' with an appropriate error
    message.
    """
    token = serializers.CharField(
        required=True,
        error_messages={
            "required": "Token is required",
            "blank": "Token is required",
        },
    )

    def validate(self, data):
        """
        Validates the JWT token and handles potential errors.

        This method overrides the parent class's 'validate' method to
        provide custom error handling.  It attempts to validate the token
        using the parent class's logic and catches any 'TokenError'
        exceptions that may occur.

        Args:
            data (dict): A dictionary containing the input data, which
                should include the 'token' to be verified.

        Returns:
            dict: The validated data, if the token is valid.

        Raises:
            ValidationError: If the token is invalid or expired.  The
                'token' field in the error dictionary will contain a
                descriptive error message.
        """
        try:
            return super().validate(data)
        except TokenError as e:
            raise ValidationError({"token": str(e)})
