from rest_framework_simplejwt.views import TokenRefreshView

from authentication.serializers.token_refresh import CodesiriusTokenRefreshSerializer
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class TokenRefreshAPIView(TokenRefreshView):
    """
    API endpoint for refreshing JWT access tokens using a refresh token.

    This view extends `TokenRefreshView` from `rest_framework_simplejwt`
    to customize the serializer and response. It uses
    `CodesiriusTokenRefreshSerializer` for serializing the refresh token
    data and returns a `CodesiriusAPIResponse` with the new access token.
    """

    serializer_class = CodesiriusTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        """
        Handles the POST request to refresh the access token.

        This method takes a refresh token, validates it using the serializer,
        and returns a new access token in a `CodesiriusAPIResponse`.

        Args:
            request (Request): The incoming HTTP request object
                                containing the refresh token.
            *args:  Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            CodesiriusAPIResponse: A custom API response with the following structure:
                {
                    "data": {
                        "access": str,
                        ...
                    },
                    "message": str
                }
                The "data" contains the new access token (and any other data
                returned by the serializer).
                The "message" is "Token refreshed".

        Raises:
            rest_framework.exceptions.ValidationError:
            If the serializer data is invalid
            (e.g., invalid or expired refresh token).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return CodesiriusAPIResponse(
            data=serializer.validated_data, message="Token refreshed"
        )
