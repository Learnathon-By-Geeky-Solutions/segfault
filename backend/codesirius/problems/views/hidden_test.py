import logging

logger = logging.getLogger(__name__)


import logging

from rest_framework.views import APIView

from codesirius.aws_client import AWSClient
from codesirius.codesirius_api_response import CodesiriusAPIResponse

logger = logging.getLogger(__name__)


class HiddenTestPresignedUrlAPIView(APIView):
    def get(self, request, problem_pk):
        logger.info("Generating presigned POST URL for hidden test")

        bucket_name = "unprocessed-hidden-tests"
        object_key = f"hidden-tests-{problem_pk}.zip"
        max_file_size = 16 * 1024 * 1024  # 16MB

        client = AWSClient("s3").get_client()
        presigned_post = client.generate_presigned_post(
            Bucket=bucket_name,
            Key=object_key,
            Fields={"Content-Type": "application/zip"},
            Conditions=[
                {"Content-Type": "application/zip"},  # Enforce content type
                ["content-length-range", 0, max_file_size],  # Enforce file size limit
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


class HiddenTestAPIView(APIView):
    pass
