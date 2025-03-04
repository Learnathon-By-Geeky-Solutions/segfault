import logging

from rest_framework import serializers

from problems.models import Problem, Language, Tag
from problems.serializers.execution_constraint_v2 import ExecutionConstraintSerializer
from problems.serializers.language import LanguageSerializer
from problems.serializers.sample_test import SampleTestSerializer
from problems.serializers.tag import TagSerializer

logger = logging.getLogger(__name__)


class ProblemSerializer(serializers.ModelSerializer):
    createdBy = serializers.PrimaryKeyRelatedField(read_only=True, source="created_by")

    languageIds = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Language.objects.only("id"),
        write_only=True,
        source="new_languages",
    )

    tagIds = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.only("id"), write_only=True, source="new_tags"
    )

    languages = LanguageSerializer(many=True, read_only=True)

    tags = TagSerializer(many=True, read_only=True)

    executionConstraints = ExecutionConstraintSerializer(
        many=True, source="execution_constraints", read_only=True
    )

    sampleTests = SampleTestSerializer(
        many=True, source="sample_tests", required=False, read_only=True
    )

    class Meta:
        model = Problem
        fields = [
            "id",  # READ
            "title",  # READ, WRITE
            "languageIds",  # WRITE
            "languages",  # READ
            "tagIds",  # WRITE
            "tags",  # READ
            "description",  # READ, WRITE
            "executionConstraints",  # READ
            "sampleTests",  # READ
            "createdBy",  # READ
            "status",  # READ
        ]
        extra_kwargs = {
            "status": {"default": Problem.Status.DRAFT, "read_only": True},
            "id": {"read_only": True},
        }

    @staticmethod
    def _extract_related_data(validated_data):
        """
        Extract the related data from the validated data.
        """
        new_languages = validated_data.pop("new_languages", [])
        new_tags = validated_data.pop("new_tags", [])
        # remove the languageIds and tagIds from the validated data
        validated_data.pop("languageIds", None)
        validated_data.pop("tagIds", None)

        return new_languages, new_tags

    def create(self, validated_data):
        request_user = self.context["request"].user

        # extract the related data
        new_languages, new_tags = ProblemSerializer._extract_related_data(
            validated_data
        )

        # create the problem instance without the languages, tags, constraints
        # and sample tests
        problem = Problem.objects.create(created_by=request_user, **validated_data)
        # now set the languages and tags
        problem.languages.set(new_languages)
        problem.tags.set(new_tags)

        return problem

    def update(self, instance, validated_data):
        logger.info("Updating problem")
        # extract the related data
        new_languages, new_tags = ProblemSerializer._extract_related_data(
            validated_data
        )
        if new_languages:
            instance.languages.set(new_languages)
            # remove the constraints for the languages that are not present
            # in the new_languages
            instance.execution_constraints.exclude(
                language__id__in=[language.id for language in new_languages]
            ).delete()

        if new_tags:
            instance.tags.set(new_tags)

        # Update other fields, only if present in validated_data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
