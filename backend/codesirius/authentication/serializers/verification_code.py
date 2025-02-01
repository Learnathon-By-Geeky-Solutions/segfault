from rest_framework import serializers


class VerificationCodeSerializer(serializers.Serializer):
    code = serializers.CharField(
        max_length=6,
        required=True,
        error_messages={"required": "Verification code is required"},
    )
