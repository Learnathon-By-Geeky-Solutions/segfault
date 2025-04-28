"""
Test cases for the Hidden Test API
"""

from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient

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


def create_problem(created_by=None, **params):
    """Create and return a sample problem."""
    defaults = {
        "title": fake.sentence(),
        "description": fake.text(),
        "created_by": created_by or create_user(),
    }
    defaults.update(params)
    return Problem.objects.create(**defaults)


class HiddenTestApiTests(TestCase):
    """Test case for the Hidden Test API."""

    def setUp(self):
        """Set up the test environment."""
        self.client = APIClient()
        self.user = create_user()
        self.problem = create_problem(created_by=self.user)
        self.client.force_authenticate(user=self.user)

    @patch("problems.views.hidden_test.AWSClient")
    def test_get_presigned_url_success(self, mock_aws_client):
        """Test getting presigned URL successfully."""
        mock_s3_client = MagicMock()
        mock_s3_client.generate_presigned_post.return_value = {
            "url": "https://test-url.com",
            "fields": {"key": "value"},
        }
        mock_aws_client.return_value.get_client.return_value = mock_s3_client

        url = reverse("hidden-test-presigned-url", args=[self.problem.id])
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("url", res.data["data"])
        self.assertIn("fields", res.data["data"])
        mock_s3_client.generate_presigned_post.assert_called_once()

    def test_get_presigned_url_unauthorized(self):
        """Test getting presigned URL without authentication fails."""
        self.client.force_authenticate(user=None)
        url = reverse("hidden-test-presigned-url", args=[self.problem.id])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_presigned_url_not_owner(self):
        """Test getting presigned URL for problem owned by another user fails."""
        other_user = create_user()
        other_problem = create_problem(created_by=other_user)
        url = reverse("hidden-test-presigned-url", args=[other_problem.id])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("problems.views.hidden_test.KafkaProducerSingleton")
    @patch("problems.views.hidden_test.RedisClientSingleton")
    def test_initiate_process_success(self, mock_redis, mock_kafka):
        """Test initiating hidden test processing successfully."""
        mock_redis_client = MagicMock()
        mock_redis_client.get.return_value = str(self.user.id)
        mock_redis.return_value.get_client.return_value = mock_redis_client

        mock_kafka_producer = MagicMock()
        mock_kafka.produce_message = mock_kafka_producer

        url = reverse("hidden-test-process", args=[self.problem.id])
        res = self.client.post(url, {"clientId": "test-client-id"})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        mock_kafka_producer.assert_called_once()

    def test_initiate_process_missing_client_id(self):
        """Test initiating process without client ID fails."""
        url = reverse("hidden-test-process", args=[self.problem.id])
        res = self.client.post(url, {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("clientId", str(res.data))

    @patch("problems.views.hidden_test.RedisClientSingleton")
    def test_initiate_process_invalid_client_id(self, mock_redis):
        """Test initiating process with invalid client ID fails."""
        mock_redis_client = MagicMock()
        mock_redis_client.get.return_value = None
        mock_redis.return_value.get_client.return_value = mock_redis_client

        url = reverse("hidden-test-process", args=[self.problem.id])
        res = self.client.post(url, {"clientId": "invalid-client-id"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("clientId", str(res.data))

    @patch("problems.views.hidden_test.AWSClient")
    def test_delete_hidden_tests_success(self, mock_aws_client):
        """Test deleting hidden tests successfully."""
        # Create a hidden test bundle
        hidden_test = HiddenTestBundle.objects.create(
            problem=self.problem, s3_path="test/path", test_count=5
        )

        mock_s3_client = MagicMock()
        mock_aws_client.return_value.get_client.return_value = mock_s3_client

        url = reverse("hidden-test-delete", args=[self.problem.id])
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        mock_s3_client.delete_object.assert_called_once()
        self.assertFalse(HiddenTestBundle.objects.filter(id=hidden_test.id).exists())

    def test_delete_hidden_tests_not_found(self):
        """Test deleting non-existent hidden tests fails."""
        url = reverse("hidden-test-delete", args=[self.problem.id])
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_hidden_tests_not_owner(self):
        """Test deleting hidden tests for problem owned by another user fails."""
        other_user = create_user()
        other_problem = create_problem(created_by=other_user)
        HiddenTestBundle.objects.create(
            problem=other_problem, s3_path="test/path", test_count=5
        )

        url = reverse("hidden-test-delete", args=[other_problem.id])
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
