import logging

from rest_framework import serializers

from problems.models import Problem, Language, Tag, ExecutionConstraint
from problems.serializers.execution_constraint_v2 import (
    ExecutionConstraintSerializerV2,
)
from problems.serializers.language import LanguageSerializer
from problems.serializers.tag import TagSerializer

logger = logging.getLogger(__name__)


class ProblemSerializer(serializers.ModelSerializer):
    createdBy = serializers.PrimaryKeyRelatedField(read_only=True, source="created_by")

    # this field is used to accept a list of language ids
    languageIds = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Language.objects.only("id"),
        write_only=True,
        source="new_languages",
    )

    tagIds = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.only("id"), write_only=True, source="new_tags"
    )

    # this field is used to return a list of language objects
    languages = LanguageSerializer(many=True, read_only=True)

    # this field is used to return a list of tag objects
    tags = TagSerializer(many=True, read_only=True)

    executionConstraints = ExecutionConstraintSerializerV2(
        many=True, source="execution_constraints", required=False
    )

    class Meta:
        model = Problem
        fields = [
            "id",
            "title",
            "languageIds",
            "languages",
            "tagIds",
            "tags",
            "description",
            "executionConstraints",
            "status",
            "createdBy",
        ]
        extra_kwargs = {
            "status": {"default": Problem.Status.DRAFT, "read_only": True},
            "id": {"read_only": True},
        }

    def validate_executionConstraints(self, execution_constraints):
        """
        Ensure that each execution constraint's languageId is present in language_ids.
        """
        # get the language ids from the initial data
        language_ids = self.initial_data.get("languageIds")
        if language_ids is None and self.instance:
            language_ids = list(self.instance.languages.values_list("id", flat=True))
            logger.info(f"language_ids: {language_ids}")

        if not isinstance(language_ids, list):
            raise serializers.ValidationError("language_ids must be a list.")

        allowed_language_ids = set(map(int, language_ids))
        logger.info(f"allowed_language_ids: {allowed_language_ids}")
        execution_constraints_language_ids = [
            constraint["language"].id for constraint in execution_constraints
        ]
        if not set(execution_constraints_language_ids).issubset(allowed_language_ids):
            raise serializers.ValidationError(
                "Invalid execution constraints:  "
                "The language specified in each constraint must correspond to an "
                "allowed language for the problem."
            )
        if len(execution_constraints) != len(set(execution_constraints_language_ids)):
            raise serializers.ValidationError(
                "Duplicate execution constraints for the same language are not allowed."
                " Ensure each language has only one execution constraint defined."
            )
        return execution_constraints

    @staticmethod
    def _extract_related_data(validated_data):
        """
        Extract the related data from the validated data.
        """
        new_languages = validated_data.pop("new_languages", [])
        new_tags = validated_data.pop("new_tags", [])
        constraints_data = validated_data.pop("execution_constraints", [])
        return new_languages, new_tags, constraints_data

    def create(self, validated_data):
        request_user = self.context["request"].user

        # extract the related data
        new_languages, new_tags, constraints_data = (
            ProblemSerializer._extract_related_data(validated_data)
        )

        # create the problem instance without the languages, tags and constraints
        problem = Problem.objects.create(created_by=request_user, **validated_data)
        # now set the languages and tags
        problem.languages.set(new_languages)
        problem.tags.set(new_tags)

        # create the execution constraints instances
        new_constraints = [
            ExecutionConstraint(problem=problem, **constraint_data)
            for constraint_data in constraints_data
        ]

        # bulk create the constraints
        if new_constraints:
            ExecutionConstraint.objects.bulk_create(new_constraints)

        return problem

    def update(self, instance, validated_data):
        logger.info("Updating problem")
        # Process language_ids and tag_ids only if they are provided in the validated data

        # extract the related data
        new_languages, new_tags, execution_constraints_data = (
            ProblemSerializer._extract_related_data(validated_data)
        )
        if new_languages:
            instance.languages.set(new_languages)
            # remove the constraints for the languages that are not present in the new_languages
            instance.execution_constraints.exclude(
                language__id__in=[language.id for language in new_languages]
            ).delete()

        if new_tags:
            instance.tags.set(new_tags)

        # Update other fields, only if present in validated_data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # Update Execution Constraints
        if execution_constraints_data:
            logger.info("Updating execution constraints")
            existing_constraints = {
                ec.language_id: ec for ec in instance.execution_constraints.all()
            }
            new_execution_constraints = []
            updated_execution_constraints = []
            updated_execution_constraints_language_ids = []

            for constraint_data in execution_constraints_data:
                language = constraint_data["language"]
                if language.id in existing_constraints:
                    # update the existing constraint
                    constraint = existing_constraints[language.id]
                    constraint.time_limit = constraint_data.get(
                        "time_limit", constraint.time_limit
                    )
                    constraint.memory_limit = constraint_data.get(
                        "memory_limit", constraint.memory_limit
                    )
                    updated_execution_constraints.append(constraint)
                    updated_execution_constraints_language_ids.append(language.id)
                else:
                    new_execution_constraints.append(
                        ExecutionConstraint(problem=instance, **constraint_data)
                    )

            # exclude the constraints that are not present in the updated data
            instance.execution_constraints.exclude(
                language__id__in=updated_execution_constraints_language_ids
            ).delete()

            # bulk update the constraints
            if updated_execution_constraints:
                ExecutionConstraint.objects.bulk_update(
                    updated_execution_constraints,
                    ["time_limit", "memory_limit"],
                )

            if new_execution_constraints:
                logger.info("Creating new execution constraints")
                ExecutionConstraint.objects.bulk_create(new_execution_constraints)

        return instance
