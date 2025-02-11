import logging

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from problems.models import Language
from problems.serializers.language import LanguageSerializer

logger = logging.getLogger(__name__)


class LanguageListCreateAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        """
        Get all languages
        """
        logger.info("Fetching all languages")
        languages = Language.objects.all()
        serializer = LanguageSerializer(instance=languages, many=True)
        logger.info("Languages fetched successfully")
        return CodesiriusAPIResponse(data=serializer.data)

    def post(self, request):
        """
        Create a new language
        """
        logger.info("Creating a new language")
        serializer = LanguageSerializer(data=request.data)
        if serializer.is_valid():
            language = serializer.save()
            logger.info(f"Language created successfully with ID: {language.id}")
            return CodesiriusAPIResponse(
                data={"id": language.id},
                status_code=status.HTTP_201_CREATED,
                message="Language created",
            )
        logger.warning("Language creation failed due to validation errors")
        raise ValidationError(serializer.errors)


class LanguageRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Get a language by its primary key
        """
        logger.info(f"Fetching language with ID: {pk}")
        try:
            language = Language.objects.get(pk=pk)
            logger.info(f"Language with ID: {pk} fetched successfully")
        except Language.DoesNotExist:
            logger.warning(f"Language with ID: {pk} not found")
            raise NotFound(f"Language with ID: {pk} not found")
        serializer = LanguageSerializer(instance=language)
        return CodesiriusAPIResponse(data=serializer.data)

    def put(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Update a language by its primary key
        """
        logger.info(f"Updating language with ID: {pk}")
        try:
            language = Language.objects.get(pk=pk)
            logger.info(f"Language with ID: {pk} fetched successfully")
        except Language.DoesNotExist:
            logger.warning(f"Language with ID: {pk} not found")
            raise NotFound(f"Language with ID: {pk} not found")
        serializer = LanguageSerializer(instance=language, data=request.data)
        if serializer.is_valid():
            language = serializer.save()
            logger.info(f"Language with ID: {pk} updated successfully")
            return CodesiriusAPIResponse(
                data={"id": language.id},
                message="Language updated",
            )
        logger.warning("Language update failed due to validation errors")
        raise ValidationError(serializer.errors)

    def patch(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Partially update a language by its primary key
        """
        logger.info(f"Partially updating language with ID: {pk}")
        try:
            language = Language.objects.get(pk=pk)
            logger.info(f"Language with ID: {pk} fetched successfully")
        except Language.DoesNotExist:
            logger.warning(f"Language with ID: {pk} not found")
            raise NotFound(f"Language with ID: {pk} not found")
        serializer = LanguageSerializer(
            instance=language, data=request.data, partial=True
        )
        if serializer.is_valid():
            language = serializer.save()
            logger.info(f"Language with ID: {pk} partially updated successfully")
            return CodesiriusAPIResponse(
                data={"id": language.id},
                message="Language partially updated",
            )
        logger.warning("Language partial update failed due to validation errors")
        raise ValidationError(serializer.errors)

    def delete(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Delete a language by its primary key
        """
        logger.info(f"Deleting language with ID: {pk}")
        try:
            language = Language.objects.get(pk=pk)
            logger.info(f"Language with ID: {pk} fetched successfully")
        except Language.DoesNotExist:
            logger.warning(f"Language with ID: {pk} not found")
            raise NotFound(f"Language with ID: {pk} not found")
        language.delete()
        logger.info(f"Language with ID: {pk} deleted successfully")
        return CodesiriusAPIResponse(message="Language deleted")
