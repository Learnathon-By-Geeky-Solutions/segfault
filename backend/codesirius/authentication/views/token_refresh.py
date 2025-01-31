from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenRefreshView

from authentication.serializers.token_refresh import CodesiriusTokenRefreshSerializer
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class TokenRefreshAPIView(TokenRefreshView):
    serializer_class = CodesiriusTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return CodesiriusAPIResponse(
            data=serializer.validated_data, message="Token refreshed"
        )
