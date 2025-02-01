from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import VerificationCode
from authentication.tests.test_auth_api import SIGNUP_URL


class VerificationCodeResendCheckAPITests(TestCase):
    """Test the verification code resend and check API"""

    def setUp(self):
        self.client = APIClient()
        self.fake = Faker()

    def generate_user_payload(self, password1=None, password2=None, override=None):
        password = password1 or self.fake.password()
        payload = {
            "first_name": self.fake.first_name(),
            "last_name": self.fake.last_name(),
            "email": self.fake.email(),
            "username": self.fake.user_name(),
            "password1": password,
            "password2": password2 or password,
        }
        if override:
            payload.update(override)
        return payload

    def test_resend_verification_code_with_valid_user_success(self):
        """Test resending verification code with valid user is successful"""
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        url = reverse("resend_verification_code", args=[user["user_id"]])
        res = self.client.patch(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_resend_verification_code_invalid_user_failure(self):
        """Test resending verification code with invalid user fails"""
        url = reverse("resend_verification_code", args=[self.fake.random_int()])
        res = self.client.patch(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_check_verification_code_with_invalid_user_failure(self):
        """Test checking verification code with invalid user fails"""
        url = reverse("check_verification_code", args=[self.fake.random_int()])
        code = self.fake.random_int()
        res = self.client.post(url, {"code": code})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_check_verification_code_without_code_failure(self):
        """Test checking verification code without code fails"""
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        url = reverse("check_verification_code", args=[user["user_id"]])
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_verification_code_with_invalid_code_failure(self):
        """Test checking verification code with invalid code fails"""
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        url = reverse("check_verification_code", args=[user["user_id"]])
        res = self.client.post(url, {"code": self.fake.random_int()})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_check_verification_code_with_valid_code_success(self):
        """Test checking verification code with valid code is successful"""
        payload = self.generate_user_payload()
        user = self.client.post(SIGNUP_URL, payload).data["data"]
        verification_code = VerificationCode.objects.get(user_id=user["user_id"])
        url = reverse("check_verification_code", args=[user["user_id"]])
        res = self.client.post(url, {"code": verification_code.code})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["data"]["is_active"])
        # cross-check the user is active
        user = get_user_model().objects.get(id=user["user_id"])
        self.assertTrue(user.is_active)
