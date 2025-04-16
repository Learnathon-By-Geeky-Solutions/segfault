import logging

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

logger = logging.getLogger(__name__)


class CodesiriusTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Serializer for refreshing JWT access tokens using a refresh token.

    This serializer extends the 'TokenRefreshSerializer' from
    'rest_framework_simplejwt' to customize the handling of refresh token
    validation and errors within the Codesirius application.

    Key Features and Design:
        Custom Error Messages:  Overrides default error messages for the
        'refresh' field to provide more specific feedback to the client.
        Robust Error Handling:  Wraps the parent class's 'validate' method
        in a try-except block to catch and handle potential exceptions
        during the token refresh process.  This includes:
            'TokenError':  Raised by 'rest_framework_simplejwt' for
            invalid or expired tokens.
            'get_user_model().DoesNotExist': Raised if the user
            associated with the refresh token does not exist.
            'Exception': A catch-all for any other unexpected errors
            during the refresh process.
        Logging: Logs any unexpected errors that occur during token
        refreshing using the Django logging framework.
        Clear Validation Errors:  Consistently raises 'ValidationError'
        with a clear 'refresh' field error, regardless of the underlying
        exception.

    Usage:
    This serializer is used to process refresh token requests.  It takes a
    refresh token as input, validates it, and if valid, returns a new access
    token (and optionally a new refresh token).  It handles various error
    scenarios to provide informative feedback to the client.
    """
    refresh = serializers.CharField(
        required=True,
        error_messages={
            "null": "Refresh token is required",
            "required": "Refresh token is required",
            "blank": "Refresh token is required",
        },
    )

    def validate(self, data):
        """
        Validates the refresh token and handles potential errors.

        This method overrides the parent class's 'validate' method to provide
        custom error handling.  It attempts to validate the refresh token
        using the parent class's logic and catches any exceptions that may occur.

        Args:
            data (dict): A dictionary containing the input data, which should
                include the 'refresh' token.

        Returns:
            dict: The validated data, which will include the new access token
                (and optionally a new refresh token).

        Raises:
            ValidationError:  If the refresh token is invalid, expired, or
                if any other error occurs during the refresh process.  The
                'refresh' field in the error dictionary will contain a
                descriptive error message.
        """
        try:
            res = super().validate(data)
            return res
        except TokenError as e:
            raise ValidationError({"refresh": str(e)})
        except get_user_model().DoesNotExist:
            raise ValidationError({"refresh": "User not found"})
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            raise ValidationError({"refresh": "Error refreshing token"})
