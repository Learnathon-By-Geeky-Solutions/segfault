import logging
from typing import Dict

from rest_framework import status
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly, BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from codesirius.codesirius_api_response import CodesiriusAPIResponse
from problems.models import Problem, ReferenceSolution, Tag
from problems.serializers.problem import ProblemSerializer
from problems.views.hidden_test import IsOwner

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
        Get all problems with optional filtering by title and tags
        """
        logger.info("Fetching all problems")
        problems = Problem.objects.filter(
            status=Problem.Status.PUBLISHED
        ) | Problem.objects.filter(
            created_by=request.user if request.user.is_authenticated else None
        )

        # Apply filters
        title = request.query_params.get("title", None)
        tags = request.query_params.getlist("tags", [])

        if title:
            problems = problems.filter(title__icontains=title)
            logger.info(f"Filtering problems by title: {title}")

        if tags:
            # Convert tag IDs to integers
            try:
                tag_ids = [int(tag_id) for tag_id in tags]
                # Get all tags that exist
                existing_tags = Tag.objects.filter(id__in=tag_ids)
                if existing_tags.exists():
                    # Filter problems that have all the specified tags
                    for tag in existing_tags:
                        problems = problems.filter(tags=tag)
                    logger.info(f"Filtering problems by tags: {tag_ids}")
            except ValueError:
                logger.warning("Invalid tag IDs provided")
                raise ValidationError({"tags": "Invalid tag IDs provided"})

        # Apply pagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        paginator.page_size_query_param = "page_size"
        paginator.max_page_size = 100

        result_page = paginator.paginate_queryset(problems, request)
        serializer = ProblemSerializer(instance=result_page, many=True)

        # Get pagination metadata
        pagination_data = {
            "count": paginator.page.paginator.count,
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link(),
            "current_page": paginator.page.number,
            "total_pages": paginator.page.paginator.num_pages,
        }

        logger.info("Problems fetched successfully")
        return CodesiriusAPIResponse(
            data={"results": serializer.data, "pagination": pagination_data}
        )

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
    permission_classes = [IsOwner]

    def get_permissions(self):
        """
        Override get_permissions to use different permissions for GET method
        """
        if self.request.method == "GET":
            return [IsOwnerOrPublishedOnly()]
        return [IsOwner()]

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

            # Get current languages before update
            current_languages = set(problem.languages.values_list("id", flat=True))

            serializer = ProblemSerializer(instance=problem, data=request.data)
            if serializer.is_valid():
                problem = serializer.save()
                logger.info(f"Problem with ID: {pk} updated successfully")

                # Get languages after update
                new_languages = set(problem.languages.values_list("id", flat=True))

                # Find languages that were removed
                removed_languages = current_languages - new_languages

                # Delete reference solutions for removed languages
                if removed_languages:
                    deleted_count = problem.referencesolution_set.filter(
                        language_id__in=removed_languages
                    ).delete()[0]
                    logger.info(
                        f"Deleted {deleted_count} reference solutions for removed languages: {removed_languages}"
                    )

                return CodesiriusAPIResponse(
                    data={
                        "id": problem.id,
                        "languages": [
                            language.id for language in problem.languages.all()
                        ],
                        "tags": [tag.id for tag in problem.tags.all()],
                    },
                    message="Problem updated",
                )
            logger.warning("Problem update failed due to validation errors")
            raise ValidationError(serializer.errors)
        except Problem.DoesNotExist:
            logger.warning(f"Problem with ID: {pk} not found")
            raise NotFound("Problem not found")

    def patch(self, request: Request, pk: int) -> CodesiriusAPIResponse:
        """
        Partially update a problem by its primary key
        """
        logger.info(f"Partially updating problem with ID: {pk}")
        try:
            problem = Problem.objects.get(pk=pk)
            self.check_object_permissions(request, problem)
            logger.info(f"Problem with ID: {pk} fetched successfully")

            # Get current languages before update
            current_languages = set(problem.languages.values_list("id", flat=True))

            serializer = ProblemSerializer(
                instance=problem,
                data=request.data,
                partial=True,
                context={"request": request},
            )

            if serializer.is_valid(raise_exception=True):
                problem = serializer.save()
                logger.info(f"Problem with ID: {pk} updated successfully")

                # Get languages after update
                new_languages = set(problem.languages.values_list("id", flat=True))

                # Find languages that were removed
                removed_languages = current_languages - new_languages

                # Delete reference solutions for removed languages
                if removed_languages:
                    deleted_count = problem.referencesolution_set.filter(
                        language_id__in=removed_languages
                    ).delete()[0]
                    logger.info(
                        f"Deleted {deleted_count} reference solutions for removed languages: {removed_languages}"
                    )

                return CodesiriusAPIResponse(
                    data=serializer.data, message="Problem updated"
                )
            logger.warning("Problem update failed due to validation errors")
            raise ValidationError(serializer.errors)
        except Problem.DoesNotExist:
            logger.warning(f"Problem with ID: {pk} not found")
            raise NotFound("Problem not found")

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


class ProblemPublishAPIView(APIView):
    permission_classes = [IsOwnerOrReadOnly]

    @staticmethod
    def _is_ready_to_publish(problem: Problem) -> Dict[str, str]:
        """
        Check if the problem is ready to be published
        """
        errors = {}
        if not problem.title:
            errors["title"] = "Title is required"
        if not problem.description:
            errors["description"] = "Description is required"
        if not problem.languages.exists():
            errors["languages"] = "At least one language is required"
        if not problem.tags.exists():
            errors["tags"] = "At least one tag is required"

        if set(
            problem.execution_constraints.values_list("language__id", flat=True)
        ) != set(problem.languages.values_list("id", flat=True)):
            errors["execution_constraints"] = (
                "Execution constraints must be defined for all languages"
            )

        # Check for reference solutions
        reference_solutions = problem.referencesolution_set.all()
        if not reference_solutions.exists():
            errors["reference_solutions"] = (
                "Reference solutions are required for all languages"
            )
        else:
            # Get all languages that have reference solutions with ACCEPTED verdict
            accepted_languages = set(
                reference_solutions.filter(
                    verdict=ReferenceSolution.Verdict.ACCEPTED
                ).values_list("language__id", flat=True)
            )
            # Get all languages that the problem supports
            problem_languages = set(problem.languages.values_list("id", flat=True))

            # Check if all problem languages have accepted reference solutions
            if accepted_languages != problem_languages:
                missing_languages = problem_languages - accepted_languages
                errors["reference_solutions"] = (
                    f"Reference solutions with ACCEPTED verdict are required for all languages. "
                    f"Missing for languages with IDs: {missing_languages}"
                )

        # Check for sample tests
        if not problem.sample_tests.exists():
            errors["sample_tests"] = "At least one sample test is required"

        return errors

    def post(self, request: Request, problem_pk: int) -> CodesiriusAPIResponse:
        """
        Publish a problem by its primary key
        """
        logger.info(f"Publishing problem with ID: {problem_pk}")
        try:
            problem = Problem.objects.get(pk=problem_pk)
            self.check_object_permissions(request, problem)
            logger.info(f"Problem with ID: {problem_pk} fetched successfully")
        except Problem.DoesNotExist:
            logger.warning(f"Problem with ID: {problem_pk} not found")
            raise NotFound("Problem not found")

        errors = self._is_ready_to_publish(problem)
        if errors:
            logger.warning("Problem cannot be published due to validation errors")
            raise ValidationError(errors)

        problem.status = Problem.Status.PUBLISHED
        problem.save()
        logger.info(f"Problem with ID: {problem_pk} published successfully")
        return CodesiriusAPIResponse(message="Problem published")
