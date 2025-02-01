from rest_framework.views import APIView

from authentication.serializers.check_verification_code import (
    CheckVerificationCodeSerializer,
)
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class CheckVerificationCodeAPIView(APIView):
    def post(self, request, user_id):
        """
        This method is used to verify the verification code for a user.
        """
        serializer = CheckVerificationCodeSerializer(
            data=request.data, context={"user_id": user_id}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.context["user"]
        user.is_active = True
        user.save()

        return CodesiriusAPIResponse(
            message="Verification successful",
            data={
                "user_id": user_id,
                "is_active": user.is_active,
            },
        )
