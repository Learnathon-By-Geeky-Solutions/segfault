from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    """
    Custom authentication backend to authenticate using either email or username.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # try to fetch user by email or username
            user = (
                User.objects.get(email=username)
                if "@" in username
                else User.objects.get(username=username)
            )

            # check if password is correct
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
