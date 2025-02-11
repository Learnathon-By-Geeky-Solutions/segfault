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
        serializer = TagSerializer(instance=Tag.objects.all(), many=True)
        return CodesiriusAPIResponse(data=serializer.data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            tag = serializer.save()
            return CodesiriusAPIResponse(
                data={"id": tag.id},
                status_code=status.HTTP_201_CREATED,
                message="Tag created",
            )
        raise ValidationError(serializer.errors)


class TagRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        try:
            tag = Tag.objects.get(pk=pk)
        except Tag.DoesNotExist:
            raise NotFound("Tag not found")
        except Exception as e:
            logger.error(f"Error while fetching tag: {e}")
            raise APIException(
                detail="Error while fetching tag",
                code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = TagSerializer(tag)
        return CodesiriusAPIResponse(data=serializer.data)

    def put(self, request, pk):
        tag = Tag.objects.get(pk=pk)
        serializer = TagSerializer(tag, data=request.data)
        if serializer.is_valid():
            tag = serializer.save()
            return CodesiriusAPIResponse(
                data={"id": tag.id},
                status_code=status.HTTP_200_OK,
                message="Tag updated",
            )
        raise ValidationError(serializer.errors)

    def patch(self, request, pk):
        tag = Tag.objects.get(pk=pk)
        serializer = TagSerializer(tag, data=request.data, partial=True)
        if serializer.is_valid():
            tag = serializer.save()
            return CodesiriusAPIResponse(
                data={"id": tag.id},
                status_code=status.HTTP_200_OK,
                message="Tag updated",
            )
        raise ValidationError

    def delete(self, request, pk):
        tag = Tag.objects.get(pk=pk)
        tag.delete()
        return CodesiriusAPIResponse(
            status_code=status.HTTP_204_NO_CONTENT, message="Tag deleted"
        )
