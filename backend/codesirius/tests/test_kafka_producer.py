"""
Test cases for the Kafka producer
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from codesirius.kafa_producer import KafkaProducerSingleton


class KafkaProducerTests(TestCase):
    """
    Test case for the Kafka producer.

    This class contains test methods to verify the functionality of the
    Kafka producer, focusing on the singleton pattern behavior.
    """

    def setUp(self):
        """Set up the test environment."""
        # Reset the singleton instance before each test
        KafkaProducerSingleton._instance = None

    @patch("codesirius.kafa_producer.Producer")
    def test_singleton_pattern(self, mock_producer):
        """Test that the Kafka producer follows the singleton pattern."""
        # Create first instance
        producer1 = KafkaProducerSingleton.get_instance()
        # Create second instance
        producer2 = KafkaProducerSingleton.get_instance()
        
        # Both instances should be the same object
        self.assertIs(producer1, producer2)
        # Producer should only be called once
        mock_producer.assert_called_once()

    @patch("codesirius.kafa_producer.Producer")
    def test_singleton_instance_is_stored(self, mock_producer):
        """Test that singleton instance is properly stored in the class."""
        # Create instance
        producer = KafkaProducerSingleton.get_instance()
        
        # Check that instance is stored in the class
        self.assertIsNotNone(KafkaProducerSingleton._instance)
        self.assertIs(producer, KafkaProducerSingleton._instance)

    @patch("codesirius.kafa_producer.Producer")
    def test_singleton_thread_safety(self, mock_producer):
        """Test that singleton pattern is thread-safe."""
        import threading
        
        def create_producer():
            return KafkaProducerSingleton.get_instance()
        
        # Create multiple threads to create producers simultaneously
        threads = [threading.Thread(target=create_producer) for _ in range(5)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        
        # All instances should be the same
        instances = [KafkaProducerSingleton.get_instance() for _ in range(5)]
        first_instance = instances[0]
        for instance in instances[1:]:
            self.assertIs(first_instance, instance)
        
        # Producer should only be called once
        mock_producer.assert_called_once() 