import logging

from rest_framework import serializers
from rest_framework.exceptions import APIException
from rest_framework.validators import UniqueValidator

from problems.models import Problem, Tag, Language

logger = logging.getLogger(__name__)


class ProblemSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(
        max_length=200,
        required=True,
        error_messages={
            "required": "The title field is required.",
            "blank": "The title field must not be blank.",
            "null": "The title field must not be null.",
            "max_length": "The title field must not exceed 200 characters.",
        },
        validators=[
            UniqueValidator(
                queryset=Problem.objects.all(),
                message="Problem with this title already exists.",
            )
        ],
    )
    description = serializers.CharField(
        max_length=5000,
        required=False,
        error_messages={
            "max_length": "The description field must not exceed 5000 characters.",
            "null": "Either leave the description field blank \
                or exclude it from the request.",
        },
    )
    tags = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        required=True,
        error_messages={
            "required": "Minimum one tag is required.",
            "null": "Minimum one tag is required.",
        },
    )
    languages = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Language.objects.all(), required=True
    )
    status = serializers.ChoiceField(
        choices=Problem.Status.choices, default=Problem.Status.DRAFT
    )

    def validate_tags(self, tags):
        if not tags:
            raise serializers.ValidationError("Minimum one tag is required.")
        return tags

    def create(self, validated_data):
        logger.info(f"Creating a new problem with data: {validated_data}")
        try:
            problem = Problem.objects.create(**validated_data)
            logger.info("Problem created successfully")
            return problem
        except Exception as e:
            logger.error(f"Error while creating problem - {e}")
            raise APIException("Error while creating problem")

    def update(self, instance, validated_data):
        logger.info(f"Updating problem with ID: {instance.id}, Data: {validated_data}")
        try:
            instance.title = validated_data.get("title", instance.title)
            instance.description = validated_data.get(
                "description", instance.description
            )
            instance.tags.set(validated_data.get("tags", instance.tags.all()))
            instance.languages.set(
                validated_data.get("languages", instance.languages.all())
            )
            instance.status = validated_data.get("status", instance.status)
            instance.save()
            logger.info(f"Problem with ID: {instance.id} updated successfully")
            return instance
        except Exception as e:
            logger.error(f"Error updating problem with ID: {instance.id}: {e}")
            logger.error(e.with_traceback())
            raise APIException("Error while updating problem")
