from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from datetime import timedelta

from authentication.tests.test_auth_api import SIGNUP_URL

User = get_user_model()


class TokenVerifyAPITests(TestCase):
    """
    Test suite for the token verification API endpoint.

    This class contains test cases to verify the functionality of the token
    verification endpoint, including successful verification of valid tokens
    and proper error handling for invalid tokens.
    """

    def setUp(self):
        """Set up for the test methods."""
        self.client = APIClient()
        self.fake = Faker()
        self.verify_url = reverse("token_verify")

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

    def test_verify_valid_token_success(self):
        """
        Test verifying a valid token is successful.

        This test ensures that when a valid JWT token is provided,
        the API returns a success status code and the expected message.
        """
        # Create a user and get their token
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        user_obj = User.objects.get(id=user["userId"])
        token = AccessToken.for_user(user_obj)

        # Verify the token
        res = self.client.post(self.verify_url, {"token": str(token)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Token verified")

    def test_verify_invalid_token_failure(self):
        """
        Test verifying an invalid token fails.

        This test verifies that when an invalid token is provided,
        the API returns a 'Bad Request' status code.
        """
        res = self.client.post(self.verify_url, {"token": "invalid_token"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_missing_token_failure(self):
        """
        Test verifying without providing a token fails.

        This test ensures that when no token is provided in the request,
        the API returns a 'Bad Request' status code.
        """
        res = self.client.post(self.verify_url, {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_expired_token_failure(self):
        """
        Test verifying an expired token fails.

        This test verifies that when an expired token is provided,
        the API returns a 'Bad Request' status code.
        """
        # Create a user and get their token
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        user_obj = User.objects.get(id=user["userId"])
        token = AccessToken.for_user(user_obj)

        # Manually expire the token by setting its expiration time to the past
        token.set_exp(lifetime=timedelta(days=-1))  # Set expiration to 1 day in past

        # Verify the expired token
        res = self.client.post(self.verify_url, {"token": str(token)})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_token_with_invalid_signature_failure(self):
        """
        Test verifying a token with an invalid signature fails.

        This test verifies that when a token with an invalid signature
        is provided, the API returns a 'Bad Request' status code.
        """
        # Create a user and get their token
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        user_obj = User.objects.get(id=user["userId"])
        token = AccessToken.for_user(user_obj)

        # Modify the token to have an invalid signature
        token_str = str(token)
        modified_token = token_str[:-1] + "X"  # Change the last character

        # Verify the modified token
        res = self.client.post(self.verify_url, {"token": modified_token})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
