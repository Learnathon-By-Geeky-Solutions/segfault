from rest_framework import serializers

from problems.models import (
    Submission,
)


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = [
            "id",
            "problem_id",
            "code",
            "language_id",
            "verdict",
            "memory_usage",
            "execution_time",
        ]
