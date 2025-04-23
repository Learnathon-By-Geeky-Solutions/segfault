"""
Test cases for the SampleTest API
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from problems.models import Problem
from problems.models.sample_test import SampleTest


def create_problem(**params):
    """Create and return a sample problem"""
    defaults = {
        "title": "Test Problem",
        "description": "Test Description",
        "status": Problem.Status.DRAFT,
    }
    defaults.update(params)
    return Problem.objects.create(**defaults)


def create_sample_test(problem, **params):
    """Create and return a sample test"""
    defaults = {
        "input": "1 2",
        "output": "3",
    }
    defaults.update(params)
    return SampleTest.objects.create(problem=problem, **defaults)


class SampleTestApiTests(TestCase):
    """Test cases for the SampleTest API"""

    def setUp(self):
        """Set up test environment"""
        self.client = APIClient()
        self.problem = create_problem()
        self.sample_test = create_sample_test(self.problem)
        self.bulk_url = reverse("sample-test-bulk", args=[self.problem.id])
        self.delete_url = reverse(
            "sample-test", args=[self.problem.id, self.sample_test.id]
        )

    def test_bulk_upsert_valid_data(self):
        """Test bulk upsert with valid data"""
        payload = [
            {
                "id": self.sample_test.id,
                "input": "2 3",
                "output": "5",
            },
            {
                "input": "3 4",
                "output": "7",
            },
        ]

        res = self.client.put(self.bulk_url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(len(res.data["data"]), 2)  # Check data array length
        self.assertEqual(SampleTest.objects.count(), 2)
        self.assertEqual(
            SampleTest.objects.get(id=self.sample_test.id).input, "2 3"
        )

    def test_bulk_upsert_invalid_data(self):
        """Test bulk upsert with invalid data"""
        payload = [
            {
                "id": self.sample_test.id,
                "input": "",  # Invalid empty input
                "output": "5",
            },
        ]

        res = self.client.put(self.bulk_url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", res.data)

    def test_bulk_upsert_nonexistent_id(self):
        """Test bulk upsert with nonexistent ID"""
        payload = [
            {
                "id": 999,  # Nonexistent ID
                "input": "2 3",
                "output": "5",
            },
        ]

        res = self.client.put(self.bulk_url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", res.data)

    def test_delete_sample_test(self):
        """Test deleting a sample test"""
        res = self.client.delete(self.delete_url)

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(SampleTest.objects.count(), 0)

    def test_delete_nonexistent_sample_test(self):
        """Test deleting a nonexistent sample test"""
        url = reverse("sample-test", args=[self.problem.id, 999])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(SampleTest.objects.count(), 1)

    def test_delete_sample_test_nonexistent_problem(self):
        """Test deleting a sample test from nonexistent problem"""
        url = reverse("sample-test", args=[999, self.sample_test.id])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(SampleTest.objects.count(), 1) 