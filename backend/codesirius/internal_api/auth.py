from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

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
        except APIKey.DoesNotExist:
            raise AuthenticationFailed("Invalid API key")

        return api_key_obj, None
