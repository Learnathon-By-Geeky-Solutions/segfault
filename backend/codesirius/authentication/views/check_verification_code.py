from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.serializers.check_verification_code import (
    CheckVerificationCodeSerializer,
)
from codesirius.codesirius_api_response import CodesiriusAPIResponse


def get_tokens_for_user(user):
       """
    Generates JWT refresh and access tokens for a given user.
    Args:
        user: An instance of the user model.
    RefreshToken.for_user(user) creates a new RefreshToken instance associated with the provided user.
    Returns:
        dict: A dictionary containing the refresh and access tokens.
            
    """
    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class CheckVerificationCodeAPIView(APIView):
      """
    API endpoint to check the user's verification code and activate the user account.

      Accepts POST requests with the verification code.
      Requires the user ID to be passed in the URL path.
      Uses the CheckVerificationCodeSerializer to validate the request data.
      Upon successful verification, sets the user's `is_active` status to True.
      Returns JWT refresh and access tokens for the activated user.
    """
    def post(self, request, user_id):
         """
        This method is used to verify the verification code for a user.

        Args:
            request (HttpRequest): The incoming HTTP request object.
            user_id (int): The ID of the user to verify. This is expected to be
                           part of the URL path.

        Returns:
            CodesiriusAPIResponse: A custom API response indicating the success
                                   of the verification and containing user details
                                   and authentication tokens. The response data
                                   will have the following structure:
            {
                "userId": int,
                "isActive": bool,
                "tokens": {
                    "refresh": str,
                    "access": str
                }
            }

        Raises:
            serializers.ValidationError: If the provided verification code is
                                         invalid or does not match the one associated
                                         with the given user ID. The error details
                                         will be included in the API response.
        """
        # Initialize the CheckVerificationCodeSerializer with the request data and
        # the user_id from the URL path passed in the context.
        serializer = CheckVerificationCodeSerializer(
            data=request.data, context={"user_id": user_id}
        )
        serializer.is_valid(raise_exception=True)
        # If the serializer is valid, the validated user object (retrieved based
        # on the provided user_id and the matching verification code) is available
        # in the serializer's context.
        user = serializer.context["user"]
        # Set the user's 'is_active' field to True, effectively activating the user account.
        user.is_active = True
        # Save the changes to the user object in the database.
        user.save()
        # Generate new JWT refresh and access tokens for the now active user.
        tokens = get_tokens_for_user(user)

        return CodesiriusAPIResponse(
            message="Verification successful",
            data={
                "userId": user_id,
                "isActive": user.is_active,
                "tokens": tokens,
            },
        )
