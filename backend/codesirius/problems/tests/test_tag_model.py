from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException
import logging

logger = logging.getLogger(__name__)


class CodesiriusAPIResponse(Response):
    def __init__(self, data, status_code, message):
        super().__init__(data, status=status_code)
        self.data["message"] = message


def update_tag(self):
    try:
        # operation code
        return CodesiriusAPIResponse(
            data={},  # Return empty data for now
            status_code=status.HTTP_200_OK,
            message="Tag updated",
        )
    except Exception as e:
        logger.error(f"Error while updating tag - {e}")
        raise APIException("Error while updating tag")
