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
