from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer


class CodesiriusTokenRefreshSerializer(TokenRefreshSerializer):
    refresh = serializers.CharField(
        required=True,
        error_messages={
            "required": "Refresh token is required",
            "blank": "Refresh token is required",
        },
    )

    def validate(self, data):
        try:
            return super().validate(data)
        except TokenError as e:
            raise ValidationError({"refresh": str(e)})
