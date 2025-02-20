import logging

from rest_framework import serializers

from problems.models import Language

logger = logging.getLogger(__name__)


class CustomPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    modify the default behaviour of the PrimaryKeyRelatedField
    specifically, the error message when the object does not exist
    """

    def to_internal_value(self, data):
        try:
            return self.get_queryset().get(pk=data)
        except self.queryset.model.DoesNotExist:
            raise serializers.ValidationError(
                f"{self.queryset.model.__name__} with id {data} not found."
            )


class ExecutionConstraintsSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    time_limit = serializers.IntegerField(
        min_value=1,
        max_value=1024,
        required=True,
        error_messages={
            "required": "The time_limit field is required.",
            "blank": "The time_limit field must not be blank.",
            "null": "The time_limit field must not be null.",
            "min_value": "The time_limit field must be at least 1.",
            "max_value": "The time_limit field must not exceed 300.",
        },
    )
    memory_limit = serializers.IntegerField(
        required=True,
        error_messages={
            "required": "The memory_limit field is required.",
            "blank": "The memory_limit field must not be blank.",
            "null": "The memory_limit field must not be null.",
            "min_value": "The memory_limit field must be at least 32.",
            "max_value": "The memory_limit field must not exceed 1024.",
        },
    )
    language = CustomPrimaryKeyRelatedField(
        queryset=Language.objects.all(),
        required=True,
        error_messages={
            "required": "The language field is required.",
            "blank": "The language field must not be blank.",
            "null": "The language field must not be null.",
        },
    )

    def validate(self, data):
        """Ensure the (problem, language) combination is unique"""
        logger.info("Validating execution constraints")
        problem = self.context.get("problem")
        language = data["language"]
        if not problem.languages.filter(id=language.id).exists():
            raise serializers.ValidationError(
                {
                    "language": f"Language {language.id} is not associated with this problem."
                }
            )
        if problem.execution_constraints.filter(language=language).exists():
            raise serializers.ValidationError(
                {
                    "language": f"Execution constraints for language {language.id} already exist."
                }
            )
        data["problem"] = problem
        logger.info(data)
        return data
