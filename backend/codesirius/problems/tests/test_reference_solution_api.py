"""
Test cases for the Reference Solution API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from problems.models import Problem, ReferenceSolution, Language

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


def create_reference_solution(problem=None, **params):
    """Create and return a sample reference solution."""
    defaults = {
        "problem": problem or create_problem(),
        "code": "def solution():\n    return 42",
        "language": create_language(),
    }
    defaults.update(params)
    return ReferenceSolution.objects.create(**defaults)


class ReferencesSolutionApiTests(TestCase):
    """Test case for the Reference Solution API."""

    def setUp(self):
        """Set up the test environment."""
        self.client = APIClient()
        self.user = create_user()
        self.problem = create_problem(created_by=self.user)
        self.language = create_language()
        self.client.force_authenticate(user=self.user)

    def test_list_reference_solutions_success(self):
        """Test retrieving a list of reference solutions."""
        create_reference_solution(problem=self.problem)
        create_reference_solution(problem=self.problem)

        url = reverse("reference-solution-list-create", args=[self.problem.id])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 2)

    def test_create_reference_solution_success(self):
        """Test creating a reference solution successfully."""
        payload = {
            "code": "def solution():\n    return 42",
            "languageId": self.language.id,
        }

        url = reverse("reference-solution-list-create", args=[self.problem.id])
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["message"], "Reference solution created")
        self.assertTrue(
            ReferenceSolution.objects.filter(id=res.data["data"]["id"]).exists()
        )

    def test_create_reference_solution_invalid_language(self):
        """Test creating a reference solution with invalid language fails."""
        payload = {
            "code": "def solution():\n    return 42",
            "languageId": 999,
        }

        url = reverse("reference-solution-list-create", args=[self.problem.id])
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reference_solution_missing_code(self):
        """Test creating a reference solution without code fails."""
        payload = {
            "languageId": self.language.id,
        }

        url = reverse("reference-solution-list-create", args=[self.problem.id])
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_reference_solution_success(self):
        """Test retrieving a reference solution successfully."""
        reference_solution = create_reference_solution(problem=self.problem)

        url = reverse(
            "reference-solution-retrieve-update-destroy",
            args=[self.problem.id, reference_solution.id],
        )
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["id"], reference_solution.id)
        self.assertEqual(res.data["data"]["code"], reference_solution.code)

    def test_update_reference_solution_success(self):
        """Test updating a reference solution successfully."""
        reference_solution = create_reference_solution(problem=self.problem)
        payload = {
            "code": "def new_solution():\n    return 84",
            "languageId": self.language.id,
        }

        url = reverse(
            "reference-solution-retrieve-update-destroy",
            args=[self.problem.id, reference_solution.id],
        )
        res = self.client.put(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Reference solution updated")
        reference_solution.refresh_from_db()
        self.assertEqual(reference_solution.code, payload["code"])

    def test_partial_update_reference_solution_success(self):
        """Test partially updating a reference solution successfully."""
        reference_solution = create_reference_solution(problem=self.problem)
        payload = {
            "code": "def new_solution():\n    return 84",
        }

        url = reverse(
            "reference-solution-retrieve-update-destroy",
            args=[self.problem.id, reference_solution.id],
        )
        res = self.client.patch(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Reference solution updated")
        reference_solution.refresh_from_db()
        self.assertEqual(reference_solution.code, payload["code"])

    def test_delete_reference_solution_success(self):
        """Test deleting a reference solution successfully."""
        reference_solution = create_reference_solution(problem=self.problem)

        url = reverse(
            "reference-solution-retrieve-update-destroy",
            args=[self.problem.id, reference_solution.id],
        )
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Reference solution deleted")
        self.assertFalse(
            ReferenceSolution.objects.filter(id=reference_solution.id).exists()
        )

    def test_unauthorized_access_fails(self):
        """Test that unauthorized access to reference solutions fails."""
        other_user = create_user(
            email="other@example.com",
            username="otheruser",
        )
        other_problem = create_problem(created_by=other_user)
        reference_solution = create_reference_solution(problem=other_problem)

        # Try to access other user's reference solution
        url = reverse(
            "reference-solution-retrieve-update-destroy",
            args=[other_problem.id, reference_solution.id],
        )
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_nonexistent_problem_fails(self):
        """Test that accessing reference solutions for nonexistent problem fails."""
        url = reverse("reference-solution-list-create", args=[999])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_nonexistent_reference_solution_fails(self):
        """Test that accessing nonexistent reference solution fails."""
        url = reverse(
            "reference-solution-retrieve-update-destroy",
            args=[self.problem.id, 999],
        )
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
