import logging

from rest_framework import serializers

from problems.models import Language, Problem, Submission

logger = logging.getLogger(__name__)


class SubmissionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    problemId = serializers.PrimaryKeyRelatedField(
        queryset=Problem.objects.only("id"),
        source="problem",
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
        choices=Submission.Verdict.choices,
        default=Submission.Verdict.PENDING,
    )

    memoryUsage = serializers.FloatField(
        read_only=True,
        source="memory_usage",
    )

    executionTime = serializers.FloatField(
        read_only=True,
        source="execution_time",
    )

    createdAt = serializers.DateTimeField(
        read_only=True,
        source="created_at",
    )

    class Meta:
        model = Submission
        fields = [
            "id",
            "problemId",
            "code",
            "languageId",
            "verdict",
            "memoryUsage",
            "executionTime",
            "createdAt",
        ]
        extra_kwargs = {"id": {"read_only": True}}

    def validate(self, data):
        """
        Check that the language is associated with the problem.
        """
        problem = data.get("problem")
        language = data.get("language")

        if problem and language:
            if language not in problem.languages.all():
                raise serializers.ValidationError(
                    {
                        "languageId": f"Language {language.id} is not supported \
                                        for problem {problem.id}."
                    }
                )
        return data
