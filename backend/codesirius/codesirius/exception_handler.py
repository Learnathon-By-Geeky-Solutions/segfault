import logging
import time
from email.utils import formatdate
from http import HTTPStatus

from rest_framework.exceptions import (
    ValidationError,
    APIException,
    AuthenticationFailed,
)
from rest_framework.views import exception_handler

from problems.serializers.execution_constraint_v2 import BulkOperationError

logger = logging.getLogger(__name__)


def generate_timestamp():
    return formatdate(timeval=time.time(), localtime=False, usegmt=True)


def format_validation_errors(errors):
    logger.info(f"Type of errors: {type(errors)}")
    logger.info(f"Errors: {errors}")
    formatted_errors = []
    if isinstance(errors, list):
        for error in errors:
            formatted_errors.extend(format_validation_errors(error))
        return formatted_errors
    elif isinstance(errors, dict):
        for key, value in errors.items():
            if isinstance(value, list):
                for item in value:
                    formatted_errors.append({"field": key, "message": item})
            elif isinstance(value, dict):
                formatted_errors.extend(format_validation_errors(value))
            else:
                formatted_errors.append({"field": key, "message": value})
    # elif isinstance(errors, BulkOperationError):
    #     formatted_errors.extend(errors.errors)
    elif isinstance(errors, str):
        formatted_errors.append({"message": errors})
    logger.info(f"Formatted errors: {formatted_errors}")
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
    logger.error(f"An exception occurred: {exc}")

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
        elif isinstance(exc, BulkOperationError):
            response.data = build_response(
                response,
                response.status_code,
                "One or more fields have errors.",
                path,
                exc.errors,
            )
        elif isinstance(exc, APIException):
            response.data = build_response(
                response, response.status_code, exc.detail or exc.default_detail, path
            )
    else:
        response = build_response(None, 500, "An unexpected error occurred.", path)

    return response
