import logging
from collections import defaultdict

from django.db import transaction, IntegrityError  # For atomicity
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from codesirius.exception_handler import generate_timestamp
from problems.models import Problem, ExecutionConstraints
from problems.serializers.execution_constraints import ExecutionConstraintsSerializer

logger = logging.getLogger(__name__)


class ExecutionConstraintBulkCreateView(APIView):
    def post(self, request, problem_pk):
        """
        Create multiple execution constraints
        """
        try:
            problem = Problem.objects.get(pk=problem_pk)
            logger.info(
                f"Creating execution constraints for problem with ID: {problem_pk}"
            )
        except Problem.DoesNotExist:
            logger.error(f"Problem with ID: {problem_pk} not found")
            raise NotFound("Problem not found")

        errors = defaultdict(list)
        valid_instances = []

        if not request.data:
            return Response(
                {
                    "timestamp": generate_timestamp(),
                    "status": status.HTTP_400_BAD_REQUEST,
                    "error": "Bad Request",
                    "message": "No constraints provided.",
                    "path": request.path,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.info(f"Creating {len(request.data)} constraints")

        for index, constraint_data in enumerate(request.data):
            logger.info(f"Creating constraint {index}")
            serializer = ExecutionConstraintsSerializer(
                data=constraint_data, context={"problem": problem}
            )
            if serializer.is_valid():
                valid_instances.append(serializer.validated_data)
            else:
                for field, messages in serializer.errors.items():
                    for message in messages:
                        errors[index].append({"field": field, "message": message})

        logger.info(f"error length: {len(errors)}")
        if errors:
            logger.error(f"Errors while creating constraints - {errors}")
            return Response(
                {
                    "timestamp": generate_timestamp(),
                    "status": status.HTTP_400_BAD_REQUEST,
                    "error": "Bad Request",
                    "message": "Failed to create constraints.",
                    "path": request.path,
                    "errors": errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                ExecutionConstraints.objects.bulk_create(
                    [ExecutionConstraints(**data) for data in valid_instances]
                )
        except IntegrityError as e:
            logger.error(f"Error while creating constraints - {e}")
            return Response(
                {
                    "timestamp": generate_timestamp(),
                    "status": status.HTTP_400_BAD_REQUEST,
                    "error": "Bad Request",
                    "message": "This constraint already exists.",
                    # "message": str(e),
                    "path": request.path,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return CodesiriusAPIResponse(
            data=request.data,
            message="Constraints created successfully",
        )
