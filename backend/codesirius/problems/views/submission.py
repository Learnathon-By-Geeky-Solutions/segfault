import json
import logging

from rest_framework import status
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from codesirius.kafa_producer import KafkaProducerSingleton
from codesirius.redis_client import RedisClientSingleton
from problems.models import Problem, Submission
from problems.serializers.submission import SubmissionSerializer
from problems.views.problem import IsOwnerOrPublishedOnly
from django.conf import settings

logger = logging.getLogger(__name__)


def delivery_report(err, msg):
    if err:
        print(f"❌ Message delivery failed: {err}")
    else:
        print(f"✅ Message delivered to {msg.topic()} [{msg.partition()}]")


class SubmissionListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, problem_pk):
        """
        Get all submissions of a problem submitted by current user
        """
        logger.info(
            f"Fetching all submissions of problem with ID: {problem_pk} \
            submitted by user {request.user.username}"
        )
        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)
        except Problem.DoesNotExist:
            logger.error(f"Problem with ID: {problem_pk} does not exist")
            raise NotFound("Problem does not exist")
        submission = Submission.objects.filter(
            problem=problem, created_by=request.user
        ).order_by("-created_at")
        serializer = SubmissionSerializer(instance=submission, many=True)
        logger.info("Submissions fetched successfully")
        return CodesiriusAPIResponse(data=serializer.data)

    def post(self, request, problem_pk):
        """
        Create a new submission
        """
        logger.info("Creating a new submission")
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
        serializer = SubmissionSerializer(data=request.data)
        if serializer.is_valid():
            submission = serializer.save(created_by=request.user)
            logger.info(
                f"Submission created successfully with ID: \
                    {submission.id}"
            )
            KafkaProducerSingleton.produce_message(
                "python_submission",
                value=json.dumps(
                    {
                        "submission_id": submission.id,
                        "problem_id": problem.id,
                        "client_id": client_id,
                        "bucket_name": "codesirius-tests-data",
                        "grpc_server": settings.GRPC_SERVER,
                    }
                ),
                callback=delivery_report,
            )
            logger.info("Submission processing initiated")
            return CodesiriusAPIResponse(
                data=serializer.data,
                status_code=status.HTTP_201_CREATED,
                message="Submission created",
            )
        logger.warning("Submission creation failed due to validation errors")
        raise ValidationError(serializer.errors)
