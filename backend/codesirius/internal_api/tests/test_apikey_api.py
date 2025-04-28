"""
Test cases for the API Key API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from internal_api.models.apikey import APIKey

fake = Faker()


def create_user(**params):
    """Create and return a sample user."""
    defaults = {
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.unique.email(),
        "username": fake.unique.user_name(),
        "password": "testpass123",
    }
    defaults.update(params)
    return get_user_model().objects.create_user(**defaults)


def create_staff_user(**params):
    """Create and return a sample staff user."""
    defaults = {
        "is_staff": True,
    }
    defaults.update(params)
    return create_user(**defaults)


def create_apikey(created_by=None, **params):
    """Create and return a sample API key."""
    raw_key, hashed_key = APIKey.generate_key()
    defaults = {
        "name": fake.word(),
        "key": hashed_key,
        "created_by": created_by or create_staff_user(),
    }
    defaults.update(params)
    return APIKey.objects.create(**defaults)


class APIKeyApiTests(TestCase):
    """Test case for the API Key API."""

    def setUp(self):
        """Set up the test environment."""
        self.client = APIClient()
        self.user = create_staff_user()
        self.client.force_authenticate(user=self.user)

    def test_list_apikeys_success(self):
        """Test listing all API keys successfully."""
        # Create some test API keys
        apikey1 = create_apikey(created_by=self.user)
        apikey2 = create_apikey(created_by=self.user)

        url = reverse("apikey-list-create")
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 2)
        self.assertEqual(res.data["data"][0]["name"], apikey1.name)
        self.assertEqual(res.data["data"][1]["name"], apikey2.name)
        # Verify that the key is not included in the response
        self.assertNotIn("key", res.data["data"][0])
        self.assertNotIn("key", res.data["data"][1])

    def test_list_apikeys_unauthorized(self):
        """Test listing API keys without staff permission fails."""
        self.user.is_staff = False
        self.user.save()
        self.client.force_authenticate(user=self.user)

        url = reverse("apikey-list-create")
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_apikey_success(self):
        """Test creating a new API key successfully."""
        payload = {
            "name": "Test API Key",
        }

        url = reverse("apikey-list-create")
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["message"], "API key created")
        self.assertEqual(res.data["data"]["name"], payload["name"])
        # Verify that the key is included in the response
        self.assertIn("key", res.data["data"])

    def test_create_apikey_unauthorized(self):
        """Test creating an API key without staff permission fails."""
        self.user.is_staff = False
        self.user.save()
        self.client.force_authenticate(user=self.user)

        payload = {
            "name": "Test API Key",
        }

        url = reverse("apikey-list-create")
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_apikey_success(self):
        """Test deleting an API key successfully."""
        apikey = create_apikey(created_by=self.user)

        url = reverse("apikey-destroy", args=[apikey.id])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "API key deleted")
        self.assertFalse(APIKey.objects.filter(id=apikey.id).exists())

    def test_delete_apikey_not_found(self):
        """Test deleting a non-existent API key fails."""
        url = reverse("apikey-destroy", args=[999])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_apikey_unauthorized(self):
        """Test deleting an API key without staff permission fails."""
        self.user.is_staff = False
        self.user.save()
        self.client.force_authenticate(user=self.user)

        apikey = create_apikey(created_by=self.user)

        url = reverse("apikey-destroy", args=[apikey.id])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
