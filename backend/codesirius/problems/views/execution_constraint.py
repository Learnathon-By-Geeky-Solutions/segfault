import logging

from rest_framework import status
from rest_framework.exceptions import ValidationError, ParseError
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from problems.models import Problem
from problems.serializers.execution_constraint_v2 import (
    ExecutionConstraintSerializerBulk,
    BulkOperationError,
)

logger = logging.getLogger(__name__)


class ExecutionConstraintAPIView(APIView):
    def put(self, request, problem_pk):
        logger.info("Upserting execution constraints")
        try:
            problem = Problem.objects.prefetch_related("execution_constraints").get(
                pk=problem_pk
            )
            instances = problem.execution_constraints.filter(
                id__in=[data["id"] for data in request.data if data.get("id")]
            )
            serializer = ExecutionConstraintSerializerBulk(
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
            logger.error(f"Validation error upserting execution constraints: {str(e)}")
            raise e
        except ParseError:
            raise ValidationError({"payload": "Invalid JSON"})
        except BulkOperationError as e:
            raise e
        except Exception as e:
            logger.error(f"Error upserting execution constraints: {str(e)}")
            raise ValidationError("Error upserting execution constraints")
