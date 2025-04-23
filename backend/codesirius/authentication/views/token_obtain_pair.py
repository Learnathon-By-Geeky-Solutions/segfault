from rest_framework_simplejwt.views import (
    TokenObtainPairView,
)

from authentication.serializers.token_obtain_pair import (
    CodesiriusTokenObtainPairSerializer,
)
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class TokenObtainPairAPIView(TokenObtainPairView):
    """
    API endpoint for obtaining JWT access and refresh tokens upon user sign-in.

    This view extends `TokenObtainPairView` from `rest_framework_simplejwt`
    to customize the token serialization and response. It uses
    `CodesiriusTokenObtainPairSerializer` for serializing the token data
    and returns a `CodesiriusAPIResponse` with the tokens.
    """

    serializer_class = CodesiriusTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        """
        Handles the POST request to obtain JWT tokens.

        This method retrieves the token data using the serializer, validates,
        and returns it in a `CodesiriusAPIResponse`.

        Args:
            request (Request): The incoming HTTP request object
                                containing the user credentials.
            *args:  Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            CodesiriusAPIResponse: A custom API response with the following structure:
                {
                    "data": {
                        "access": str,
                        "refresh": str,
                        ...
                    },
                    "message": str
                }
                The "data" contains the access and refresh tokens (and any other data
                returned by the serializer).
                The "message" is "Signin successful".

        Raises:
            rest_framework.exceptions.AuthenticationFailed: If authentication fails.
            rest_framework.exceptions.ValidationError:
                                                    If the serializer data is invalid.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return CodesiriusAPIResponse(
            data=serializer.validated_data, message="Signin successful"
        )
