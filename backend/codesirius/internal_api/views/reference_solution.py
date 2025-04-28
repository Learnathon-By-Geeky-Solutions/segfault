import logging

from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from internal_api.auth import APIAuthentication
from internal_api.serializers.reference_solution import ReferenceSolutionSerializer
from problems.models import ReferenceSolution

logger = logging.getLogger(__name__)


class ReferenceSolutionVerdictUpdateAPIView(APIView):
    """
    This is view is a part of internal API and
    intended to be used by the internal services only.

    This view is used to update a reference solution. (To set verdict)
    """

    authentication_classes = [APIAuthentication]

    def get_object(self, pk):
        """
        Get a reference solution by ID
        """
        try:
            return ReferenceSolution.objects.get(pk=pk)
        except ReferenceSolution.DoesNotExist:
            logger.error(f"Reference solution with ID: {pk} does not exist")
            raise NotFound("Reference solution does not exist")

    def patch(self, request, problem_pk, pk):
        """
        Update a reference solution
        """
        logger.info(f"Updating reference solution with ID: {pk}")

        reference_solution = self.get_object(pk)

        serializer = ReferenceSolutionSerializer(
            instance=reference_solution,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            logger.info(f"Reference solution updated successfully with ID: {pk}")
            return CodesiriusAPIResponse(data=serializer.data)

        logger.error(f"Failed to update reference solution with ID: {pk}")
        return CodesiriusAPIResponse(
            status_code=400,
            message="Failed to update reference solution",
            data=serializer.errors,
        )
