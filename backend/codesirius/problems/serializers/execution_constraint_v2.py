from rest_framework import serializers

from problems.models import Language, ExecutionConstraint
from problems.serializers.language import LanguageSerializer


class ExecutionConstraintSerializerV2(serializers.ModelSerializer):
    languageId = serializers.PrimaryKeyRelatedField(
        queryset=Language.objects.only("id"), source="language"
    )
    timeLimit = serializers.IntegerField(
        min_value=1, max_value=300, source="time_limit"
    )
    memoryLimit = serializers.IntegerField(
        min_value=32, max_value=1024, source="memory_limit"
    )

    class Meta:
        model = ExecutionConstraint
        fields = ["id", "languageId", "timeLimit", "memoryLimit"]
        extra_kwargs = {
            "id": {"read_only": True},
        }
