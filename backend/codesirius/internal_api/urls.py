from django.urls import path

from internal_api.views.apikey import (
    APIKeyListCreateAPIView,
    APIKeyDestroyAPIView,
)
from internal_api.views.hidden_test_bundle import (
    HiddenTestBundleAPIView,
    HiddenTestBundleRetrieveUpdateAPIView,
)
from internal_api.views.problem import ProblemRetrieveUpdateAPIView
from internal_api.views.reference_solution import ReferenceSolutionVerdictUpdateAPIView

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
    path(
        "problems/<int:problem_pk>/hidden-test-bundle/",
        HiddenTestBundleAPIView.as_view(),
        name="hidden-test-bundle",
    ),
    path(
        "problems/<int:problem_pk>/hidden-test-bundle/<int:bundle_pk>/",
        HiddenTestBundleRetrieveUpdateAPIView.as_view(),
        name="hidden-test-bundle",
    ),
    path(
        "problems/<int:problem_pk>/reference-solutions/<int:pk>/",
        ReferenceSolutionVerdictUpdateAPIView.as_view(),
        name="reference-solution-update",
    ),
]
