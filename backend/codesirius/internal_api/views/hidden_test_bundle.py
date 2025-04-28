import logging

from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from internal_api.auth import APIAuthentication
from internal_api.serializers.hidden_test_bundle import HiddenTestBundleSerializer
from problems.models import HiddenTestBundle, Problem

logger = logging.getLogger(__name__)


class HiddenTestBundleAPIView(APIView):
    authentication_classes = [APIAuthentication]

    def get_problem(self, problem_pk: int) -> Problem:
        try:
            return Problem.objects.get(id=problem_pk)
        except Problem.DoesNotExist:
            raise NotFound("Problem not found")
        except Exception as e:
            logger.exception(e)
            raise NotFound("Failed to retrieve problem")

    def post(self, request: Request, problem_pk: int) -> CodesiriusAPIResponse:
        problem = self.get_problem(problem_pk)
        logger.info(f"Creating hidden test bundle for problem {problem.id}")
        if hasattr(problem, "hidden_test_bundle"):
            raise ValidationError("Hidden test bundle already exists for this problem")
        request.data["problem_id"] = problem.id
        serializer = HiddenTestBundleSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return CodesiriusAPIResponse(
                data=serializer.data, status_code=status.HTTP_201_CREATED
            )


class HiddenTestBundleRetrieveUpdateAPIView(APIView):
    def get_object(self, bundle_pk: int, problem_pk: int) -> HiddenTestBundle:
        try:
            return HiddenTestBundle.objects.get(id=bundle_pk, problem_id=problem_pk)
        except HiddenTestBundle.DoesNotExist:
            raise NotFound("Hidden test bundle not found")
        except Exception as e:
            logger.exception(e)
            raise NotFound("Failed to retrieve hidden test bundle")

    def get(
        self, request: Request, problem_pk: int, bundle_pk: int
    ) -> CodesiriusAPIResponse:
        hidden_test_bundle = self.get_object(bundle_pk, problem_pk)
        serializer = HiddenTestBundleSerializer(hidden_test_bundle)
        return CodesiriusAPIResponse(serializer.data)
