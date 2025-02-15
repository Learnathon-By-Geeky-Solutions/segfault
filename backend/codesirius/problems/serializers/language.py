import logging

from rest_framework import serializers
from rest_framework.exceptions import APIException
from rest_framework.validators import UniqueValidator

from problems.models import Language

logger = logging.getLogger(__name__)


class LanguageSerializer(serializers.Serializer):
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
                queryset=Language.objects.all(),
                message="Language with this name already exists.",
            )
        ],
    )
    version = serializers.CharField(
        max_length=50,
        required=False,
        error_messages={
            "required": "The version field is required.",
            "blank": "The version field must not be blank.",
            "null": "Either leave the version field blank \
                    or exclude it from the request.",
            "max_length": "The version field must not exceed 50 characters.",
        },
    )

    def create(self, validated_data):
        logger.info(f"Creating a new language with data: {validated_data}")
        try:
            language = Language.objects.create(**validated_data)
            logger.info("Language created successfully")
            return language
        except IntegrityError:
            logger.error("Language with the same name and version already exists")
            raise serializers.ValidationError(
                {
                    "name": "Language with this name and the version already exists",
                    "version": "Language with the name and this version already exists",
                }
            )
        except Exception as e:
            logger.error(f"Error while creating language - {e}")
            raise APIException("Error while creating language")

    def update(self, instance, validated_data):
        logger.info(f"Updating language with ID: {instance.id}, Data: {validated_data}")
        try:
            instance.name = validated_data.get("name", instance.name)
            instance.version = validated_data.get("version", instance.version)
            instance.save()
            logger.info(f"Language with ID: {instance.id} updated successfully")
            return instance
        except Exception as e:
            logger.error(f"Error updating language with ID: {instance.id}: {e}")
