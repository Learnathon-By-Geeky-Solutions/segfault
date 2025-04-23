"""
Test cases for the Redis client
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from codesirius.redis_client import RedisClientSingleton


class RedisClientTests(TestCase):
    """
    Test case for the Redis client.

    This class contains test methods to verify the functionality of the
    Redis client, focusing on the singleton pattern behavior.
    """

    def setUp(self):
        """Set up the test environment."""
        # Reset the singleton instance before each test
        RedisClientSingleton._instance = None

    @patch("redis.Redis")
    def test_singleton_pattern(self, mock_redis):
        """Test that the Redis client follows the singleton pattern."""
        # Create first instance
        client1 = RedisClientSingleton()
        # Create second instance
        client2 = RedisClientSingleton()
        
        # Both instances should be the same object
        self.assertIs(client1, client2)
        # redis.Redis should only be called once
        mock_redis.assert_called_once()

    @patch("redis.Redis")
    def test_singleton_instance_is_stored(self, mock_redis):
        """Test that singleton instance is properly stored in the class."""
        # Create instance
        client = RedisClientSingleton()
        
        # Check that instance is stored in the class
        self.assertIsNotNone(RedisClientSingleton._instance)
        self.assertIs(client, RedisClientSingleton._instance)

    @patch("redis.Redis")
    def test_singleton_reset(self, mock_redis):
        """Test that singleton instance can be reset."""
        # Create initial instance
        client1 = RedisClientSingleton()
        
        # Reset the singleton
        RedisClientSingleton._instance = None
        
        # Create new instance
        client2 = RedisClientSingleton()
        
        # Instances should be different after reset
        self.assertIsNot(client1, client2)
        # redis.Redis should be called twice
        self.assertEqual(mock_redis.call_count, 2)

    @patch("redis.Redis")
    def test_singleton_thread_safety(self, mock_redis):
        """Test that singleton pattern is thread-safe."""
        import threading
        
        def create_client():
            return RedisClientSingleton()
        
        # Create multiple threads to create clients simultaneously
        threads = [threading.Thread(target=create_client) for _ in range(5)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        
        # All instances should be the same
        instances = [RedisClientSingleton() for _ in range(5)]
        first_instance = instances[0]
        for instance in instances[1:]:
            self.assertIs(first_instance, instance)
        
        # redis.Redis should only be called once
        mock_redis.assert_called_once() 