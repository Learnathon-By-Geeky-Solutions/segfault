import json
import logging

from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import BasePermission
from rest_framework.views import APIView

from codesirius.aws_client import AWSClient
from codesirius.codesirius_api_response import CodesiriusAPIResponse
from codesirius.kafa_producer import KafkaProducerSingleton
from codesirius.redis_client import RedisClientSingleton
from problems.models import Problem
from django.conf import settings

logger = logging.getLogger(__name__)


def delivery_report(err, msg):
    if err:
        print(f"❌ Message delivery failed: {err}")
    else:
        print(f"✅ Message delivered to {msg.topic()} [{msg.partition()}]")


class IsOwner(BasePermission):
    """
    Custom permission class to allow only the owner of an object to
    1. create a presigned URL for hidden tests to be uploaded.
    2. initiate the hidden test processing.
    3. delete the hidden tests.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user


class HiddenTestPresignedUrlAPIView(APIView):
    permission_classes = [IsOwner]

    def get(self, request, problem_pk):
        logger.info("Generating presigned POST URL for hidden test")

        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)

            bucket_name = "codesirius-tests-data"
            object_key = f"unprocessed/{problem_pk}/hidden-tests.zip"
            max_file_size = 16 * 1024 * 1024  # 16MB

            client = AWSClient("s3").get_client()
            presigned_post = client.generate_presigned_post(
                Bucket=bucket_name,
                Key=object_key,
                Fields={"Content-Type": "application/zip"},
                Conditions=[
                    {"Content-Type": "application/zip"},  # Enforce content type
                    ["content-length-range", 0, max_file_size],
                    # Enforce file size limit
                ],
                ExpiresIn=300,
            )

            logger.info("Presigned POST URL generated successfully with 16MB limit")

            return CodesiriusAPIResponse(
                message="Presigned POST URL generated",
                data={
                    "url": presigned_post["url"],
                    "fields": presigned_post["fields"],
                },
            )
        except (Problem.DoesNotExist, PermissionDenied) as e:
            raise ValidationError({"problem_id": e})
        except Exception as e:
            logger.error(f"Failed to generate presigned POST URL: {e}")
            raise ValidationError("Failed to generate presigned POST URL")


class HiddenTestInitiateProcessAPIView(APIView):
    permission_classes = [IsOwner]

    def post(self, request, problem_pk):
        logger.info("Processing hidden tests")

        # Fetch problem and check permissions
        problem = get_object_or_404(Problem, pk=problem_pk)
        self.check_object_permissions(request, problem)

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

        if hasattr(problem, "hidden_test_bundle"):
            raise ValidationError({"problem_id": "Hidden test bundle already exists"})

        try:
            KafkaProducerSingleton.produce_message(
                "hidden_test",
                value=json.dumps(
                    {
                        "problem_id": problem_pk,
                        "client_id": client_id,
                        "bucket_name": "codesirius-tests-data",
                        "grpc_server": settings.GRPC_SERVER,
                        "user_id": request.user.id,
                    }
                ),
                callback=delivery_report,
            )
            logger.info("Hidden tests processing initiated")
            return CodesiriusAPIResponse(message="Hidden tests processing initiated")

        except Exception as e:
            logger.error(f"Kafka message production failed: {e}")
            raise ValidationError("Failed to initiate hidden test processing")


class HiddenTestDeleteAPIView(APIView):
    permission_classes = [IsOwner]

    @staticmethod
    def get_object(problem_pk):
        try:
            problem = Problem.objects.get(
                pk=problem_pk,
            )
            if not hasattr(problem, "hidden_test_bundle"):
                raise Problem.DoesNotExist("Hidden test bundle does not exist")
            return problem
        except Problem.DoesNotExist as e:
            raise NotFound(e)
        except Exception as e:
            logger.exception(e)
            raise ValidationError("Failed to retrieve problem")

    def delete(self, request, problem_pk):
        logger.info("Deleting hidden tests")

        problem = HiddenTestDeleteAPIView.get_object(problem_pk)
        self.check_object_permissions(request, problem)

        try:
            client = AWSClient("s3").get_client()
            client.delete_object(
                Bucket="codesirius-tests-data",
                Key=problem.hidden_test_bundle.s3_path,
            )
            logger.info("Hidden tests deleted from S3 bucket")

            problem.hidden_test_bundle.delete()

            return CodesiriusAPIResponse(message="Hidden tests deleted")
        except Exception as e:
            logger.error(f"Failed to delete hidden tests: {e}")
            raise ValidationError("Failed to delete hidden tests")
