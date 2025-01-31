from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.views import APIView
from authentication.models import VerificationCode
from authentication.serializers.verification_code import VerificationCodeSerializer
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

    def post(self, request, user_id):
        """
        This method is used to verify the verification code for a user.
        """
        serializer = VerificationCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        verification_code = VerificationCode.objects.filter(user_id=user_id).first()
        user = verification_code.user  # is this necessary? (guess not)
        if not verification_code:
            raise NotFound("Verification code not found")
        if user.is_active:
            raise NotFound("Requested resource not found")
        if verification_code.is_valid():
            raise ValidationError({"code": "Verification code is expired"})
        if verification_code.code != serializer.validated_data["code"]:
            raise ValidationError({"code": "Invalid verification code"})

        verification_code.mark_as_used()
        user.is_active = True
        user.save()
        # TODO: implement mark_as_active method in the user model

        return CodesiriusAPIResponse(
            data={"user_id": user_id, "email": user.email, "is_active": user.is_active}
        )
