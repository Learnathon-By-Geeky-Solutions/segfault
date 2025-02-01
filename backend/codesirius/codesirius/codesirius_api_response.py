from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status


class CodesiriusAPIResponse(Response):
    def __init__(
        self, data=None, message="Success", status_code=status.HTTP_200_OK, **kwargs
    ):
        timestamp = timezone.now().isoformat().replace("+00:00", "Z")
        response_data = {
            "status": status_code,
            "message": message,
            "timestamp": timestamp,
        }
        if data is not None:
            response_data["data"] = data
        super().__init__(response_data, status=status_code, **kwargs)
