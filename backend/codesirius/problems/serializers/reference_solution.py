import logging

from rest_framework import serializers

from problems.models import ReferenceSolution, Language, Problem

logger = logging.getLogger(__name__)


class ReferenceSolutionSerializer(serializers.ModelSerializer):
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
        choices=ReferenceSolution.Verdict.choices,
        default=ReferenceSolution.Verdict.PENDING,
    )

    memory_usage = serializers.FloatField(
        read_only=True,
    )

    execution_time = serializers.FloatField(
        read_only=True,
    )

    class Meta:
        model = ReferenceSolution
        fields = [
            "id",
            "problemId",
            "code",
            "languageId",
            "verdict",
            "memory_usage",
            "execution_time",
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
        # Check if a reference solution already exists for the same problem and language
        if ReferenceSolution.objects.filter(
            problem=problem, language=language
        ).exists():
            raise serializers.ValidationError(
                {
                    "languageId": f"A reference solution for problem {problem.id} and \
                                    language {language.id} already exists."
                }
            )

        return data

    def update(self, instance, validated_data):
        # Set verdict to PENDING when updating
        instance.verdict = ReferenceSolution.Verdict.PENDING

        # Update the other fields from validated_data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
