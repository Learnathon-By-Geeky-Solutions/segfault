from django.urls import path

from problems.views.execution_constraint import ExecutionConstraintAPIView
from problems.views.hidden_test import HiddenTestPresignedUrlAPIView
from problems.views.language import (
    LanguageListCreateAPIView,
    LanguageRetrieveUpdateDestroyAPIView,
)
from problems.views.problem import (
    ProblemListCreateAPIView,
    ProblemRetrieveUpdateDestroyAPIView,
    ProblemPublishAPIView,
)
from problems.views.reference_solution import (
    ReferenceSolutionListCreateAPIView,
    ReferenceSolutionRetrieveUpdateDestroyAPIView,
)
from problems.views.sample_test import SampleTestAPIView, SampleTestBulkAPIView
from problems.views.tag import TagListCreateAPIView, TagRetrieveUpdateDestroyAPIView

urlpatterns = [
    path("", ProblemListCreateAPIView.as_view(), name="problem-list-create"),
    path(
        "<int:pk>/",
        ProblemRetrieveUpdateDestroyAPIView.as_view(),
        name="problem-retrieve-update-destroy",
    ),
    path("tags/", TagListCreateAPIView.as_view(), name="tag-list-create"),
    path(
        "tags/<int:pk>",
        TagRetrieveUpdateDestroyAPIView.as_view(),
        name="tag-retrieve-update-destroy",
    ),
    path(
        "languages/", LanguageListCreateAPIView.as_view(), name="language-list-create"
    ),
    path(
        "languages/<int:pk>",
        LanguageRetrieveUpdateDestroyAPIView.as_view(),
        name="language-retrieve-update-destroy",
    ),
    path(
        "<int:problem_pk>/reference-solutions/",
        ReferenceSolutionListCreateAPIView.as_view(),
        name="reference-solution-list-create",
    ),
    path(
        "<int:problem_pk>/reference-solutions/<int:pk>/",
        ReferenceSolutionRetrieveUpdateDestroyAPIView.as_view(),
        name="reference-solution-retrieve-update-destroy",
    ),
    path(
        "<int:problem_pk>/execution-constraints/",
        ExecutionConstraintAPIView.as_view(),
        name="execution-constraint",
    ),
    path(
        "<int:problem_pk>/tests/",
        SampleTestBulkAPIView.as_view(),
        name="sample-test-bulk",
    ),
    path(
        "<int:problem_pk>/tests/<int:sample_test_pk>/",
        SampleTestAPIView.as_view(),
        name="sample-test",
    ),
    path(
        "<int:problem_pk>/publish/",
        ProblemPublishAPIView.as_view(),
        name="problem-publish",
    ),
]
