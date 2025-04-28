"""
Test cases for the Execution Constraint API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from problems.models import Problem, Language, ExecutionConstraint

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


def create_problem(created_by=None, **params):
    """Create and return a sample problem."""
    defaults = {
        "title": fake.sentence(),
        "description": fake.text(),
        "created_by": created_by or create_user(),
    }
    defaults.update(params)
    return Problem.objects.create(**defaults)


def create_language(**params):
    """Create and return a sample language."""
    defaults = {
        "name": fake.unique.word(),
        "version": fake.numerify("##.##.##"),  # Generates version like "12.34.56"
    }
    defaults.update(params)
    return Language.objects.create(**defaults)


def create_execution_constraint(problem=None, language=None, **params):
    """Create and return a sample execution constraint."""
    defaults = {
        "problem": problem or create_problem(),
        "language": language or create_language(),
        "time_limit": 100,
        "memory_limit": 256,
    }
    defaults.update(params)
    return ExecutionConstraint.objects.create(**defaults)


class ExecutionConstraintApiTests(TestCase):
    """Test case for the Execution Constraint API."""

    def setUp(self):
        """Set up the test environment."""
        self.client = APIClient()
        self.user = create_user()
        self.problem = create_problem(created_by=self.user)
        self.language = create_language()
        self.problem.languages.add(self.language)
        self.client.force_authenticate(user=self.user)

    def test_upsert_execution_constraints_success(self):
        """Test upserting execution constraints successfully."""
        payload = [
            {
                "languageId": self.language.id,
                "timeLimit": 100,
                "memoryLimit": 256,
            }
        ]

        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(len(res.data["data"]), 1)
        self.assertEqual(res.data["data"][0]["languageId"], self.language.id)
        self.assertEqual(res.data["data"][0]["timeLimit"], 100)
        self.assertEqual(res.data["data"][0]["memoryLimit"], 256)

    def test_upsert_multiple_execution_constraints_success(self):
        """Test upserting multiple execution constraints successfully."""
        language2 = create_language()
        self.problem.languages.add(language2)
        payload = [
            {
                "languageId": self.language.id,
                "timeLimit": 100,
                "memoryLimit": 256,
            },
            {
                "languageId": language2.id,
                "timeLimit": 200,
                "memoryLimit": 512,
            },
        ]

        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(len(res.data["data"]), 2)

    def test_upsert_execution_constraint_invalid_time_limit(self):
        """Test upserting execution constraint with invalid time limit fails."""
        payload = [
            {
                "languageId": self.language.id,
                "timeLimit": 0,  # Below minimum
                "memoryLimit": 256,
            }
        ]

        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("timeLimit", str(res.data["errors"][0]))

    def test_upsert_execution_constraint_invalid_memory_limit(self):
        """Test upserting execution constraint with invalid memory limit fails."""
        payload = [
            {
                "languageId": self.language.id,
                "timeLimit": 100,
                "memoryLimit": 16,  # Below minimum
            }
        ]

        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("memoryLimit", str(res.data["errors"][0]))

    def test_upsert_execution_constraint_invalid_language(self):
        """Test upserting execution constraint with invalid language fails."""
        payload = [
            {
                "languageId": 999,  # Non-existent language
                "timeLimit": 100,
                "memoryLimit": 256,
            }
        ]

        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("languageId", str(res.data["errors"][0]))

    def test_upsert_execution_constraint_unsupported_language(self):
        """Test upserting execution constraint with unsupported language fails."""
        unsupported_language = create_language()
        payload = [
            {
                "languageId": unsupported_language.id,
                "timeLimit": 100,
                "memoryLimit": 256,
            }
        ]

        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("languageId", str(res.data["errors"][0]))

    def test_upsert_execution_constraint_duplicate_language(self):
        """Test upserting execution constraint with duplicate language fails."""
        payload = [
            {
                "languageId": self.language.id,
                "timeLimit": 100,
                "memoryLimit": 256,
            },
            {
                "languageId": self.language.id,  # Duplicate language
                "timeLimit": 200,
                "memoryLimit": 512,
            },
        ]

        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Something went wrong", str(res.data))

    def test_upsert_execution_constraint_update_existing(self):
        """Test updating existing execution constraint successfully."""
        constraint = create_execution_constraint(
            problem=self.problem, language=self.language
        )
        payload = [
            {
                "id": constraint.id,
                "languageId": self.language.id,
                "timeLimit": 200,
                "memoryLimit": 512,
            }
        ]

        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(len(res.data["data"]), 1)
        self.assertEqual(res.data["data"][0]["timeLimit"], 200)
        self.assertEqual(res.data["data"][0]["memoryLimit"], 512)

    def test_upsert_execution_constraint_invalid_json(self):
        """Test upserting execution constraint with invalid JSON fails."""
        url = reverse("execution-constraint", args=[self.problem.id])
        res = self.client.put(url, "invalid json", content_type="application/json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("payload", str(res.data))

    def test_unauthorized_access_fails(self):
        """Test that unauthorized access to execution constraints fails."""
        other_user = create_user(
            email="other@example.com",
            username="otheruser",
        )
        other_problem = create_problem(created_by=other_user)
        other_language = create_language()
        other_problem.languages.add(other_language)
        payload = [
            {
                "languageId": other_language.id,
                "timeLimit": 100,
                "memoryLimit": 256,
            }
        ]

        url = reverse("execution-constraint", args=[other_problem.id])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(len(res.data["data"]), 1)

    def test_nonexistent_problem_fails(self):
        """Test that accessing execution constraints for nonexistent problem fails."""
        payload = [
            {
                "languageId": self.language.id,
                "timeLimit": 100,
                "memoryLimit": 256,
            }
        ]

        url = reverse("execution-constraint", args=[999])
        res = self.client.put(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Problem not found", str(res.data))
