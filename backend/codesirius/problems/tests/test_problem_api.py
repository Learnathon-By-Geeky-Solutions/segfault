"""
Test cases for the Problem API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

from problems.models import (
    Problem,
    Language,
    Tag,
    ExecutionConstraint,
    ReferenceSolution,
    SampleTest,
)

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
        "version": fake.numerify("##.##.##"),
    }
    defaults.update(params)
    return Language.objects.create(**defaults)


def create_tag(**params):
    """Create and return a sample tag."""
    defaults = {
        "name": fake.unique.word(),
    }
    defaults.update(params)
    return Tag.objects.create(**defaults)


def create_execution_constraint(problem, language, **params):
    """Create and return a sample execution constraint."""
    defaults = {
        "problem": problem,
        "language": language,
        "time_limit": 1.0,
        "memory_limit": 256,
    }
    defaults.update(params)
    return ExecutionConstraint.objects.create(**defaults)


def create_problem(created_by=None, **params):
    """Create and return a sample problem."""
    defaults = {
        "title": fake.sentence(),
        "description": fake.text(),
        "created_by": created_by or create_user(),
        "status": Problem.Status.DRAFT,  # Default to draft to avoid validation issues
    }
    defaults.update(params)
    problem = Problem.objects.create(**defaults)

    # If languages are provided, create execution constraints
    if "languages" in params:
        for language in params["languages"]:
            create_execution_constraint(problem=problem, language=language)

    return problem


class ProblemApiTests(TestCase):
    """Test case for the Problem API."""

    def setUp(self):
        """Set up the test environment."""
        self.client = APIClient()
        self.user = create_user()
        self.client.force_authenticate(user=self.user)
        self.language = create_language()
        self.tag = create_tag()
        self.tag_url = reverse("tag-list-create")

    def test_list_problems_success(self):
        """Test listing all problems successfully."""
        # Create some test problems
        problem1 = create_problem(created_by=self.user)
        problem2 = create_problem(created_by=self.user)
        problem2.status = Problem.Status.PUBLISHED
        problem2.save()

        url = reverse("problem-list-create")
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]["results"]), 2)
        self.assertEqual(res.data["data"]["results"][0]["title"], problem1.title)
        self.assertEqual(res.data["data"]["results"][1]["title"], problem2.title)

    def test_list_problems_filter_by_title(self):
        """Test listing problems filtered by title."""
        problem = create_problem(created_by=self.user, title="Test Problem")

        url = reverse("problem-list-create")
        res = self.client.get(url, {"title": "Test"})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]["results"]), 1)
        self.assertEqual(res.data["data"]["results"][0]["title"], problem.title)

    def test_list_problems_filter_by_tags(self):
        """Test listing problems filtered by tags."""
        problem = create_problem(created_by=self.user)
        problem.tags.add(self.tag)

        url = reverse("problem-list-create")
        res = self.client.get(url, {"tags": [self.tag.id]})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]["results"]), 1)
        self.assertEqual(res.data["data"]["results"][0]["title"], problem.title)

    def test_create_problem_success(self):
        """Test creating a new problem successfully."""
        payload = {
            "title": "Test Problem",
            "description": "Test Description",
            "languages": [self.language.id],
            "tags": [self.tag.id],
        }

        url = reverse("problem-list-create")
        res = self.client.post(url, payload)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["message"], "Problem created")
        self.assertEqual(res.data["data"]["title"], payload["title"])

    def test_retrieve_problem_success(self):
        """Test retrieving a problem successfully."""
        problem = create_problem(created_by=self.user)

        url = reverse("problem-retrieve-update-destroy", args=[problem.id])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["title"], problem.title)

    def test_retrieve_published_problem_unauthorized(self):
        """Test retrieving a published problem without authentication."""
        problem = create_problem(created_by=self.user)
        problem.status = Problem.Status.PUBLISHED
        problem.save()
        self.client.force_authenticate(user=None)

        url = reverse("problem-retrieve-update-destroy", args=[problem.id])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["title"], problem.title)

    def test_retrieve_draft_problem_unauthorized(self):
        """Test retrieving a draft problem without authentication fails."""
        problem = create_problem(created_by=self.user)
        self.client.force_authenticate(user=None)

        url = reverse("problem-retrieve-update-destroy", args=[problem.id])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_problem_success(self):
        """Test updating a problem successfully."""
        problem = create_problem(created_by=self.user)
        payload = {
            "title": "Updated Title",
            "description": "Updated Description",
            "languages": [self.language.id],
            "tags": [self.tag.id],
        }

        url = reverse("problem-retrieve-update-destroy", args=[problem.id])
        res = self.client.put(url, payload)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Problem updated")

        # Verify the update
        problem.refresh_from_db()
        self.assertEqual(problem.title, payload["title"])
        self.assertEqual(problem.description, payload["description"])

    def test_update_problem_not_owner(self):
        """Test updating a problem not owned by the user fails."""
        other_user = create_user()
        problem = create_problem(created_by=other_user)
        payload = {
            "title": "Updated Title",
            "description": "Updated Description",
        }

        url = reverse("problem-retrieve-update-destroy", args=[problem.id])
        res = self.client.put(url, payload)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_problem_success(self):
        """Test deleting a problem successfully."""
        problem = create_problem(created_by=self.user)

        url = reverse("problem-retrieve-update-destroy", args=[problem.id])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Problem deleted")
        self.assertFalse(Problem.objects.filter(id=problem.id).exists())

    def test_delete_problem_not_owner(self):
        """Test deleting a problem not owned by the user fails."""
        other_user = create_user()
        problem = create_problem(created_by=other_user)

        url = reverse("problem-retrieve-update-destroy", args=[problem.id])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_publish_problem_success(self):
        """Test publishing a problem successfully."""
        problem = create_problem(created_by=self.user)
        problem.languages.add(self.language)
        problem.tags.add(self.tag)
        create_execution_constraint(problem=problem, language=self.language)

        # Create a reference solution
        ReferenceSolution.objects.create(
            problem=problem,
            language=self.language,
            code="print('Hello, World!')",
            verdict=ReferenceSolution.Verdict.ACCEPTED,
        )

        # Create a sample test
        SampleTest.objects.create(
            problem=problem, input="Hello", output="Hello, World!"
        )

        url = reverse("problem-publish", args=[problem.id])
        res = self.client.post(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["message"], "Problem published")

        # Verify the status
        problem.refresh_from_db()
        self.assertEqual(problem.status, Problem.Status.PUBLISHED)

    def test_publish_problem_missing_requirements(self):
        """Test publishing a problem with missing requirements fails."""
        problem = create_problem(created_by=self.user)
        # Missing languages and tags

        url = reverse("problem-publish", args=[problem.id])
        res = self.client.post(url)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("languages", str(res.data))
        self.assertIn("tags", str(res.data))

    def test_publish_problem_not_owner(self):
        """Test publishing a problem not owned by the user fails."""
        other_user = create_user()
        problem = create_problem(created_by=other_user)

        url = reverse("problem-publish", args=[problem.id])
        res = self.client.post(url)

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_tag_success(self):
        """Test creating a new tag"""
        self.client.force_authenticate(user=self.user)
        data = {"name": "Test Tag", "description": "A test tag"}
        response = self.client.post(self.tag_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsInstance(response.data["data"]["id"], int)
        self.assertEqual(response.data["message"], "Tag created")
