from rest_framework import serializers

from problems.models import Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "description"]
        read_only_fields = ["id"]
