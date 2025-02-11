import logging

from rest_framework import serializers
from rest_framework.exceptions import APIException
from rest_framework.validators import UniqueValidator

from problems.models import Tag

logger = logging.getLogger(__name__)


class TagSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(
        max_length=50,
        required=True,
        error_messages={
            "required": "The name field is required.",
            "blank": "The name field must not be blank.",
            "null": "The name field must not be null.",
            "max_length": "The name field must not exceed 50 characters.",
        },
        validators=[
            UniqueValidator(
                queryset=Tag.objects.all(), message="Tag with this name already exists."
            )
        ],
    )
    description = serializers.CharField(
        max_length=200,
        required=False,
        error_messages={
            "max_length": "The description field must not exceed 200 characters.",
            "null": "Either leave the description field blank \
                or exclude it from the request.",
        },
    )

    def create(self, validated_data):
        logger.info(f"Creating a new tag with data: {validated_data}")
        try:
            tag = Tag.objects.create(**validated_data)
            logger.info("Tag created successfully")
            return tag
        except Exception as e:
            logger.error(f"Error while creating tag - {e}")
            raise APIException("Error while creating tag")

    def update(self, instance, validated_data):
        logger.info(f"Updating tag with ID: {instance.id}, Data: {validated_data}")
        try:
            instance.name = validated_data.get("name", instance.name)
            instance.description = validated_data.get(
                "description", instance.description
            )
            instance.save()
            logger.info(f"Tag with ID: {instance.id} updated successfully")
            return instance
        except Exception as e:
            logger.error(f"Error updating tag with ID: {instance.id}: {e}")
            raise APIException("Error while updating tag")
