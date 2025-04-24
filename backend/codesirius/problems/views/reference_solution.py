import json
import logging

from rest_framework import status
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from codesirius.kafa_producer import KafkaProducerSingleton
from problems.models import ReferenceSolution, Problem
from problems.serializers.reference_solution import ReferenceSolutionSerializer

logger = logging.getLogger(__name__)


def delivery_report(err, msg):
    if err:
        print(f"❌ Message delivery failed: {err}")
    else:
        print(f"✅ Message delivered to {msg.topic()} [{msg.partition()}]")


class IsProblemOwner(IsAuthenticated):
    def has_object_permission(self, request, view, obj: Problem):
        return obj.created_by == request.user


class ReferenceSolutionListCreateAPIView(APIView):
    permission_classes = [IsProblemOwner]

    def get(self, request, problem_pk):
        """
        Get all reference solutions of a problem
        """
        logger.info(
            f"Fetching all reference solutions of problem with ID: {problem_pk}"
        )
        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)
        except Problem.DoesNotExist:
            logger.error(f"Problem with ID: {problem_pk} does not exist")
            raise NotFound("Problem does not exist")
        reference_solutions = ReferenceSolution.objects.filter(problem=problem)
        serializer = ReferenceSolutionSerializer(
            instance=reference_solutions, many=True
        )
        logger.info("Reference solutions fetched successfully")
        return CodesiriusAPIResponse(data=serializer.data)

    def post(self, request, problem_pk):
        """
        Create a new reference solution
        """
        logger.info("Creating a new reference solution")
        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)
        except Problem.DoesNotExist:
            logger.error(f"Problem with ID: {problem_pk} does not exist")
            raise NotFound("Problem does not exist")

        # add the problem to the request data
        request.data["problemId"] = problem.pk
        logger.info(f"Request data: {request.data}")
        serializer = ReferenceSolutionSerializer(data=request.data)
        if serializer.is_valid():
            reference_solution = serializer.save()
            logger.info(
                f"Reference solution created successfully with ID: \
                    {reference_solution.id}"
            )
            KafkaProducerSingleton.produce_message(
                "reference_solution",
                value=json.dumps(
                    {
                        "reference_solution_id": reference_solution.id,
                        "grpc_server": "sse-server-dev:50051",  # same as SSE URL
                        # TODO: pull grpc_server from environment variables
                    }
                ),
                callback=delivery_report,
            )
            logger.info("Reference solution processing initiated")
            return CodesiriusAPIResponse(
                data={"id": reference_solution.id},
                status_code=status.HTTP_201_CREATED,
                message="Reference solution created",
            )
        logger.warning("Reference solution creation failed due to validation errors")
        raise ValidationError(serializer.errors)


class ReferenceSolutionRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [IsProblemOwner]

    def get(self, request: Request, problem_pk: int, pk: int) -> CodesiriusAPIResponse:
        """
        Get a reference solution by its primary key
        """
        logger.info(f"Fetching reference solution with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)
            reference_solution = problem.referencesolution_set.get(pk=pk)
            logger.info(f"Reference solution with ID: {pk} fetched successfully")
        except Problem.DoesNotExist:
            logger.error(f"Problem with ID: {problem_pk} does not exist")
            raise NotFound(
                "Reference solution not found"
            )  # do not expose the actual error
        except ReferenceSolution.DoesNotExist:
            logger.warning(f"Reference solution with ID: {pk} not found")
            raise NotFound("Reference solution not found")
        serializer = ReferenceSolutionSerializer(instance=reference_solution)
        return CodesiriusAPIResponse(data=serializer.data)

    def put(self, request: Request, problem_pk: int, pk: int) -> CodesiriusAPIResponse:
        """
        Update a reference solution by its primary key
        """
        logger.info(f"Updating reference solution with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)
            reference_solution = problem.referencesolution_set.get(pk=pk)
        except Problem.DoesNotExist:
            logger.error(f"Problem with ID: {problem_pk} does not exist")
            raise NotFound("Problem not found")
        except ReferenceSolution.DoesNotExist:
            logger.warning(f"Reference solution with ID: {pk} not found")
            raise NotFound("Reference solution not found")
        # TODO: remove passing problem to the context
        serializer = ReferenceSolutionSerializer(
            instance=reference_solution, data=request.data, context={"problem": problem}
        )
        if serializer.is_valid():
            reference_solution = serializer.save()
            logger.info(f"Reference solution with ID: {pk} updated successfully")
            return CodesiriusAPIResponse(
                data={"id": reference_solution.id},
                message="Reference solution updated",
            )
        logger.warning("Reference solution update failed due to validation errors")
        raise ValidationError(serializer.errors)

    def patch(
        self, request: Request, problem_pk: int, pk: int
    ) -> CodesiriusAPIResponse:
        """
        Partially update a reference solution by its primary key
        """
        logger.info(f"Partially updating reference solution with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)
            reference_solution = problem.referencesolution_set.get(pk=pk)
        except Problem.DoesNotExist:
            logger.error(f"Problem with ID: {problem_pk} does not exist")
            raise NotFound("Problem not found")
        except ReferenceSolution.DoesNotExist:
            logger.warning(f"Reference solution with ID: {pk} not found")
            raise NotFound("Reference solution not found")
        # TODO: remove passing problem to the context
        serializer = ReferenceSolutionSerializer(
            instance=reference_solution,
            data=request.data,
            context={"problem": problem},
            partial=True,
        )
        if serializer.is_valid():
            reference_solution = serializer.save()
            logger.info(f"Reference solution with ID: {pk} updated successfully")
            return CodesiriusAPIResponse(
                data={"id": reference_solution.id},
                message="Reference solution updated",
            )
        logger.warning("Reference solution update failed due to validation errors")
        raise ValidationError(serializer.errors)

    def delete(
        self, request: Request, problem_pk: int, pk: int
    ) -> CodesiriusAPIResponse:
        """
        Delete a reference solution by its primary key
        """
        logger.info(f"Deleting reference solution with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)
            reference_solution = problem.referencesolution_set.get(pk=pk)
            reference_solution.delete()
            logger.info(f"Reference solution with ID: {pk} deleted successfully")
            return CodesiriusAPIResponse(message="Reference solution deleted")
        except Problem.DoesNotExist:
            logger.error(f"Problem with ID: {problem_pk} does not exist")
            raise NotFound("Problem not found")
        except ReferenceSolution.DoesNotExist:
            logger.warning(f"Reference solution with ID: {pk} not found")
            raise NotFound("Reference solution not found")
