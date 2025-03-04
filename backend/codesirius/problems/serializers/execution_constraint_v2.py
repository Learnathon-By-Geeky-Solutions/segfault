import logging
from typing import TypedDict, NotRequired

from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import APIException

from problems.models import ExecutionConstraint

logger = logging.getLogger(__name__)


class BulkOperationError(APIException):
    status_code = 400
    default_detail = "Bulk operation failed"
    default_code = "bulk_operation_failed"

    def __init__(self, errors):
        self.errors = errors
        super().__init__(self.default_detail)


class ExecutionConstraintSerializer(serializers.ModelSerializer):
    languageId = serializers.IntegerField(source="language_id")
    timeLimit = serializers.IntegerField(
        min_value=1,
        max_value=300,
        source="time_limit",
        help_text="Time limit in seconds",
    )
    memoryLimit = serializers.IntegerField(
        min_value=32, max_value=1024, source="memory_limit"
    )

    class Meta:
        model = ExecutionConstraint
        fields = ["id", "languageId", "timeLimit", "memoryLimit"]
        extra_kwargs = {"id": {"read_only": True}}


class Error(TypedDict):
    index: NotRequired[int]
    field: str
    message: str


class ValidData(TypedDict):
    id: NotRequired[int]
    languageId: int
    timeLimit: int
    memoryLimit: int


class ExecutionConstraintListSerializer(serializers.ListSerializer):

    @staticmethod
    def snake_to_camel(snake_str):
        components = snake_str.split("_")
        return components[0] + "".join(x.title() for x in components[1:])

    @staticmethod
    def _validate_update(
        attrs, constraint_id, existing_constraints_map
    ) -> tuple[list[ValidData] | None, list[Error] | None]:
        logger.info(f"Validating update for constraint ID: {constraint_id}")
        errors: list[Error] = []
        if constraint_id not in existing_constraints_map:
            errors.append({"field": "id", "message": "Constraint not found"})
            return None, errors
        _data = {
            "languageId": existing_constraints_map[constraint_id].language_id,
            "timeLimit": attrs.get(
                "time_limit", existing_constraints_map[constraint_id].time_limit
            ),
            "memoryLimit": attrs.get(
                "memory_limit", existing_constraints_map[constraint_id].memory_limit
            ),
        }
        serializer = ExecutionConstraintSerializer(data=_data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data["id"] = constraint_id
            return validated_data, None
        for field, message in serializer.errors.items():
            errors.append(
                {
                    "field": ExecutionConstraintListSerializer.snake_to_camel(field),
                    "message": message[0],
                }
            )
        return None, errors

    @staticmethod
    def _validate_create(
        attrs, allowed_languages, existing_languages
    ) -> tuple[list[ValidData] | None, list[Error] | None]:
        logger.info("Validating create operation")
        language_id = attrs.get("language_id")
        if not language_id:
            return None, [{"field": "languageId", "message": "Language ID is required"}]
        if language_id not in allowed_languages:
            return None, [{"field": "languageId", "message": "Language not found"}]
        if language_id in existing_languages:
            return None, [{"field": "languageId", "message": "Language already exists"}]
        _data = {
            "languageId": attrs.get("language_id"),
            "timeLimit": attrs.get("time_limit"),
            "memoryLimit": attrs.get("memory_limit"),
        }
        serializer = ExecutionConstraintSerializer(data=_data)
        if serializer.is_valid():
            return serializer.validated_data, None
        errors: list[Error] = []
        for field, message in serializer.errors.items():
            errors.append(
                {
                    "field": ExecutionConstraintListSerializer.snake_to_camel(field),
                    "message": message[0],
                }
            )
        return None, errors

    def validate(self, attrs) -> list[ValidData]:
        logger.info("Validating execution constraints")
        validated_data = []
        existing_constraints_map = {instance.id: instance for instance in self.instance}
        allowed_languages = [
            lang.id for lang in self.context["problem"].languages.only("id")
        ]
        existing_languages = [
            constraint.language_id
            for constraint in self.context["problem"].execution_constraints.only(
                "language_id"
            )
        ]
        errors = list()
        seen_id = set()
        for index, data in enumerate(attrs):
            constraint_id = data.get("id")
            if constraint_id:
                if constraint_id in seen_id:
                    # errors[index].append({"id": "Duplicate ID"})
                    errors.append(
                        {"index": index, "field": "id", "message": "Duplicate ID"}
                    )
                    continue
                seen_id.add(constraint_id)
                # update operation
                _data, error = ExecutionConstraintListSerializer._validate_update(
                    data, constraint_id, existing_constraints_map
                )
                if error:
                    # errors[index].append(error)
                    errors.extend([{"index": index, **err} for err in error])
                else:
                    validated_data.append(_data)
            else:
                # create operation
                _data, error = ExecutionConstraintListSerializer._validate_create(
                    data, allowed_languages, existing_languages
                )
                if error:
                    # errors[index].append(error)
                    errors.extend([{"index": index, **err} for err in error])
                else:
                    validated_data.append(_data)

        if errors:
            logger.error(f"Bulk operation errors: {errors}")
            raise BulkOperationError(errors)
        return validated_data

    @transaction.atomic
    def update(self, _, validated_data):
        try:
            logger.info("Bulk upserting execution constraints")
            constraints = [
                ExecutionConstraint(**data, problem=self.context["problem"])
                for data in validated_data
            ]
            return self.child.Meta.model.objects.bulk_create(
                constraints,
                update_conflicts=True,
                unique_fields=["problem", "language"],
                update_fields=["time_limit", "memory_limit"],
            )
        except Exception as e:
            logger.error(f"Error: {e}")
            raise serializers.ValidationError(
                {"execution_constraints": "Something went wrong."}
            )


class ExecutionConstraintSerializerBulk(serializers.ModelSerializer):
    id = serializers.IntegerField()
    languageId = serializers.IntegerField(source="language_id")
    timeLimit = serializers.IntegerField(source="time_limit")
    memoryLimit = serializers.IntegerField(source="memory_limit")

    class Meta:
        fields = ["id", "languageId", "timeLimit", "memoryLimit"]
        list_serializer_class = ExecutionConstraintListSerializer
        model = ExecutionConstraint
