from rest_framework import serializers
from problems.models import (
    ReferenceSolution,
)


class ReferenceSolutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferenceSolution
        fields = [
            "id",
            "problem",
            "code",
            "language",
            "verdict",
            "memory_usage",
            "execution_time",
        ]
