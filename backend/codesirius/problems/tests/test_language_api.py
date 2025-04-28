"""
Test cases for the Language API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from problems.models import Language

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


def create_language(**params):
    """Create and return a sample language."""
    defaults = {
        "name": fake.unique.word(),
        "version": fake.numerify("##.##.##"),  # Generates version like "12.34.56"
    }
    defaults.update(params)
    return Language.objects.create(**defaults)


class LanguageApiTests(TestCase):
    """Test case for the Language API."""

    def setUp(self):
        """Set up the test environment."""
        self.client = APIClient()
        self.user = create_user()
        self.client.force_authenticate(user=self.user)

    def test_list_languages_success(self):
        """Test listing all languages successfully."""
        # Create some test languages
        language1 = create_language()
        language2 = create_language()

        url = reverse("language-list-create")
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 2)
        self.assertEqual(res.data["data"][0]["name"], language1.name)
        self.assertEqual(res.data["data"][1]["name"], language2.name)

    def test_create_language_success(self):
        """Test creating a new language successfully."""
        payload = {"name": "Python", "version": "3.9.0"}

        url = reverse("language-list-create")
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", res.data["data"])
        self.assertEqual(res.data["message"], "Language created")

    def test_create_language_duplicate_fails(self):
        """Test creating a duplicate language fails."""
        # Create a language first
        create_language(name="Python", version="3.9.0")

        payload = {"name": "Python", "version": "3.9.0"}

        url = reverse("language-list-create")
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", str(res.data))

    def test_create_language_invalid_version_fails(self):
        """Test creating a language with invalid version fails."""
        payload = {
            "name": "Python",
            "version": "",  # Empty version should fail due to MinLengthValidator
        }

        url = reverse("language-list-create")
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("version", str(res.data))

    def test_retrieve_language_success(self):
        """Test retrieving a language successfully."""
        language = create_language()

        url = reverse("language-retrieve-update-destroy", args=[language.id])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["name"], language.name)
        self.assertEqual(res.data["data"]["version"], language.version)

    def test_retrieve_nonexistent_language_fails(self):
        """Test retrieving a non-existent language fails."""
        url = reverse("language-retrieve-update-destroy", args=[999])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_language_success(self):
        """Test updating a language successfully."""
        language = create_language()
        payload = {"name": "Updated Python", "version": "3.10.0"}

        url = reverse("language-retrieve-update-destroy", args=[language.id])
        res = self.client.put(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["id"], language.id)
        self.assertEqual(res.data["message"], "Language updated")

        # Verify the update
        language.refresh_from_db()
        self.assertEqual(language.name, "Updated Python")
        self.assertEqual(language.version, "3.10.0")

    def test_partial_update_language_success(self):
        """Test partially updating a language successfully."""
        language = create_language()
        payload = {"version": "3.10.0"}  # Only update version

        url = reverse("language-retrieve-update-destroy", args=[language.id])
        res = self.client.patch(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Language partially updated")

        # Verify the update
        language.refresh_from_db()
        self.assertEqual(language.version, "3.10.0")

    def test_delete_language_success(self):
        """Test deleting a language successfully."""
        language = create_language()

        url = reverse("language-retrieve-update-destroy", args=[language.id])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Language deleted")
        self.assertFalse(Language.objects.filter(id=language.id).exists())

    def test_delete_nonexistent_language_fails(self):
        """Test deleting a non-existent language fails."""
        url = reverse("language-retrieve-update-destroy", args=[999])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthorized_access_fails(self):
        """Test that unauthorized access to language endpoints fails."""
        self.client.force_authenticate(user=None)

        # Test list/create endpoint
        url = reverse("language-list-create")
        res = self.client.get(url)
        self.assertEqual(
            res.status_code, status.HTTP_200_OK
        )  # GET is allowed for unauthenticated users

        res = self.client.post(url, {"name": "Python", "version": "3.9.0"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test retrieve/update/delete endpoint
        language = create_language()
        url = reverse("language-retrieve-update-destroy", args=[language.id])

        res = self.client.get(url)
        self.assertEqual(
            res.status_code, status.HTTP_200_OK
        )  # GET is allowed for unauthenticated users

        res = self.client.put(url, {"name": "Python", "version": "3.9.0"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
