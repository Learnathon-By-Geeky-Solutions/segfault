from django.urls import path

from authentication.views.auth import SignupAPIView
from authentication.views.check_verification_code import CheckVerificationCodeAPIView
from authentication.views.resend_verification_code import ResendVerificationCodeAPIView
from authentication.views.token_obtain_pair import TokenObtainPairAPIView
from authentication.views.token_refresh import TokenRefreshAPIView
from authentication.views.token_verify import TokenVerifyAPIView
from authentication.views.whoami import WhoAmIView

urlpatterns = [
    path("signup", SignupAPIView.as_view(), name="signup"),  # method: POST
    path(
        "<int:user_id>/verification/resend",
        ResendVerificationCodeAPIView.as_view(),
        name="resend_verification_code",
    ),  # method: PATCH
    path(
        "<int:user_id>/verification/check",
        CheckVerificationCodeAPIView.as_view(),
        name="check_verification_code",
    ),  # method: POST
    path("signin", TokenObtainPairAPIView.as_view(), name="signin"),  # method: POST
    path(
        "token/verify", TokenVerifyAPIView.as_view(), name="token_verify"
    ),  # method: POST
    path(
        "token/refresh", TokenRefreshAPIView.as_view(), name="token_refresh"
    ),  # method: POST
    path("whoami", WhoAmIView.as_view(), name="whoami"),  # method: GET
]
