from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from authentication.models import VerificationCode
from authentication.serializers.signup import SignupSerializer
from codesirius.codesirius_api_response import CodesiriusAPIResponse

User = get_user_model()


class SignupAPIView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            VerificationCode.objects.create(user=user)
            return CodesiriusAPIResponse(
                data={"userId": user.id, "isActive": user.is_active},
                status_code=status.HTTP_201_CREATED,
                message="User created",
            )

        raise ValidationError(serializer.errors)
