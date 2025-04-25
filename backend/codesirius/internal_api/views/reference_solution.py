import logging

from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from internal_api.serializers.reference_solution import ReferenceSolutionSerializer
from problems.models import ReferenceSolution

logger = logging.getLogger(__name__)


class ReferenceSolutionRetrieveAPIView(APIView):
    def get(self, request, problem_pk):
        try:
            reference_solution = (
                ReferenceSolution.objects.select_related(
                    "problem",
                    "problem__hidden_test_bundle",
                )
                .prefetch_related("problem__sample_tests")
                .only(
                    "id",
                    "code",
                    "language",
                    "verdict",
                    "problem__id",
                    "problem__hidden_test_bundle__id",
                    "problem__hidden_test_bundle__s3_path",
                    "problem__hidden_test_bundle__test_count",
                )
                .filter(problem_id=problem_pk)
            )
        except ReferenceSolution.DoesNotExist:
            raise NotFound("Reference solution not found")
        serializer = ReferenceSolutionSerializer(reference_solution, many=True)
        return CodesiriusAPIResponse(
            message="Reference solution fetched successfully", data=serializer.data
        )
