from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.serializers.check_verification_code import (
    CheckVerificationCodeSerializer,
)
from codesirius.codesirius_api_response import CodesiriusAPIResponse


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


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

        tokens = get_tokens_for_user(user)

        return CodesiriusAPIResponse(
            message="Verification successful",
            data={
                "userId": user_id,
                "isActive": user.is_active,
                "tokens": tokens,
            },
        )
