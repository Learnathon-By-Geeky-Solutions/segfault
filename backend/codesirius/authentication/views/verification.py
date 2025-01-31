from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.views import APIView
from authentication.models import VerificationCode
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class VerificationCodeAPIView(APIView):
    def get(self, request, user_id):
        """
        This method is used to get the verification code for a user to their email.
        This function is used to resend the verification code to the user.

        TODO: Make sure to throttle this endpoint to prevent abuse.
        """
        # check if user is already verified (aka. active)
        user = get_user_model().objects.get(id=user_id)
        if user.is_active:
            exc = APIException("User is already verified")
            exc.status_code = status.HTTP_409_CONFLICT
            raise exc

        verification_code = VerificationCode.objects.filter(user_id=user_id).first()
        verification_code.regenerate_verification_code()
        return CodesiriusAPIResponse(data={"user_id": user_id, "email": user.email})
