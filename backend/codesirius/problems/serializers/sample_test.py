import logging
from typing import TypedDict, NotRequired

from django.db import transaction
from rest_framework import serializers

from problems.models.sample_test import SampleTest
from problems.serializers.execution_constraint_v2 import BulkOperationError

logger = logging.getLogger(__name__)


class SampleTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SampleTest
        fields = ["id", "input", "output"]
        extra_kwargs = {"id": {"read_only": True}}


class Error(TypedDict):
    index: NotRequired[int]
    field: str
    message: str


class ValidData(TypedDict):
    id: NotRequired[int]
    input: str
    output: str


class SampleTestListSerializer(serializers.ListSerializer):

    @staticmethod
    def _validate_update(
        attrs, sample_test_id, existing_sample_tests_map
    ) -> tuple[list[ValidData] | None, list[Error] | None]:
        logger.info(f"Validating update for sample test ID: {sample_test_id}")
        errors: list[Error] = []
        if sample_test_id not in existing_sample_tests_map:
            errors.append({"field": "id", "message": "Sample test not found"})
            return None, errors
        _data = {
            "input": attrs.get(
                "input", existing_sample_tests_map[sample_test_id].input
            ),
            "output": attrs.get(
                "output", existing_sample_tests_map[sample_test_id].output
            ),
        }
        serializer = SampleTestSerializer(data=_data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data["id"] = sample_test_id
            return validated_data, None
        for field, message in serializer.errors.items():
            errors.append(
                {
                    "field": field,
                    "message": message[0],
                }
            )
        return None, errors

    @staticmethod
    def _validate_create(attrs) -> tuple[list[ValidData] | None, list[Error] | None]:
        logger.info("Validating create")
        serializer = SampleTestSerializer(data=attrs)
        if serializer.is_valid():
            return serializer.validated_data, None
        errors: list[Error] = []
        for field, message in serializer.errors.items():
            errors.append(
                {
                    "field": field,
                    "message": message[0],
                }
            )
        return None, errors

    def validate(self, attrs):
        logger.info("Validating sample tests")
        validated_data = []
        existing_sample_tests_map = {
            instance.id: instance for instance in self.instance
        }
        errors = []

        for index, data in enumerate(attrs):
            sample_test_id = data.get("id")
            if sample_test_id:
                # update operation
                _data, error = SampleTestListSerializer._validate_update(
                    data, sample_test_id, existing_sample_tests_map
                )
                if error:
                    errors.extend([{"index": index, **err} for err in error])
                else:
                    validated_data.append(_data)
            else:
                # create operation
                _data, error = SampleTestListSerializer._validate_create(data)
                if error:
                    errors.extend([{"index": index, **err} for err in error])
                else:
                    validated_data.append(_data)
        if errors:
            logger.error(f"Bulk operation errors: {errors}")
            raise BulkOperationError(errors)
        return validated_data

    @transaction.atomic
    def update(self, _, validated_data):
        logger.info("Bulk upserting sample tests")
        try:
            sample_tests = [
                SampleTest(**data, problem=self.context["problem"])
                for data in validated_data
            ]
            return SampleTest.objects.bulk_create(
                sample_tests,
                update_conflicts=True,
                unique_fields=["id"],
                update_fields=["input", "output"],
            )
        except Exception as e:
            logger.error(f"Error: {e}")
            raise serializers.ValidationError(str(e))


class SampleTestSerializerBulk(serializers.ModelSerializer):
    id = serializers.IntegerField()
    input = serializers.CharField()
    output = serializers.CharField()

    class Meta:
        model = SampleTest
        fields = ["id", "input", "output"]
        list_serializer_class = SampleTestListSerializer
