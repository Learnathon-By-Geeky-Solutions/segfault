from django.urls import path

from problems.views.tag import TagListCreateAPIView, TagRetrieveUpdateDestroyAPIView

urlpatterns = [
    path("tags", TagListCreateAPIView.as_view(), name="tag-list-create"),
    path(
        "tags/<int:pk>",
        TagRetrieveUpdateDestroyAPIView.as_view(),
        name="tag-retrieve-update-destroy",
    ),
]
