from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenVerifyView
from yaml import serialize

from authentication.serializers import (
    SignupSerializer,
    SigninSerializer,
    TokenVerifySerializer,
    CustomTokenVerifySerializer,
)
from codesirius.codesirius_api_response import CodesiriusAPIResponse

User = get_user_model()


class SignupAPIView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return CodesiriusAPIResponse(
                data={"user_id": user.id},
                status_code=status.HTTP_201_CREATED,
                message="User created",
            )

        raise ValidationError(serializer.errors)


class SigninAPIView(TokenObtainPairView):
    serializer_class = SigninSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return CodesiriusAPIResponse(
            data=serializer.validated_data, message="Signin successful"
        )


class TokenVerifyAPIView(TokenVerifyView):
    serializer_class = CustomTokenVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return CodesiriusAPIResponse(
            data=serializer.validated_data, message="Token verified"
        )
