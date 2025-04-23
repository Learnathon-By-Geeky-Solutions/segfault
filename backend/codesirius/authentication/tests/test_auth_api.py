"""
Test cases for the authentication API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

SIGNUP_URL = reverse("signup")


def create_user(**params):
    # convert camelCase to snake_case
    params["first_name"] = params.pop("firstName")
    params["last_name"] = params.pop("lastName")

    params.pop("password2")
    params["password"] = params.pop("password1")
    return get_user_model().objects.create_user(**params)


class AuthenticationApiTests(TestCase):
    """
    Test case for the public authentication API.

    This class contains test methods to verify the functionality of the
    authentication API endpoints, specifically the signup endpoint.  It
    uses Django's test framework and the Faker library to generate realistic
    test data.
    """

    def setUp(self):
        """
        Set up the test environment.

        This method is called before each test method is executed.  It
        initializes the following:
            'self.client': An APIClient instance to make requests to the API.
            'self.fake': A Faker instance to generate fake data for user
            attributes.
        """
        self.client = APIClient()
        self.fake = Faker()

    def generate_user_payload(self, password1=None, password2=None, override=None):
        """
        Generate a valid user payload with fake data.

        Args:
            password1 (str, optional): The password. If None, a random
                password is generated.
            password2 (str, optional): The password confirmation. If None,
                it defaults to the value of password1.
            override (dict, optional): A dictionary of fields to override
                in the generated payload.

        Returns:
            dict: A dictionary containing user data (first name, last name,
                email, username, password, and password confirmation).
        """
        if not password1:
            password1 = self.fake.password()
        if not password2:
            password2 = password1
        payload = {
            "firstName": self.fake.first_name(),
            "lastName": self.fake.last_name(),
            "email": self.fake.email(),
            "username": self.fake.user_name(),
            "password1": password1,
            "password2": password2,
        }
        if override:
            payload.update(override)
        return payload

    def test_signup_valid_user_success(self):
        """Test signing up with valid payload is successful"""
        payload = self.generate_user_payload()
        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = get_user_model().objects.get(email=payload["email"])
        self.assertTrue(user.check_password(payload["password1"]))

    def test_signup_user_with_existing_email_fails(self):
        """Test signing up with existing email fails"""
        payload = self.generate_user_payload()
        create_user(**payload)
        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_user_with_existing_username_fails(self):
        """Test signing up with existing username fails"""
        payload = self.generate_user_payload()
        create_user(**payload)
        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_user_with_short_password_fails(self):
        """Test signing up with short password fails"""
        short_password = self.fake.password(length=5)  # Generate a short password
        payload = self.generate_user_payload(
            password1=short_password, password2=short_password
        )

        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        user_exists = get_user_model().objects.filter(email=payload["email"]).exists()
        self.assertFalse(user_exists)

    def test_signup_user_with_mismatched_passwords_fails(self):
        """Test signing up with mismatched passwords fails"""
        payload = self.generate_user_payload(
            password2="testpassword1", password1="testpassword"
        )

        res = self.client.post(SIGNUP_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
