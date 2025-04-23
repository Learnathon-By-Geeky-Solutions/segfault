"""
Test cases for the SampleTest model
"""

from django.test import TestCase
from problems.models import Problem
from problems.models.sample_test import SampleTest
from codesirius.models import BaseModel


class SampleTestModelTests(TestCase):
    """Test cases for the SampleTest model"""

    def setUp(self):
        """Set up test data"""
        self.problem = Problem.objects.create(
            title="Test Problem",
            description="Test Description",
            status=Problem.Status.DRAFT,
        )
        self.sample_test = SampleTest.objects.create(
            problem=self.problem,
            input="1 2",
            output="3",
        )

    def test_create_sample_test(self):
        """Test creating a sample test"""
        self.assertEqual(self.sample_test.problem, self.problem)
        self.assertEqual(self.sample_test.input, "1 2")
        self.assertEqual(self.sample_test.output, "3")
        self.assertIsNotNone(self.sample_test.created_at)
        self.assertIsNotNone(self.sample_test.updated_at)

    def test_sample_test_str(self):
        """Test the string representation of a sample test"""
        expected_str = f"Sample test for {self.problem.title}"
        self.assertEqual(str(self.sample_test), expected_str) 