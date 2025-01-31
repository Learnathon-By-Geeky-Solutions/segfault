from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenVerifyView,
    TokenRefreshView,
)

from authentication.serializers import (
    SignupSerializer,
    SigninSerializer,
    CustomTokenVerifySerializer,
    CustomTokenRefreshSerializer,
)
from codesirius.codesirius_api_response import CodesiriusAPIResponse

User = get_user_model()


class SignupAPIView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return CodesiriusAPIResponse(
                data={"user_id": user.id, "is_active": user.is_active},
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


class TokenRefreshAPIView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["refresh"]:
            return CodesiriusAPIResponse(
                data=serializer.validated_data, message="Token refreshed"
            )
        raise ValidationError("Invalid refresh token")


class WhoAmIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_details = {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
            "is_active": request.user.is_active,
            "created_at": request.user.created_at,
            "updated_at": request.user.updated_at,
            "created_by": (
                request.user.created_by.id if request.user.created_by else None
            ),
            "updated_by": (
                request.user.updated_by.id if request.user.updated_by else None
            ),
        }
        return CodesiriusAPIResponse(data=user_details)
