"""
Test cases for the Tag API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from problems.models import Tag

TAG_LIST_URL = reverse("tag-list-create")
TAG_DETAIL_URL = reverse("tag-retrieve-update-destroy", args=[1])


def create_tag(**params):
    """Create and return a sample tag."""
    defaults = {
        "name": "Test Tag",
        "description": "Test Description",
    }
    defaults.update(params)
    return Tag.objects.create(**defaults)


def create_user(**params):
    """Create and return a sample user."""
    defaults = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123",
    }
    defaults.update(params)
    return get_user_model().objects.create_user(**defaults)


class TagApiTests(TestCase):
    """
    Test case for the Tag API.

    This class contains test methods to verify the functionality of the
    Tag API endpoints, including listing, creating, retrieving, updating,
    and deleting tags.
    """

    def setUp(self):
        """Set up the test environment."""
        self.client = APIClient()
        self.fake = Faker()
        self.user = create_user()
        self.admin_user = create_user(
            email="admin@example.com",
            username="adminuser",
            is_staff=True,
        )
        # Authenticate the client with the admin user by default
        self.client.force_authenticate(user=self.admin_user)

    def test_list_tags_success(self):
        """Test retrieving a list of tags."""
        create_tag(name="Tag 1")
        create_tag(name="Tag 2")

        res = self.client.get(TAG_LIST_URL)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 2)

    def test_create_tag_requires_auth(self):
        """Test that creating a tag requires authentication."""
        self.client.force_authenticate(user=None)
        payload = {
            "name": "New Tag",
            "description": "New Description",
        }

        res = self.client.post(TAG_LIST_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_tag_success(self):
        """Test creating a tag successfully."""
        payload = {
            "name": "New Tag",
            "description": "New Description",
        }

        res = self.client.post(TAG_LIST_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["data"]["id"], 1)
        self.assertEqual(res.data["message"], "Tag created")

    def test_create_tag_with_duplicate_name_fails(self):
        """Test creating a tag with duplicate name fails."""
        create_tag(name="Existing Tag")
        payload = {
            "name": "Existing Tag",
            "description": "New Description",
        }

        res = self.client.post(TAG_LIST_URL, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_tag_success(self):
        """Test retrieving a tag successfully."""
        tag = create_tag()

        res = self.client.get(reverse("tag-retrieve-update-destroy", args=[tag.id]))

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["name"], tag.name)

    def test_update_tag_requires_auth(self):
        """Test that updating a tag requires authentication."""
        self.client.force_authenticate(user=None)
        tag = create_tag()
        payload = {"name": "Updated Tag"}

        res = self.client.patch(
            reverse("tag-retrieve-update-destroy", args=[tag.id]), payload
        )

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_tag_requires_admin(self):
        """Test that updating a tag requires admin privileges."""
        self.client.force_authenticate(user=self.user)
        tag = create_tag()
        payload = {"name": "Updated Tag"}

        res = self.client.patch(
            reverse("tag-retrieve-update-destroy", args=[tag.id]), payload
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_tag_requires_auth(self):
        """Test that deleting a tag requires authentication."""
        self.client.force_authenticate(user=None)
        tag = create_tag()

        res = self.client.delete(reverse("tag-retrieve-update-destroy", args=[tag.id]))

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_tag_requires_admin(self):
        """Test that deleting a tag requires admin privileges."""
        self.client.force_authenticate(user=self.user)
        tag = create_tag()

        res = self.client.delete(reverse("tag-retrieve-update-destroy", args=[tag.id]))

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_tag_success(self):
        """Test deleting a tag successfully."""
        tag = create_tag()

        res = self.client.delete(reverse("tag-retrieve-update-destroy", args=[tag.id]))

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(res.data["message"], "Tag deleted")
        self.assertFalse(Tag.objects.filter(id=tag.id).exists())
