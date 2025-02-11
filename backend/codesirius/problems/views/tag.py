import logging

from rest_framework import status
from rest_framework.exceptions import ValidationError, NotFound, APIException
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from problems.models import Tag
from problems.serializers.tag import TagSerializer

logger = logging.getLogger(__name__)


class TagListCreateAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        """
        Get all tags
        """
        logger.info("Fetching all tags")
        tags = Tag.objects.all()
        serializer = TagSerializer(instance=tags, many=True)
        logger.info("Tags fetched successfully")
        return CodesiriusAPIResponse(data=serializer.data)

    def post(self, request):
        """
        Create a new tag
        """
        logger.info("Creating a new tag")
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            tag = serializer.save()
            logger.info(f"Tag created successfully with ID: {tag.id}")
            return CodesiriusAPIResponse(
                data={"id": tag.id},
                status_code=status.HTTP_201_CREATED,
                message="Tag created",
            )
        logger.warning("Tag creation failed due to validation errors")
        raise ValidationError(serializer.errors)


class TagRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Get a tag by its primary key
        """
        logger.info(f"Fetching tag with ID: {pk}")
        try:
            tag = Tag.objects.get(pk=pk)
            logger.info(f"Tag with ID: {pk} fetched successfully")
        except Tag.DoesNotExist:
            logger.warning(f"Tag with ID: {pk} not found")
            raise NotFound("Tag not found")
        except Exception as e:
            logger.error(f"Error while fetching tag with ID: {pk} - {e}")
            raise APIException(
                detail="Error while fetching tag",
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = TagSerializer(tag)
        return CodesiriusAPIResponse(data=serializer.data)

    def put(self, request, pk):
        """
        Update a tag by its primary key
        """
        logger.info(f"Updating tag with ID: {pk}")
        try:
            tag = Tag.objects.get(pk=pk)
        except Tag.DoesNotExist:
            logger.warning(f"Tag with ID: {pk} not found for update")
            raise NotFound("Tag not found")

        serializer = TagSerializer(tag, data=request.data)
        if serializer.is_valid():
            tag = serializer.save()
            logger.info(f"Tag with ID: {pk} updated successfully")
            return CodesiriusAPIResponse(
                data={"id": tag.id},
                status_code=status.HTTP_200_OK,
                message="Tag updated",
            )
        logger.warning(f"Tag update failed for ID: {pk} due to validation errors")
        raise ValidationError(serializer.errors)

    def patch(self, request, pk):
        """
        Partially update a tag by its primary key
        """
        logger.info(f"Partially updating tag with ID: {pk}")
        try:
            tag = Tag.objects.get(pk=pk)
        except Tag.DoesNotExist:
            logger.warning(f"Tag with ID: {pk} not found for partial update")
            raise NotFound("Tag not found")

        serializer = TagSerializer(tag, data=request.data, partial=True)
        if serializer.is_valid():
            tag = serializer.save()
            logger.info(f"Tag with ID: {pk} partially updated successfully")
            return CodesiriusAPIResponse(
                data={"id": tag.id},
                status_code=status.HTTP_200_OK,
                message="Tag updated",
            )
        logger.warning(
            f"Partial update failed for tag with ID: \
                        {pk} due to validation errors"
        )
        raise ValidationError(serializer.errors)

    def delete(self, request, pk):
        """
        Delete a tag by its primary key
        """
        logger.info(f"Deleting tag with ID: {pk}")
        try:
            tag = Tag.objects.get(pk=pk)
            tag.delete()
            logger.info(f"Tag with ID: {pk} deleted successfully")
            return CodesiriusAPIResponse(
                status_code=status.HTTP_204_NO_CONTENT, message="Tag deleted"
            )
        except Tag.DoesNotExist:
            logger.warning(f"Tag with ID: {pk} not found for deletion")
            raise NotFound("Tag not found")
        except Exception as e:
            logger.error(f"Error while deleting tag with ID: {pk} - {e}")
            raise APIException(
                detail="Error while deleting tag",
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
