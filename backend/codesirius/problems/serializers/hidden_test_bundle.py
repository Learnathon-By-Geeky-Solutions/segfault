from rest_framework import serializers

from problems.models import HiddenTestBundle, Problem


class HiddenTestBundleSerializer(serializers.ModelSerializer):
    """
    Serializer for the HiddenTestBundle model.
    """

    problem_id = serializers.PrimaryKeyRelatedField(
        queryset=Problem.objects.all(),
        source="problem",
        write_only=True,
    )

    class Meta:
        model = HiddenTestBundle
        fields = ["id", "problem_id", "test_count"]
        read_only_fields = ["id"]
