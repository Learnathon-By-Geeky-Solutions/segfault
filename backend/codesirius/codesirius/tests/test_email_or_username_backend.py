from django.contrib.auth import get_user_model
from django.test import TestCase

from ..email_or_username_backend import EmailOrUsernameBackend

User = get_user_model()


class EmailOrUsernameBackendTests(TestCase):
    def setUp(self):
        self.backend = EmailOrUsernameBackend()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            first_name="Test",
        )

    def test_authenticate_with_username(self):
        """Test authentication using username"""
        user = self.backend.authenticate(
            None, username="testuser", password="testpass123"
        )
        self.assertEqual(user, self.user)

    def test_authenticate_with_email(self):
        """Test authentication using email"""
        user = self.backend.authenticate(
            None, username="test@example.com", password="testpass123"
        )
        self.assertEqual(user, self.user)

    def test_authenticate_with_invalid_username(self):
        """Test authentication with non-existent username"""
        user = self.backend.authenticate(
            None, username="nonexistent", password="testpass123"
        )
        self.assertIsNone(user)

    def test_authenticate_with_invalid_email(self):
        """Test authentication with non-existent email"""
        user = self.backend.authenticate(
            None, username="nonexistent@example.com", password="testpass123"
        )
        self.assertIsNone(user)

    def test_authenticate_with_wrong_password(self):
        """Test authentication with incorrect password"""
        user = self.backend.authenticate(
            None, username="testuser", password="wrongpass"
        )
        self.assertIsNone(user)

    def test_authenticate_with_empty_username(self):
        """Test authentication with empty username"""
        user = self.backend.authenticate(None, username="", password="testpass123")
        self.assertIsNone(user)

    def test_authenticate_with_none_username(self):
        """Test authentication with None username"""
        user = self.backend.authenticate(None, username=None, password="testpass123")
        self.assertIsNone(user)
