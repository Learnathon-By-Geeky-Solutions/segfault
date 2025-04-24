from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, ValidationError

from internal_api.models import APIKey


class APIAuthentication(BaseAuthentication):
    """
    Custom API authentication class to interact with internal API
    """

    def authenticate(self, request):
        api_key = request.headers.get("X-API-KEY")
        if not api_key:
            raise AuthenticationFailed()

        api_key_hash = APIKey.hash_key(api_key)
        try:
            api_key_obj = APIKey.objects.get(key=api_key_hash, is_active=True)
            if api_key_obj.expires_at and api_key_obj.expires_at < timezone.now():
                raise ValidationError({"x-api-key": "API key has expired"})
        except APIKey.DoesNotExist:
            raise AuthenticationFailed()

        return api_key_obj, None
