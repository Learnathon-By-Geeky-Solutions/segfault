from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from problems.models import Tag


class TagSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(
        max_length=50,
        required=True,
        error_messages={
            "required": "The name field is required.",
            "blank": "The name field must not be blank.",
            "null": "The name field must not be null.",
            "max_length": "The name field must not exceed 50 characters.",
        },
        validators=[
            UniqueValidator(
                queryset=Tag.objects.all(), message="Tag with this name already exists."
            )
        ],
    )
    description = serializers.CharField(
        max_length=200,
        required=False,
        error_messages={
            "max_length": "The description field must not exceed 200 characters.",
            "null": "Either leave the description field blank \
                or exclude it from the request.",
        },
    )

    def create(self, validated_data):
        return Tag.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.name = validated_data.get("name", instance.name)
        instance.description = validated_data.get("description", instance.description)
        instance.save()
        return instance
