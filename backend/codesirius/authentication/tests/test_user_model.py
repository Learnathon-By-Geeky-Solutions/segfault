"""
Test cases for the authentication API
"""

from django.contrib.auth import get_user_model
from django.test import TestCase


class ModelTests(TestCase):
    """
    Test case for the custom User model.

    This class contains test methods to verify the functionality of the
    custom User model, including user creation with various scenarios
    and superuser creation. It tests for successful user creation as well
    as expected errors when required fields are missing.
    """

    def test_create_user_with_first_name_email_username_password_successful(self):
        """
        Test creating a new user with all required fields is successful.

        This test ensures that a user can be created successfully when
        provided with a first name, email, username, and password.  It
        checks that the user's attributes are set correctly and that the
        password is hashed properly.
        """
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
        """
        Test creating a user without a first name raises a ValueError.

        This test verifies that a ValueError is raised when attempting to
        create a user without providing a first name, both with an empty
        string and with None.
        """
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
        """
        Test creating a user without an email raises a ValueError.

        This test verifies that a ValueError is raised when attempting to
        create a user without providing an email, both with an empty
        string and with None.
        """
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
        """
        Test creating a user without a username raises a ValueError.

        This test verifies that a ValueError is raised when attempting to
        create a user without providing a username, both with an empty
        string and with None.
        """
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
        """
        Test creating a user without a password raises a ValueError.

        This test verifies that a ValueError is raised when attempting to
        create a user without providing a password, both with an empty
        string and with None.
        """
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
        """
        Test that the email for a new user is normalized.

        This test checks that the email address is converted to lowercase
        when a new user is created, ensuring consistency in email storage.
        It tests various cases of uppercase and lowercase combinations
        in the email address.
        """
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
        """
        Test creating a new superuser.

        This test verifies that a superuser can be created successfully
        with the create_superuser method.  It checks that the is_superuser
        and is_staff attributes are set to True.
        """
        first_name = "Test Super"
        email = "admin@example.com"
        username = "testsuperuser"
        password = "testpassword"

        user = get_user_model().objects.create_superuser(
            first_name=first_name, email=email, username=username, password=password
        )

        self.assertTrue(user.is_superuser)  # is_superuser is part of PermissionsMixin
        self.assertTrue(user.is_staff)  # is_staff is part of PermissionsMixin
