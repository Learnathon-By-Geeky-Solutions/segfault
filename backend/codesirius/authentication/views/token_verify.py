from rest_framework_simplejwt.views import TokenVerifyView

from authentication.serializers.token_verify import CodesiriusTokenVerifySerializer
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class TokenVerifyAPIView(TokenVerifyView):
    """
    API endpoint for verifying the validity of a JWT access token.

    This view extends `TokenVerifyView` from `rest_framework_simplejwt`
    to customize the serializer and response. It uses
    `CodesiriusTokenVerifySerializer` for serializing the token data
    and returns a `CodesiriusAPIResponse` indicating the verification status.
    """
    serializer_class = CodesiriusTokenVerifySerializer

    def post(self, request, *args, **kwargs):
        """
        Handles the POST request to verify a JWT token.

        This method takes a token, validates it using the serializer,
        and returns a `CodesiriusAPIResponse` with a success message
        if the token is valid.

        Args:
            request (Request): The incoming HTTP request object containing the token to verify.
            *args:  Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            CodesiriusAPIResponse: A custom API response with the message
                "Token verified".  The response has the following structure:
                {
                    "message": str
                }

        Raises:
            rest_framework.exceptions.ValidationError: If the serializer data is invalid
                (e.g., invalid or expired token).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return CodesiriusAPIResponse(message="Token verified")
