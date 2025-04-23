from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from authentication.tests.test_auth_api import SIGNUP_URL

User = get_user_model()


class TokenObtainPairAPITests(TestCase):
    """
    Test suite for the token obtain pair API endpoint.

    This class contains test cases to verify the functionality of obtaining
    JWT access and refresh tokens upon user sign-in, including successful
    authentication and proper error handling for various scenarios.
    """

    def setUp(self):
        """Set up for the test methods."""
        self.client = APIClient()
        self.fake = Faker()
        self.obtain_url = reverse("signin")

    def generate_user_payload(self, password1=None, password2=None, override=None):
        """Generate a valid user payload for signup."""
        password = password1 or self.fake.password()
        payload = {
            "firstName": self.fake.first_name(),
            "lastName": self.fake.last_name(),
            "email": self.fake.email(),
            "username": self.fake.user_name(),
            "password1": password,
            "password2": password2 or password,
        }
        if override:
            payload.update(override)
        return payload

    def test_obtain_token_with_valid_credentials_success(self):
        """
        Test obtaining tokens with valid credentials is successful.

        This test ensures that when valid username and password are provided,
        the API returns a success status code and the expected tokens.
        """
        # Create a user and activate their account
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        user_obj = User.objects.get(id=user["userId"])
        user_obj.is_active = True
        user_obj.save()

        # Obtain tokens
        res = self.client.post(
            self.obtain_url,
            {"username": payload["username"], "password": payload["password1"]},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data["data"])
        self.assertIn("refresh", res.data["data"])
        self.assertEqual(res.data["message"], "Signin successful")

    def test_obtain_token_with_invalid_username_failure(self):
        """
        Test obtaining tokens with invalid username fails.

        This test verifies that when an invalid username is provided,
        the API returns a 'Unauthorized' status code.
        """
        res = self.client.post(
            self.obtain_url,
            {"username": "invalid_username", "password": "testpassword"},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_with_invalid_password_failure(self):
        """
        Test obtaining tokens with invalid password fails.

        This test verifies that when an invalid password is provided,
        the API returns a 'Unauthorized' status code.
        """
        # Create a user and activate their account
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        user_obj = User.objects.get(id=user["userId"])
        user_obj.is_active = True
        user_obj.save()

        # Try to obtain tokens with wrong password
        res = self.client.post(
            self.obtain_url,
            {"username": payload["username"], "password": "wrongpassword"},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_with_inactive_account_failure(self):
        """
        Test obtaining tokens with inactive account fails.

        This test verifies that when credentials for an inactive account
        are provided, the API returns a 'Unauthorized' status code.
        """
        # Create a user (account is inactive by default)
        payload = self.generate_user_payload()
        self.client.post(SIGNUP_URL, payload)

        # Try to obtain tokens
        res = self.client.post(
            self.obtain_url,
            {"username": payload["username"], "password": payload["password1"]},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_with_missing_username_failure(self):
        """
        Test obtaining tokens without username fails.

        This test ensures that when no username is provided in the request,
        the API returns a 'Bad Request' status code.
        """
        res = self.client.post(self.obtain_url, {"password": "testpassword"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_with_missing_password_failure(self):
        """
        Test obtaining tokens without password fails.

        This test ensures that when no password is provided in the request,
        the API returns a 'Bad Request' status code.
        """
        res = self.client.post(self.obtain_url, {"username": "testuser"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_with_empty_username_failure(self):
        """
        Test obtaining tokens with empty username fails.

        This test verifies that when an empty username is provided,
        the API returns a 'Bad Request' status code.
        """
        res = self.client.post(
            self.obtain_url, {"username": "", "password": "testpassword"}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_obtain_token_with_empty_password_failure(self):
        """
        Test obtaining tokens with empty password fails.

        This test verifies that when an empty password is provided,
        the API returns a 'Bad Request' status code.
        """
        res = self.client.post(
            self.obtain_url, {"username": "testuser", "password": ""}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
