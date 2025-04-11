import logging

from rest_framework import status
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from internal_api.auth import APIAuthentication
from problems.models import Problem
from problems.serializers.problem import ProblemSerializer

logger = logging.getLogger(__name__)


class ProblemRetrieveUpdateAPIView(APIView):
    """
    This is view is a part of internal API and
    intended to be used by the internal services only.

    This view is used to retrieve and update a problem.
    """

    authentication_classes = [APIAuthentication]

    def get(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        logger.info(f"Fetching problem with ID: {pk}")

        try:
            problem = Problem.objects.get(pk=pk)
        except Problem.DoesNotExist:
            return CodesiriusAPIResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Problem not found",
            )

        logger.info(f"Problem fetched successfully with ID: {problem.id}")
        return CodesiriusAPIResponse(data=ProblemSerializer(problem).data)

    def patch(self, request, pk):
        logger.info(f"Updating problem with ID: {pk}")
