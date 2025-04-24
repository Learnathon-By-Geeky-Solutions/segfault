from rest_framework import serializers
from problems.models import ReferenceSolution, Problem, SampleTest, HiddenTestBundle


class SampleTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SampleTest
        fields = ["id", "input", "output"]


class HiddenTestBundleSerializer(serializers.ModelSerializer):
    class Meta:
        model = HiddenTestBundle
        fields = ["id", "s3_path", "test_count"]


class ProblemSerializer(serializers.ModelSerializer):
    sample_tests = SampleTestSerializer(many=True)
    hidden_test_bundle = HiddenTestBundleSerializer()

    class Meta:
        model = Problem
        fields = ["id", "sample_tests", "hidden_test_bundle"]


class ReferenceSolutionSerializer(serializers.ModelSerializer):
    problem = ProblemSerializer()

    class Meta:
        model = ReferenceSolution
        fields = ["id", "problem", "code", "language", "verdict"]
