import logging
from typing import Dict

from rest_framework import serializers

from problems.models import ReferenceSolution, Language

logger = logging.getLogger(__name__)


class ReferenceSolutionSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    problem = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )
    code = serializers.CharField(
        max_length=10000,
        required=True,
        error_messages={
            "required": "The code field is required.",
            "blank": "The code field must not be blank.",
            "null": "The code field must not be null.",
            "max_length": "The code field must not exceed 10000 characters.",
        },
    )
    languageId = serializers.PrimaryKeyRelatedField(
        queryset=Language.objects.only("id"),
        required=True,
        error_messages={
            "required": "The languageId field is required.",
            "null": "The languageId field must not be null.",
        },
        source="language",
    )
    verdict = serializers.ChoiceField(
        read_only=True,
        choices=ReferenceSolution.Verdict.choices,
        default=ReferenceSolution.Verdict.PENDING,
    )

    def create(self, validated_data: Dict) -> ReferenceSolution:
        try:
            logger.info(
                f"Creating a new reference solution with data: {validated_data}"
            )
            return ReferenceSolution.objects.create(
                **validated_data, problem=self.context["problem"]
            )
        except Exception as e:
            logger.error(f"Failed to create a new reference solution: {e}")
            raise serializers.ValidationError(
                "Failed to create a new reference solution"
            )

    def update(
        self, instance: ReferenceSolution, validated_data: Dict
    ) -> ReferenceSolution:
        instance.problem = validated_data.get("problem", instance.problem)
        instance.code = validated_data.get("code", instance.code)
        instance.language = validated_data.get("language", instance.language)
        instance.verdict = validated_data.get("verdict", instance.verdict)
        instance.save()
        return instance
