from rest_framework import status
from rest_framework.test import APITestCase

from authentication.models import CustomUser


class UserSignupTestCase(APITestCase):
    def setUp(self):
        data = {
            "full_name": "Test User",
            "username": "testuser",
            "email": "testuser@gmail.com",
            "password1": "testpassword",
            "password2": "testpassword",
        }
        self.user = CustomUser.objects.create_user(
            username=data["username"], email=data["email"], password=data["password1"]
        )
        self.signin_url = "/api/v1/signin"

    def test_signin(self):
        response = self.client.post(
            self.signin_url, {"email": "testuser@gmail.com", "password": "testpassword"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("user_id" in response.data)
