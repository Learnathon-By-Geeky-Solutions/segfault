import time
from email.utils import formatdate
from http import HTTPStatus

from rest_framework.exceptions import (
    ValidationError,
    APIException,
)
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    # Get the default response from DRF's built-in exception handler
    response = exception_handler(exc, context)

    # Generate timestamp in RFC 1123 format (e.g., "Wed, 30 Jan 2025 14:30:00 GMT")
    timestamp = formatdate(timeval=time.time(), localtime=False, usegmt=True)

    # If response exists, modify the structure
    if response is not None:
        if isinstance(exc, ValidationError):
            formatted_errors = []

            for field, errors in response.data.items():
                if isinstance(errors, list):
                    for error in errors:
                        formatted_errors.append(
                            {
                                "field": field,
                                "message": error,
                            }
                        )
                else:
                    formatted_errors.append(
                        {
                            "field": field,
                            "message": errors,
                        }
                    )

            response.data = {
                "timestamp": timestamp,
                "status": response.status_code,
                "error": HTTPStatus(response.status_code).phrase,
                "message": "One or more fields have errors.",
                "path": context["request"].path,
                "errors": formatted_errors,
            }

        elif isinstance(exc, APIException):  # Handle generic API exceptions
            response.data = {
                "timestamp": timestamp,
                "status": response.status_code,
                "error": HTTPStatus(response.status_code).phrase,
                "message": exc.default_detail,
                "path": context["request"].path,
            }
    else:
        # If response does not exist, create a new one
        response = {
            "timestamp": timestamp,
            "status": 500,
            "error": HTTPStatus.INTERNAL_SERVER_ERROR.phrase,
            "message": "An unexpected error occurred.",
            "path": context["request"].path,
        }

    return response
