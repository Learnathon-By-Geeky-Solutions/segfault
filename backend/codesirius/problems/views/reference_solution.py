import json
import logging

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from codesirius.kafa_producer import KafkaProducerSingleton
from codesirius.redis_client import RedisClientSingleton
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

        redis_client = RedisClientSingleton(host="redis", port=6379).get_client()
        client_id = request.data.get("clientId")

        if not client_id:
            raise ValidationError({"clientId": "clientId is required"})

        redis_user_id = redis_client.get(client_id)
        logger.info(f"Redis user ID: {redis_user_id}")
        if not redis_user_id:
            raise ValidationError({"clientId": "Invalid clientId"})

        if redis_user_id != str(request.user.id):
            logger.info(f"User ID mismatch: {redis_user_id} != {request.user.id}")
            # no need to let the client know about the mismatch
            raise ValidationError({"clientId": "Invalid clientId"})

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
                "python_reference_solution_validation",
                value=json.dumps(
                    {
                        "reference_solution_id": reference_solution.id,
                        "problem_id": problem.id,
                        "client_id": client_id,
                        "bucket_name": "codesirius-tests-data",
                        "grpc_server": settings.GRPC_SERVER,
                    }
                ),
                callback=delivery_report,
            )
            logger.info("Reference solution processing initiated")
            return CodesiriusAPIResponse(
                data=serializer.data,
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

        redis_client = RedisClientSingleton(host="redis", port=6379).get_client()
        client_id = request.data.get("clientId")

        if not client_id:
            raise ValidationError({"clientId": "clientId is required"})

        redis_user_id = redis_client.get(client_id)
        logger.info(f"Redis user ID: {redis_user_id}")
        if not redis_user_id:
            raise ValidationError({"clientId": "Invalid clientId"})

        if redis_user_id != str(request.user.id):
            logger.info(f"User ID mismatch: {redis_user_id} != {request.user.id}")
            # no need to let the client know about the mismatch
            raise ValidationError({"clientId": "Invalid clientId"})

        # TODO: remove passing problem to the context
        # Reset verdict to pending
        serializer = ReferenceSolutionSerializer(
            instance=reference_solution,
            data=request.data,
            context={"problem": problem},
            partial=True,
        )
        if serializer.is_valid():
            reference_solution = serializer.save()
            logger.info(f"Reference solution with ID: {pk} updated successfully")
            KafkaProducerSingleton.produce_message(
                "python_reference_solution_validation",
                value=json.dumps(
                    {
                        "reference_solution_id": reference_solution.id,
                        "problem_id": problem.id,
                        "client_id": client_id,
                        "bucket_name": "codesirius-tests-data",
                        "grpc_server": settings.GRPC_SERVER,
                    }
                ),
                callback=delivery_report,
            )
            logger.info("Reference solution processing initiated")
            return CodesiriusAPIResponse(
                data=serializer.data,
                message="Reference solution updated",
            )
        logger.warning("Reference solution update failed due to validation errors")
        raise ValidationError(serializer.errors)

    # def delete(
    #     self, request: Request, problem_pk: int, pk: int
    # ) -> CodesiriusAPIResponse:
    #     """
    #     Delete a reference solution by its primary key
    #     """
    #     logger.info(f"Deleting reference solution with ID: {pk}")
    #     try:
    #         problem = Problem.objects.get(pk=problem_pk)
    #         self.check_object_permissions(request, problem)
    #         reference_solution = problem.referencesolution_set.get(pk=pk)
    #         reference_solution.delete()
    #         logger.info(f"Reference solution with ID: {pk} deleted successfully")
    #         return CodesiriusAPIResponse(message="Reference solution deleted")
    #     except Problem.DoesNotExist:
    #         logger.error(f"Problem with ID: {problem_pk} does not exist")
    #         raise NotFound("Problem not found")
    #     except ReferenceSolution.DoesNotExist:
    #         logger.warning(f"Reference solution with ID: {pk} not found")
    #         raise NotFound("Reference solution not found")
