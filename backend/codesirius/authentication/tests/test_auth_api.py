"""
Test cases for the authentication API
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework.test import APIClient
from rest_framework import status

SIGNUP_URL = reverse("signup")


def create_user(**params):
    params.pop("password2")
    params["password"] = params.pop("password1")
    return get_user_model().objects.create_user(**params)


class AuthenticationApiTests(TestCase):
    """Test the public authentication API"""

    def setUp(self):
        self.client = APIClient()

    def test_signup_valid_user_success(self):
        """Test signing up with valid payload is successful"""
        payload = {
            "first_name": "test",
            "last_name": "user",
            "email": "test@example.com",
            "username": "testuser",
            "password1": "testpassword",
            "password2": "testpassword",
        }

        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = get_user_model().objects.get(email=payload["email"])
        self.assertTrue(user.check_password(payload["password1"]))

    def test_signup_user_with_existing_email_fails(self):
        """Test signing up with existing email fails"""
        payload = {
            "first_name": "test",
            "last_name": "user",
            "email": "test@example.com",
            "username": "testuser",
            "password1": "testpassword",
            "password2": "testpassword",
        }
        create_user(**payload)
        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_user_with_existing_username_fails(self):
        """Test signing up with existing username fails"""
        payload = {
            "first_name": "test",
            "last_name": "user",
            "email": "test@example.com",
            "username": "testuser",
            "password1": "testpassword",
            "password2": "testpassword",
        }
        create_user(**payload)
        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_user_with_short_password_fails(self):
        """Test signing up with short password fails"""
        payload = {
            "first_name": "test",
            "last_name": "user",
            "email": "test@example.com",
            "username": "testuser",
            "password1": "pw",
            "password2": "pw",
        }

        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        user_exists = get_user_model().objects.filter(email=payload["email"]).exists()
        self.assertFalse(user_exists)

    def test_signup_user_with_mismatched_passwords_fails(self):
        """Test signing up with mismatched passwords fails"""
        payload = {
            "first_name": "test",
            "last_name": "user",
            "email": "test@example.com",
            "username": "testuser",
            "password1": "testpassword",
            "password2": "testpassword1",
        }

        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
