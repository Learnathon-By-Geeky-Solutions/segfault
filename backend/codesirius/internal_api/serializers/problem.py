from rest_framework import serializers

from problems.models import (
    ReferenceSolution,
    Problem,
    SampleTest,
    HiddenTestBundle,
    ExecutionConstraint,
)


class SampleTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SampleTest
        fields = ["id", "input", "output"]


class HiddenTestBundleSerializer(serializers.ModelSerializer):
    class Meta:
        model = HiddenTestBundle
        fields = ["id", "s3_path", "test_count"]


class ExecutionConstraintSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionConstraint
        fields = ["id", "memory_limit", "time_limit", "language_id"]


class ReferenceSolutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferenceSolution
        fields = ["id", "code", "language_id", "verdict"]


class ProblemSerializer(serializers.ModelSerializer):
    sample_tests = SampleTestSerializer(many=True)
    hidden_test_bundle = HiddenTestBundleSerializer()
    execution_constraints = ExecutionConstraintSerializer(many=True)
    reference_solutions = ReferenceSolutionSerializer(
        source="referencesolution_set", many=True
    )

    class Meta:
        model = Problem
        fields = [
            "id",
            "languages",
            "sample_tests",
            "hidden_test_bundle",
            "execution_constraints",
            "reference_solutions",
        ]

        depth = 1
