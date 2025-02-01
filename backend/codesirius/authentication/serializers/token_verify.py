from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenVerifySerializer


class CodesiriusTokenVerifySerializer(TokenVerifySerializer):
    token = serializers.CharField(
        required=True,
        error_messages={
            "required": "Token is required",
            "blank": "Token is required",
        },
    )

    def validate(self, data):
        try:
            return super().validate(data)
        except TokenError as e:
            raise ValidationError({"token": str(e)})
