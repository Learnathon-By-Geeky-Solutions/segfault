from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
)


class CodesiriusTokenObtainPairSerializer(TokenObtainPairSerializer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].error_messages["required"] = "Username is required."
        self.fields["username"].error_messages["blank"] = "Username is required."

        self.fields["password"].error_messages["required"] = "Password is required."
        self.fields["password"].error_messages["blank"] = "Password is required."

    def validate(self, attrs):
        username_field = self.username_field
        credentials = {
            username_field: attrs[username_field],
            "password": attrs["password"],
        }

        user = authenticate(**credentials)
        if not user:
            raise AuthenticationFailed("Invalid credentials.")
        if not user.is_active:
            raise AuthenticationFailed("Account is not active.")
        return super().validate(attrs)
