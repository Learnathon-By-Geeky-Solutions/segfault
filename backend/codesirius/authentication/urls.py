from django.urls import path

from authentication.views import SignupAPIView, SigninAPIView, TokenVerifyAPIView

urlpatterns = [
    path("signup", SignupAPIView.as_view(), name="signup"),
    path("signin", SigninAPIView.as_view(), name="signin"),
    path("token/verify", TokenVerifyAPIView.as_view(), name="token"),
]
