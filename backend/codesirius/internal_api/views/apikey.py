from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from internal_api.models.apikey import APIKey
from internal_api.serializers.apikey import APIKeySerializer


class IsStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff


class APIKeyListCreateAPIView(APIView):
    permission_classes = [IsStaff]

    def get(self, request: Request) -> CodesiriusAPIResponse:
        api_keys = APIKey.objects.filter(created_by=request.user)
        serializer = APIKeySerializer(api_keys, many=True)
        # remove the key from the response
        for data in serializer.data:
            data.pop("key")
        return CodesiriusAPIResponse(data=serializer.data)

    def post(self, request: Request) -> CodesiriusAPIResponse:
        serializer = APIKeySerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            api_key = serializer.save(created_by=request.user)
            return CodesiriusAPIResponse(
                data=APIKeySerializer(api_key).data,
                status_code=status.HTTP_201_CREATED,
                message="API key created",
            )


class APIKeyDestroyAPIView(APIView):
    permission_classes = [IsStaff]

    def delete(self, request: Request, api_key_id: int) -> CodesiriusAPIResponse:
        try:
            api_key = APIKey.objects.get(id=api_key_id)
        except APIKey.DoesNotExist:
            raise NotFound("API key not found")
        api_key.delete()
        return CodesiriusAPIResponse(message="API key deleted")
