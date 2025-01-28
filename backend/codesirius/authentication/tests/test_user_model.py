"""
Test the user model
"""

from django.contrib.auth import get_user_model
from django.test import TestCase


class ModelTests(TestCase):

    def test_create_user_with_first_name_email_username_password_successful(self):
        """Test creating a new user with first name, email, username and password is successful"""
        first_name = "Test"
        email = "test@example.com"
        username = "testusername"
        password = "testpassword"
        user = get_user_model().objects.create_user(
            first_name=first_name, email=email, username=username, password=password
        )

        self.assertEqual(user.first_name, first_name)
        self.assertEqual(user.email, email)
        self.assertEqual(user.username, username)
        self.assertTrue(user.check_password(password))

    def test_create_user_without_first_name_raises_error(self):
        """Test creating user without first name raises error"""
        email = "test1@example.com"
        username = "testusername1"
        password = "testpassword"
        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(
                first_name="", email=email, username=username, password=password
            )

        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(
                first_name=None, email=email, username=username, password=password
            )

    def test_create_user_without_email_raises_error(self):
        """Test creating user without email raises error"""
        first_name = "Test"
        username = "testusername3"
        password = "testpassword"
        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(
                first_name=first_name, email="", username=username, password=password
            )

        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(
                first_name=first_name, email=None, username=username, password=password
            )

    def test_create_user_without_username_raises_error(self):
        """Test creating user without username raises error"""
        first_name = "Test"
        email = "test3@example.com"
        password = "testpassword"
        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(
                first_name=first_name, email=email, username="", password=password
            )

        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(
                first_name=first_name, email=email, username=None, password=password
            )

    def test_create_user_without_password_raises_error(self):
        """Test creating user without password raises error"""
        first_name = "Test"
        email = "test4@example.com"
        username = "testusername4"
        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(
                first_name=first_name, email=email, username=username, password=""
            )

        with self.assertRaises(ValueError):
            get_user_model().objects.create_user(
                first_name=first_name, email=email, username=username, password=None
            )

    def test_new_user_email_normalized(self):
        """Test the email for a new user is normalized"""
        first_name = "Test"
        password = "testpassword"
        sample_emails = [
            ("test5@EXAMPLE.com", "test5@example.com"),
            ("Test6@Example.com", "Test6@example.com"),
            ("TEST7@EXAMPLE.com", "TEST7@example.com"),
            ("test8@example.COM", "test8@example.com"),
        ]

        for i, (email, expected_email) in enumerate(sample_emails):
            username = f"testusername{5 + i}"
            user = get_user_model().objects.create_user(
                first_name=first_name, email=email, username=username, password=password
            )
            self.assertEqual(user.email, expected_email)

    def test_create_superuser(self):
        """Test creating a new superuser"""
        first_name = "Test Super"
        email = "admin@example.com"
        username = "testsuperuser"
        password = "testpassword"

        user = get_user_model().objects.create_superuser(
            first_name=first_name, email=email, username=username, password=password
        )

        self.assertTrue(user.is_superuser)  # is_superuser is part of PermissionsMixin
        self.assertTrue(user.is_staff)  # is_staff is part of PermissionsMixin
