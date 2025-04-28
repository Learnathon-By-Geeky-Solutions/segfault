"""
Test cases for the Hidden Test Bundle API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from internal_api.models.apikey import APIKey
from problems.models import Problem, HiddenTestBundle

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
    return APIKey.objects.create(**defaults), raw_key


def create_problem(created_by=None, **params):
    """Create and return a sample problem."""
    defaults = {
        "title": fake.sentence(),
        "description": fake.text(),
        "created_by": created_by or create_user(),
    }
    defaults.update(params)
    return Problem.objects.create(**defaults)


def create_hidden_test_bundle(problem=None, **params):
    """Create and return a sample hidden test bundle."""
    defaults = {
        "problem": problem or create_problem(),
        "s3_path": f"unprocessed/{problem.id}/hidden-tests.zip",
        "test_count": 5,
    }
    defaults.update(params)
    return HiddenTestBundle.objects.create(**defaults)


class HiddenTestBundleApiTests(TestCase):
    """Test case for the Hidden Test Bundle API."""

    def setUp(self):
        """Set up the test environment."""
        self.client = APIClient()
        self.user = create_staff_user()
        self.apikey, self.raw_key = create_apikey(created_by=self.user)
        self.problem = create_problem(created_by=self.user)

    def test_create_hidden_test_bundle_success(self):
        """Test creating a hidden test bundle successfully with API key."""
        payload = {
            "problem_id": self.problem.id,
            "s3_path": f"unprocessed/{self.problem.id}/hidden-tests.zip",
            "test_count": 5,
        }

        url = reverse("hidden-test-bundle", args=[self.problem.id])
        res = self.client.post(
            url, data=payload, format="json", HTTP_X_API_KEY=self.raw_key
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["data"]["id"], HiddenTestBundle.objects.first().id)
        self.assertEqual(res.data["data"]["s3_path"], payload["s3_path"])
        self.assertEqual(res.data["data"]["test_count"], payload["test_count"])

    def test_create_hidden_test_bundle_duplicate(self):
        """Test creating a duplicate hidden test bundle fails."""
        # Create an existing hidden test bundle
        create_hidden_test_bundle(problem=self.problem)

        payload = {
            "problem_id": self.problem.id,
            "s3_path": f"unprocessed/{self.problem.id}/hidden-tests.zip",
            "test_count": 5,
        }

        url = reverse("hidden-test-bundle", args=[self.problem.id])
        res = self.client.post(
            url, data=payload, format="json", HTTP_X_API_KEY=self.raw_key
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Hidden test bundle already exists", str(res.data))

    def test_create_hidden_test_bundle_unauthorized(self):
        """Test creating a hidden test bundle without API key fails."""
        payload = {
            "problem_id": self.problem.id,
            "s3_path": f"unprocessed/{self.problem.id}/hidden-tests.zip",
            "test_count": 5,
        }

        url = reverse("hidden-test-bundle", args=[self.problem.id])
        res = self.client.post(url, data=payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_hidden_test_bundle_invalid_apikey(self):
        """Test creating a hidden test bundle with invalid API key fails."""
        payload = {
            "problem_id": self.problem.id,
            "s3_path": f"unprocessed/{self.problem.id}/hidden-tests.zip",
            "test_count": 5,
        }

        url = reverse("hidden-test-bundle", args=[self.problem.id])
        res = self.client.post(
            url, data=payload, format="json", HTTP_X_API_KEY="invalid-key"
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
