import logging

from rest_framework import status
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from internal_api.auth import APIAuthentication
from internal_api.serializers.submission import SubmissionSerializer
from problems.models import Submission

logger = logging.getLogger(__name__)


class SubmissionRetrieveUpdateAPIView(APIView):
    """
    This view is a part of internal API and
    intended to be used by the internal services only.

    This view is used to retrieve and update a submission.
    """

    authentication_classes = [APIAuthentication]

    def get(self, request, pk):
        """
        Get a submission by ID
        """
        logger.info(f"Fetching submission with ID: {pk}")
        try:
            submission = Submission.objects.get(pk=pk)
            logger.info(submission)
        except Submission.DoesNotExist:
            return CodesiriusAPIResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Submission not found",
            )
        except Exception as e:
            logger.error(f"Error fetching submission with ID: {pk}: {e}")
            return CodesiriusAPIResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Internal server error",
            )
        logger.info(f"Submission fetched successfully with ID: {submission.id}")
        return CodesiriusAPIResponse(data=SubmissionSerializer(submission).data)

    def patch(self, request, pk):
        """
        Update a submission (set verdict)
        """
        logger.info(f"Updating submission with ID: {pk}")
        try:
            submission = Submission.objects.get(pk=pk)
            serializer = SubmissionSerializer(
                instance=submission,
                data=request.data,
                partial=True,
            )
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                logger.info(f"Submission updated successfully with ID: {pk}")
                return CodesiriusAPIResponse(data=serializer.data)
        except Submission.DoesNotExist:
            return CodesiriusAPIResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Submission not found",
            )
        except Exception as e:
            logger.error(f"Error updating submission with ID: {pk}: {e}")
            return CodesiriusAPIResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Internal server error",
            )
