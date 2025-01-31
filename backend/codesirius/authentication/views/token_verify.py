from rest_framework_simplejwt.views import TokenVerifyView

from authentication.serializers.token_verify import CodesiriusTokenVerifySerializer
from codesirius.codesirius_api_response import CodesiriusAPIResponse


class TokenVerifyAPIView(TokenVerifyView):
    serializer_class = CodesiriusTokenVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return CodesiriusAPIResponse(
            data=serializer.validated_data, message="Token verified"
        )
