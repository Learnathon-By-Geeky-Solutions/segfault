"""
Test cases for the AWS client
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from codesirius.aws_client import AWSClient


class AWSClientTests(TestCase):
    """
    Test case for the AWS client.

    This class contains test methods to verify the functionality of the
    AWS client, focusing on the singleton pattern behavior.
    """

    def setUp(self):
        """Set up the test environment."""
        self.service_name = "s3"
        # Reset the singleton instances before each test
        AWSClient._instances = {}

    @patch("boto3.client")
    def test_singleton_pattern(self, mock_boto3_client):
        """Test that the AWS client follows the singleton pattern."""
        # Create first instance
        client1 = AWSClient(self.service_name)
        # Create second instance
        client2 = AWSClient(self.service_name)
        
        # Both instances should be the same object
        self.assertIs(client1, client2)
        # boto3.client should only be called once
        mock_boto3_client.assert_called_once()

    @patch("boto3.client")
    def test_different_services_create_different_instances(self, mock_boto3_client):
        """Test that different services create different instances."""
        # Create instances for different services
        s3_client = AWSClient("s3")
        dynamodb_client = AWSClient("dynamodb")
        
        # Instances should be different
        self.assertIsNot(s3_client, dynamodb_client)
        # boto3.client should be called twice with different service names
        self.assertEqual(mock_boto3_client.call_count, 2)

    @patch("boto3.client")
    def test_singleton_instances_are_stored(self, mock_boto3_client):
        """Test that singleton instances are properly stored in the class."""
        # Create instances for different services
        s3_client = AWSClient("s3")
        dynamodb_client = AWSClient("dynamodb")
        
        # Check that instances are stored in the class dictionary
        self.assertIn("s3", AWSClient._instances)
        self.assertIn("dynamodb", AWSClient._instances)
        self.assertIs(s3_client, AWSClient._instances["s3"])
        self.assertIs(dynamodb_client, AWSClient._instances["dynamodb"])

    @patch("boto3.client")
    def test_singleton_reset(self, mock_boto3_client):
        """Test that singleton instances can be reset."""
        # Create initial instance
        client1 = AWSClient(self.service_name)
        
        # Reset the singleton
        AWSClient._instances = {}
        
        # Create new instance
        client2 = AWSClient(self.service_name)
        
        # Instances should be different after reset
        self.assertIsNot(client1, client2)
        # boto3.client should be called twice
        self.assertEqual(mock_boto3_client.call_count, 2)

    @patch("boto3.client")
    def test_singleton_thread_safety(self, mock_boto3_client):
        """Test that singleton pattern is thread-safe."""
        import threading
        
        def create_client():
            return AWSClient(self.service_name)
        
        # Create multiple threads to create clients simultaneously
        threads = [threading.Thread(target=create_client) for _ in range(5)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        
        # All instances should be the same
        instances = [AWSClient(self.service_name) for _ in range(5)]
        first_instance = instances[0]
        for instance in instances[1:]:
            self.assertIs(first_instance, instance)
        
        # boto3.client should only be called once
        mock_boto3_client.assert_called_once() 