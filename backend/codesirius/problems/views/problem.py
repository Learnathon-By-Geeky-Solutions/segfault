import logging
from typing import Dict

from rest_framework import status
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import IsAuthenticatedOrReadOnly, BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from problems.models import Problem
from problems.serializers.problem import ProblemSerializer

logger = logging.getLogger(__name__)


class IsOwnerOrPublishedOnly(BasePermission):
    """
    Custom permission class to allow only the owner of an object to see all versions
    or allow others to see only published versions.
    """

    def has_permission(self, request, view):
        # allow all safe methods
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True
        # other methods (POST, PUT, PATCH, DELETE) require authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            # Check if the object is published or if the user is the owner
            return (
                obj.status == Problem.Status.PUBLISHED or obj.created_by == request.user
            )
        # Write permissions are only allowed to the owner of the problem.
        return obj.created_by == request.user


class ProblemListCreateAPIView(APIView):
    permission_classes = [IsOwnerOrPublishedOnly]

    def get(self, request):
        """
        Get all problems
        """
        logger.info("Fetching all problems")
        problems = Problem.objects.filter(
            status=Problem.Status.PUBLISHED
        ) | Problem.objects.filter(
            created_by=request.user if request.user.is_authenticated else None
        )
        serializer = ProblemSerializer(instance=problems, many=True)
        logger.info("Problems fetched successfully")
        return CodesiriusAPIResponse(data=serializer.data)

    def post(self, request):
        """
        Create a new problem
        """
        logger.info("Creating a new problem")
        serializer = ProblemSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            problem = serializer.save()
            logger.info(f"Problem created successfully with ID: {problem.id}")
            return CodesiriusAPIResponse(
                data=serializer.data,
                status_code=status.HTTP_201_CREATED,
                message="Problem created",
            )
        logger.warning("Problem creation failed due to validation errors")
        raise ValidationError(serializer.errors)


class IsOwnerOrReadOnly(IsAuthenticatedOrReadOnly):
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user


class ProblemRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [IsOwnerOrPublishedOnly]

    def get(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Get a problem by its primary key
        """
        logger.info(f"Fetching problem with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=pk)
            logger.info(f"Problem with ID: {pk} fetched successfully")
            self.check_object_permissions(request, problem)
        except Problem.DoesNotExist:
            logger.warning(f"Problem with ID: {pk} not found")
            raise NotFound("Problem not found")
        serializer = ProblemSerializer(instance=problem)
        return CodesiriusAPIResponse(data=serializer.data)

    def put(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Update a problem by its primary key
        """
        logger.info(f"Updating problem with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=pk)
            self.check_object_permissions(request, problem)
            logger.info(f"Problem with ID: {pk} fetched successfully")
        except Problem.DoesNotExist:
            logger.warning(f"Problem with ID: {pk} not found")
            raise NotFound("Problem not found")
        serializer = ProblemSerializer(instance=problem, data=request.data)
        if serializer.is_valid():
            problem = serializer.save()
            logger.info(f"Problem with ID: {pk} updated successfully")
            return CodesiriusAPIResponse(
                data={
                    "id": problem.id,
                    "languages": [language.id for language in problem.languages.all()],
                    "tags": [tag.id for tag in problem.tags.all()],
                },
                message="Problem updated",
            )
        logger.warning("Problem update failed due to validation errors")
        raise ValidationError(serializer.errors)

    def patch(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Partially update a problem by its primary key
        """
        logger.info(f"Partially updating problem with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=pk)
            self.check_object_permissions(request, problem)
            logger.info(f"Problem with ID: {pk} fetched successfully")
        except Problem.DoesNotExist:
            logger.warning(f"Problem with ID: {pk} not found")
            raise NotFound("Problem not found")
        serializer = ProblemSerializer(
            instance=problem,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid(raise_exception=True):
            problem = serializer.save()
            logger.info(f"Problem with ID: {pk} updated successfully")
            return CodesiriusAPIResponse(
                data=serializer.data, message="Problem updated"
            )
        logger.warning("Problem update failed due to validation errors")
        raise ValidationError(serializer.errors)

    def delete(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Delete a problem by its primary key
        """
        logger.info(f"Deleting problem with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=pk)
            logger.info(f"Problem with ID: {pk} fetched successfully")
            self.check_object_permissions(request, problem)
        except Problem.DoesNotExist:
            logger.warning(f"Problem with ID: {pk} not found")
            raise NotFound("Problem not found")
        problem.delete()
        logger.info(f"Problem with ID: {pk} deleted successfully")
        return CodesiriusAPIResponse(message="Problem deleted")
