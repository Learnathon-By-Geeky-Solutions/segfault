from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from authentication.utils.get_verification_code import get_verification_code


class CheckVerificationCodeSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=6,
        required=True,
        error_messages={"required": "Verification code is required"},
    )

    def validate(self, attrs):
        user_id = self.context["user_id"]
        verification_code, user = get_verification_code(user_id)

        # Validate the expiration of the verification code
        if not verification_code.is_valid():
            raise ValidationError({"code": "Verification code is expired"})

        if verification_code.code != attrs["code"]:
            raise ValidationError({"code": "Invalid verification code"})
        self.context["user"] = user
        return attrs
