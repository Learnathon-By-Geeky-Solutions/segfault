import time
from email.utils import formatdate
from http import HTTPStatus

from rest_framework.exceptions import (
    ValidationError,
    APIException,
    AuthenticationFailed,
)
from rest_framework.views import exception_handler


def generate_timestamp():
    return formatdate(timeval=time.time(), localtime=False, usegmt=True)


def format_validation_errors(errors):
    formatted_errors = []
    for field, messages in errors.items():
        if isinstance(messages, list):
            for message in messages:
                formatted_errors.append({"field": field, "message": message})
        else:
            formatted_errors.append({"field": field, "message": messages})
    return formatted_errors


def build_response(response, status_code, message, path, errors=None):
    res = {
        "timestamp": generate_timestamp(),
        "status": status_code,
        "error": HTTPStatus(status_code).phrase,
        "message": message,
        "path": path,
    }
    if errors:
        res["errors"] = errors
    return res


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    path = context["request"].path

    if response is not None:
        if isinstance(exc, ValidationError):
            response.data = build_response(
                response,
                response.status_code,
                "One or more fields have errors.",
                path,
                format_validation_errors(response.data),
            )
        elif isinstance(exc, AuthenticationFailed):
            response.data = build_response(
                response,
                response.status_code,
                (
                    "Authentication credentials were not provided."
                    if exc.detail is None
                    else exc.default_detail
                ),
                path,
            )
        elif isinstance(exc, APIException):
            response.data = build_response(
                response, response.status_code, exc.detail or exc.default_detail, path
            )
    else:
        response = build_response(None, 500, "An unexpected error occurred.", path)

    return response
