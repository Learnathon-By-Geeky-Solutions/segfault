import logging

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

logger = logging.getLogger(__name__)


class CodesiriusTokenRefreshSerializer(TokenRefreshSerializer):
    refresh = serializers.CharField(
        required=True,
        error_messages={
            "null": "Refresh token is required",
            "required": "Refresh token is required",
            "blank": "Refresh token is required",
        },
    )

    def validate(self, data):
        try:
            res = super().validate(data)
            return res
        except TokenError as e:
            raise ValidationError({"refresh": str(e)})
        except get_user_model().DoesNotExist:
            raise ValidationError({"refresh": "User not found"})
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            raise ValidationError({"refresh": "Error refreshing token"})
