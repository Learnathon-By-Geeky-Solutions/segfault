from django.urls import path

from problems.views.language import (
    LanguageListCreateAPIView,
    LanguageRetrieveUpdateDestroyAPIView,
)
from problems.views.problem import (
    ProblemListCreateAPIView,
    ProblemRetrieveUpdateDestroyAPIView,
)
from problems.views.tag import TagListCreateAPIView, TagRetrieveUpdateDestroyAPIView

urlpatterns = [
    path("", ProblemListCreateAPIView.as_view(), name="problem-list-create"),
    path(
        "<int:pk>",
        ProblemRetrieveUpdateDestroyAPIView.as_view(),
        name="problem-retrieve-update-destroy",
    ),
    path("tags", TagListCreateAPIView.as_view(), name="tag-list-create"),
    path(
        "tags/<int:pk>",
        TagRetrieveUpdateDestroyAPIView.as_view(),
        name="tag-retrieve-update-destroy",
    ),
    path("languages", LanguageListCreateAPIView.as_view(), name="language-list-create"),
    path(
        "languages/<int:pk>",
        LanguageRetrieveUpdateDestroyAPIView.as_view(),
        name="language-retrieve-update-destroy",
    ),
]
