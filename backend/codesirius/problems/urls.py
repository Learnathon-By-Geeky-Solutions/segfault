from django.urls import path

from problems.views.language import (
    LanguageListCreateAPIView,
    LanguageRetrieveUpdateDestroyAPIView,
)
from problems.views.tag import TagListCreateAPIView, TagRetrieveUpdateDestroyAPIView

urlpatterns = [
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
