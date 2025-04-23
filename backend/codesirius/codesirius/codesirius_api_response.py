from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response


class CodesiriusAPIResponse(Response):
    """
    Custom response class for Django REST Framework called CodesiriusAPIResponse.
    To provide a consistent and structured JSON response format for API endpoints.
    """

    def __init__(
        self, data=None, message="Success", status_code=status.HTTP_200_OK, **kwargs
    ):
        """
        Custom Initialization (__init__):
          Args:
             data: The actual data we want to send in the response body (optional).
             message: A human-readable message indicating the outcome of the request
                    (defaults to "Success").
             status_code: The HTTP status code of the response
                            (defaults to status.HTTP_200_OK,
                             which represents a successful request).
             **kwargs: Allows you to pass any additional keyword arguments that
                    the parent Response class might accept.
          Timestamp: It automatically generates a timestamp using
                    timezone.now().isoformat().replace("+00:00", "Z").
          This creates an ISO 8601 formatted timestamp in UTC,
            which is a common standard for API responses.
          Response Data Structure: It constructs a dictionary response_data
            with the following keys:
             "status": The HTTP status code.
             "message": The provided message.
             "timestamp": The generated timestamp.
             "data" (optional): If data is provided, it's included in the response.
        """
        timestamp = timezone.now().isoformat().replace("+00:00", "Z")
        response_data = {
            "status": status_code,
            "message": message,
            "timestamp": timestamp,
        }
        """
        Calling the Parent Constructor: Finally, it calls the __init__ method
        of the parent Response class
        (super().__init__(response_data, status=status_code, **kwargs))
        to create the actual HTTP response with the constructed response_data and
        the specified status_code.
        """
        if data is not None:
            response_data["data"] = data
        super().__init__(response_data, status=status_code, **kwargs)
