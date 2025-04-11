from django.urls import path

from internal_api.views.apikey import (
    APIKeyListCreateAPIView,
    APIKeyDestroyAPIView,
)
from internal_api.views.problem import ProblemRetrieveUpdateAPIView

urlpatterns = [
    path("apikey/", APIKeyListCreateAPIView.as_view(), name="apikey-list-create"),
    path(
        "apikey/<int:api_key_id>/",
        APIKeyDestroyAPIView.as_view(),
        name="apikey-destroy",
    ),
    path(
        "problems/<int:pk>/",
        ProblemRetrieveUpdateAPIView.as_view(),
        name="problem-retrieve-update",
    ),
]
