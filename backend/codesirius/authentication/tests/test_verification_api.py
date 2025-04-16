from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import VerificationCode
from authentication.tests.test_auth_api import SIGNUP_URL


class VerificationCodeResendCheckAPITests(TestCase):
    """
    Test suite for the verification code resend and check API endpoints.

    This class contains test cases to verify the functionality of resending
    a verification code to a user and checking the validity of a provided
    verification code.
    """

    def setUp(self):
        """Set up for the test methods."""
        self.client = APIClient()
        self.fake = Faker()

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

    def test_resend_verification_code_with_valid_user_success(self):
        """
        Test resending a verification code for a valid user.

        This test ensures that when a valid user ID is provided, a new
        verification code is generated and the API returns a success status code.
        """
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        url = reverse("resend_verification_code", args=[user["userId"]])
        res = self.client.patch(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_resend_verification_code_invalid_user_failure(self):
        """
        Test resending a verification code for an invalid user.

        This test verifies that when an invalid user ID is provided, the API
        returns a 'Not Found' status code, indicating that the user does not exist.
        """
        url = reverse("resend_verification_code", args=[self.fake.random_int()])
        res = self.client.patch(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_check_verification_code_with_invalid_user_failure(self):
        """
        Test checking a verification code for an invalid user.

        This test ensures that when an attempt is made to check a verification
        code for a user that does not exist, the API returns a 'Not Found'
        status code.
        """
        url = reverse("check_verification_code", args=[self.fake.random_int()])
        code = self.fake.random_int()
        res = self.client.post(url, {"code": code})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_check_verification_code_without_code_failure(self):
        """
        Test checking a verification code without providing a code.

        This test verifies that when a request to check a verification code is
        made without including the 'code' in the request body, the API returns
        a 'Bad Request' status code.
        """
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        url = reverse("check_verification_code", args=[user["userId"]])
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_verification_code_with_invalid_code_failure(self):
        """
        Test checking a verification code with an invalid code.

        This test ensures that when a valid user ID is provided but the
        verification code in the request body does not match the one stored
        for the user, the API returns a 'Bad Request' status code.
        """
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        url = reverse("check_verification_code", args=[user["userId"]])
        res = self.client.post(url, {"code": self.fake.random_int()})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_verification_code_with_valid_code_success(self):
        """
        Test checking a verification code with a valid code.

        This test verifies that when a valid user ID and the correct
        verification code are provided, the API returns a success status code
        and indicates that the user is now active. It also cross-checks
        the user's 'is_active' status in the database.
        """
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        verification_code = VerificationCode.objects.get(user_id=user["userId"])
        url = reverse("check_verification_code", args=[user["userId"]])
        res = self.client.post(url, {"code": verification_code.code})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["data"]["isActive"])
        # cross-check the user is active
        user = get_user_model().objects.get(id=user["userId"])
        self.assertTrue(user.is_active)
