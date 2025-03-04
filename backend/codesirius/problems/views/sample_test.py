import logging

from rest_framework import status
from rest_framework.exceptions import ValidationError, ParseError
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from problems.models import Problem
from problems.models.sample_test import SampleTest
from problems.serializers.execution_constraint_v2 import BulkOperationError
from problems.serializers.sample_test import SampleTestSerializerBulk

logger = logging.getLogger(__name__)


class SampleTestBulkAPIView(APIView):
    def put(self, request, problem_pk):
        logger.info("Upserting sample tests")
        try:
            problem = Problem.objects.prefetch_related("sample_tests").get(
                pk=problem_pk
            )
            instances = problem.sample_tests.filter(
                id__in=[data["id"] for data in request.data if "id" in data]
            )
            serializer = SampleTestSerializerBulk(
                instance=instances,
                data=request.data,
                many=True,
                context={"problem": problem},
                partial=True,
            )
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return CodesiriusAPIResponse(
                    status_code=status.HTTP_207_MULTI_STATUS,
                    data=serializer.data,
                )
        except Problem.DoesNotExist:
            raise ValidationError("Problem not found")
        except ValidationError as e:
            raise e
        except BulkOperationError as e:
            raise e
        except ParseError:
            raise ValidationError({"payload": "Invalid JSON"})
        except Exception as e:
            logger.info(f"Type of error: {e.with_traceback()}")
            logger.exception("Failed to upsert sample tests")
            raise ValidationError("Failed to upsert sample tests")


class SampleTestAPIView(APIView):
    def delete(self, request, problem_pk, sample_test_pk):
        logger.info("Deleting sample test")
        try:
            problem = Problem.objects.prefetch_related("sample_tests").get(
                pk=problem_pk
            )
            sample_test = problem.sample_tests.get(pk=sample_test_pk)
            sample_test.delete()
            return CodesiriusAPIResponse(
                status_code=status.HTTP_204_NO_CONTENT,
                message="Sample test deleted",
            )
        except Problem.DoesNotExist:
            raise ValidationError("Problem not found")
        except SampleTest.DoesNotExist:
            raise ValidationError("Sample test not found")
        except Exception:
            logger.exception("Failed to delete sample test")
            raise ValidationError("Failed to delete sample test")
