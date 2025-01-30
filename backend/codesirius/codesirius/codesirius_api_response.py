from rest_framework.response import Response
from datetime import datetime
from rest_framework import status


class CodesiriusAPIResponse(Response):
    def __init__(
        self, data=None, message="Success", status_code=status.HTTP_200_OK, **kwargs
    ):
        response_data = {
            "status": status_code,
            "message": message,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        if data is not None:
            response_data["data"] = data
        super().__init__(response_data, status=status_code, **kwargs)
