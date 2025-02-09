from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse


class WhoAmIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_details = {
            "id": request.user.id,
            "firstName": request.user.first_name,
            "lastName": request.user.last_name,
            "username": request.user.username,
            "email": request.user.email,
            "isStaff": request.user.is_staff,
            "isSuperuser": request.user.is_superuser,
            "isActive": request.user.is_active,
            "createdAt": request.user.created_at,
            "updatedAt": request.user.updated_at,
            "createdBy": (
                request.user.created_by.id if request.user.created_by else None
            ),
            "updatedBy": (
                request.user.updated_by.id if request.user.updated_by else None
            ),
        }
        return CodesiriusAPIResponse(data=user_details)
