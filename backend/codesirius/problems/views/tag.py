import logging

from rest_framework import generics, status
from rest_framework.exceptions import APIException, NotFound
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from problems.models import Tag
from problems.serializers.tag import TagSerializer

logger = logging.getLogger(__name__)


class TagListCreateAPIView(generics.ListCreateAPIView):
    """
    API to list all tags or create a new tag
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request, *args, **kwargs):
        logger.info("Fetching all tags")
        response = super().list(request, *args, **kwargs)
        logger.info("Tags fetched successfully")
        return CodesiriusAPIResponse(data=response.data)

    def create(self, request, *args, **kwargs):
        logger.info("Creating a new tag")
        response = super().create(request, *args, **kwargs)
        logger.info(f"Tag created successfully with ID: {response.data.get('id')}")
        return CodesiriusAPIResponse(
            data={"id": response.data.get("id")},
            status_code=status.HTTP_201_CREATED,
            message="Tag created",
        )


class IsAdminOrReadOnly(IsAuthenticatedOrReadOnly):
    def has_permission(self, request, view):
        return request.user.is_staff


class TagRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API to retrieve, update, or delete a tag by its primary key
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        logger.info(f"Fetching tag with ID: {pk}")
        try:
            response = super().retrieve(request, *args, **kwargs)
            logger.info(f"Tag with ID: {pk} fetched successfully")
            return CodesiriusAPIResponse(data=response.data)
        except Tag.DoesNotExist:
            logger.warning(f"Tag with ID: {pk} not found")
            raise NotFound("Tag not found")
        except Exception as e:
            logger.error(f"Error while fetching tag with ID: {pk} - {e}")
            raise APIException("Error while fetching tag")

    def update(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        logger.info(f"Updating tag with ID: {pk}")
        response = super().update(request, *args, **kwargs)
        logger.info(f"Tag with ID: {pk} updated successfully")
        return CodesiriusAPIResponse(
            data={"id": response.data.get("id")},
            status_code=status.HTTP_200_OK,
            message="Tag updated",
        )

    def partial_update(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        logger.info(f"Partially updating tag with ID: {pk}")
        response = super().partial_update(request, *args, **kwargs)
        logger.info(f"Tag with ID: {pk} partially updated successfully")
        return CodesiriusAPIResponse(
            data={"id": response.data.get("id")},
            status_code=status.HTTP_200_OK,
            message="Tag updated",
        )

    def destroy(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        logger.info(f"Deleting tag with ID: {pk}")
        super().destroy(request, *args, **kwargs)
        logger.info(f"Tag with ID: {pk} deleted successfully")
        return CodesiriusAPIResponse(
            status_code=status.HTTP_204_NO_CONTENT,
            message="Tag deleted",
        )
