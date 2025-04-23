from rest_framework.views import APIView

from authentication.utils.get_verification_code import get_verification_code
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class ResendVerificationCodeAPIView(APIView):
    """
    API endpoint to resend the verification code to a user's email.

    This view extends `APIView` and provides a `PATCH` method to handle
    the resending of verification codes.  It does not require any input
    data from the request body.  It retrieves the user and their associated
    verification code using the `get_verification_code` utility function,
    regenerates the code, and returns a success response with the user's ID
    and email.
    """

    def patch(self, _, user_id):
        """
        Resends the verification code to the user's registered email address.

            This method retrieves the user and their associated verification code,
            generates a new verification code, and sends it to the user's email.
            It then returns a `CodesiriusAPIResponse` indicating that the code
            has been resent.

            Args:
                _ (Request):  The incoming HTTP request object.  This parameter is
                    ignored in this method, as no data is expected in the request body.
                user_id (int): The ID of the user to whom the verification code
                    should be resent.  This is typically obtained from the URL path.

            Returns:
                CodesiriusAPIResponse:
                A custom API response with the following structure:
                    {
                        "data": {
                            "user_id": int,
                            "email": str
                        },
                        "message": str
                    }
                    The "data" contains the user's ID and email address, and the
                    "message" confirms that the verification code has been resent.

            **TODO: Make sure to throttle this endpoint to prevent abuse.
        """
        verification_code, user = get_verification_code(user_id)

        verification_code.regenerate_verification_code()
        return CodesiriusAPIResponse(
            data={"user_id": user_id, "email": user.email},
            message="Verification code has been resent",
        )
