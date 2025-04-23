from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse


class WhoAmIView(APIView):
    """
    API endpoint to retrieve the currently authenticated user's details.

    This view extends `APIView` and uses the `IsAuthenticated` permission
    class to ensure that only authenticated users can access it.  It returns
    a `CodesiriusAPIResponse` containing a dictionary with various user
    attributes.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieves and returns the details of the currently authenticated user.

        This method accesses the user object from the request and extracts
        relevant attributes such as ID, first name, last name, username,
        email, staff status, superuser status, active status, creation and
        update timestamps, and IDs of the creating and updating users.
        It then returns these details in a `CodesiriusAPIResponse`.

        Args:
            request (Request): The incoming HTTP request object.  The user
                object is accessed via `request.user`.

        Returns:
            CodesiriusAPIResponse: A custom API response with the user's details.
                The response data is a dictionary with the following keys:
                - "id" (int): The user's ID.
                - "firstName" (str): The user's first name.
                - "lastName" (str): The user's last name.
                - "username" (str): The user's username.
                - "email" (str): The user's email address.
                - "isStaff" (bool):  Indicates if the user is a staff member.
                - "isSuperuser" (bool): Indicates if the user is a superuser.
                - "isActive" (bool): Indicates if the user is active.
                - "createdAt" (datetime): The timestamp when the user was created.
                - "updatedAt" (datetime): The timestamp when the user was last updated.
                - "createdBy" (int, optional): The ID of the user who created this user,
                  or None if not available.
                - "updatedBy" (int, optional): The ID of the user who last updated this user,
                  or None if not available.
        """
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
