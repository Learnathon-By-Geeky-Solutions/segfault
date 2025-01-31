from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from authentication.views.auth import SignupAPIView
from authentication.views.token_obtain_pair import TokenObtainPairAPIView
from authentication.views.token_refresh import TokenRefreshAPIView
from authentication.views.token_verify import TokenVerifyAPIView
from authentication.views.verification import VerificationCodeAPIView
from authentication.views.whoami import WhoAmIView

urlpatterns = [
    path("signup", SignupAPIView.as_view(), name="signup"),
    path(
        "<int:user_id>/verification",
        VerificationCodeAPIView.as_view(),
        name="verification",
    ),
    path("signin", TokenObtainPairAPIView.as_view(), name="signin"),
    path("token/verify", TokenVerifyAPIView.as_view(), name="token_verify"),
    path("token/refresh", TokenRefreshAPIView.as_view(), name="token_refresh"),
    path("whoami", WhoAmIView.as_view(), name="whoami"),
]
