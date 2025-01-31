from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse


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
