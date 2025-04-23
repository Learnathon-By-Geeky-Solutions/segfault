from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from authentication.models import VerificationCode
from authentication.serializers.signup import SignupSerializer
from codesirius.codesirius_api_response import CodesiriusAPIResponse

User = get_user_model()


class SignupAPIView(APIView):
    """
    API endpoint for user registration.

    This view handles user signups by accepting user data, validating it
    using the `SignupSerializer`, creating a new user, generating a
    verification code, and returning a success response.
    """

    def post(self, request):
        """
        Registers a new user.

        This method processes a POST request containing user registration data.
        It validates the data using the `SignupSerializer`. If the data is valid,
        it creates a new user, generates a verification code associated with
        the user, and returns a success response with the user's ID and
        initial active status.  If the data is invalid, it raises a
        `ValidationError` with the serializer errors.

        Args:
            request (Request): The incoming HTTP request object
                                containing the user data.

        Returns:
            CodesiriusAPIResponse: A custom API response with the following structure:
                {
                    "data": {
                        "userId": int,
                        "isActive": bool
                    },
                    "statusCode": int,
                    "message": str
                }
                The "data" contains the new user's ID and initial active status
                (which is typically False). The "statusCode" is set to
                201 (HTTP_CREATED) on success, and the "message" indicates
                the user creation status.

        Raises:
            ValidationError: If the provided user data is invalid according to the
                `SignupSerializer`'s validation rules.  The error details from the
                serializer are included in the response.
        """
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            VerificationCode.objects.create(user=user)
            return CodesiriusAPIResponse(
                data={"userId": user.id, "isActive": user.is_active},
                status_code=status.HTTP_201_CREATED,
                message="User created",
            )

        raise ValidationError(serializer.errors)
