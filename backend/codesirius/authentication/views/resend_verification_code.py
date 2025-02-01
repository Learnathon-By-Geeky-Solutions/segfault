from rest_framework.views import APIView

from authentication.utils.get_verification_code import get_verification_code
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class ResendVerificationCodeAPIView(APIView):
    def patch(self, _, user_id):
        """
        This method is used to get the verification code for a user to their email.
        This function is used to resend the verification code to the user.
        Notice that this APIView doesn't require serialization.

        TODO: Make sure to throttle this endpoint to prevent abuse.
        """
        verification_code, user = get_verification_code(user_id)

        verification_code.regenerate_verification_code()
        return CodesiriusAPIResponse(
            data={"user_id": user_id, "email": user.email},
            message="Verification code has been resent",
        )
