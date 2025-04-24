import logging

from rest_framework import serializers

from internal_api.models.apikey import APIKey

logger = logging.getLogger(__name__)


class APIKeySerializer(serializers.ModelSerializer):
    expiresAt = serializers.DateTimeField(source="expires_at", required=False)

    class Meta:
        model = APIKey
        fields = ["id", "name", "key", "is_active", "expiresAt"]
        read_only_fields = ["id", "key"]

    def create(self, validated_data) -> APIKey:
        raw, hashed = APIKey.generate_key()
        validated_data["key"] = hashed
        ret = super().create(validated_data)
        logger.info(f"API key created successfully with ID: {ret.id}")
        ret.key = raw
        return ret
