from rest_framework import serializers

from problems.models import Language


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["id", "name", "version"]
        read_only_fields = ["id"]
