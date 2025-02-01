from rest_framework_simplejwt.views import (
    TokenObtainPairView,
)

from authentication.serializers.token_obtain_pair import (
    CodesiriusTokenObtainPairSerializer,
)
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class TokenObtainPairAPIView(TokenObtainPairView):
    serializer_class = CodesiriusTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return CodesiriusAPIResponse(
            data=serializer.validated_data, message="Signin successful"
        )
