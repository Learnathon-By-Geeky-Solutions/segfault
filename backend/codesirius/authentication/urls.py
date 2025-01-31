from django.urls import path

from authentication.views import (
    SignupAPIView,
    SigninAPIView,
    TokenVerifyAPIView,
    WhoAmIView,
    TokenRefreshAPIView,
)

urlpatterns = [
    path("signup", SignupAPIView.as_view(), name="signup"),
    path("signin", SigninAPIView.as_view(), name="signin"),
    path("token/verify", TokenVerifyAPIView.as_view(), name="token_verify"),
    path("token/refresh", TokenRefreshAPIView.as_view(), name="token_refresh"),
    path("whoami", WhoAmIView.as_view(), name="whoami"),
]
