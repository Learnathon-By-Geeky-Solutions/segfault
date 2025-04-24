from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from problems.models import (
    Language,
    Tag,
    Problem,
    ReferenceSolution,
    Submission,
    ExecutionConstraint,
    HiddenTestBundle,
)

# Register your models here.


class LanguageAdmin(admin.ModelAdmin):
    exclude = ("created_by", "updated_by")

    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        obj.updated_by = request.user

        super().save_model(request, obj, form, change)


admin.site.register(Language, LanguageAdmin)
admin.site.register(Tag)


class ProblemForm(forms.ModelForm):
    class Meta:
        model = Problem
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        status = cleaned_data.get("status")
        description = cleaned_data.get("description")

        if status == Problem.Status.PUBLISHED and not description:
            raise ValidationError(
                {"description": "Description is required for a published problem"}
            )

        return cleaned_data


class ProblemAdmin(admin.ModelAdmin):
    form = ProblemForm  # Link the custom form to the admin
    readonly_fields = ("created_by", "updated_by")  # Make these fields read-only
    list_display = (
        "title",
        "status",
        "description",
    )  # Add any fields you want to display
    search_fields = ("title", "description")  # Enable search on these fields


admin.site.register(Problem, ProblemAdmin)

admin.site.register(ReferenceSolution)
admin.site.register(Submission)
admin.site.register(ExecutionConstraint)

from django.contrib import admin
from django.utils import timezone
from .models import SampleTest


class SampleTestAdmin(admin.ModelAdmin):
    list_display = ("problem", "truncated_input", "truncated_output", "created_at")
    list_filter = ("problem", "created_at")
    search_fields = ("problem__title", "input", "output")
    readonly_fields = ("created_at", "created_by", "updated_at", "updated_by")

    fieldsets = (
        (
            "Sample Test Information",
            {
                "fields": ("problem", "input", "output"),
                "classes": ("wide", "extrapretty"),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("created_by", "created_at", "updated_by", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def truncated_input(self, obj):
        return obj.input[:50] + "..." if len(obj.input) > 50 else obj.input

    truncated_input.short_description = "Input"

    def truncated_output(self, obj):
        return obj.output[:50] + "..." if len(obj.output) > 50 else obj.output

    truncated_output.short_description = "Output"

    def save_model(self, request, obj, form, change):
        if not change:  # If creating a new object
            obj.created_by = request.user
            obj.created_at = timezone.now()
        else:  # If updating an existing object
            obj.updated_by = request.user
            obj.updated_at = timezone.now()
        super().save_model(request, obj, form, change)


admin.site.register(SampleTest, SampleTestAdmin)


class HiddenTestBundleAdmin(admin.ModelAdmin):
    list_display = ("problem", "test_count", "created_at", "updated_at")
    search_fields = ("problem__title",)
    readonly_fields = ("created_by", "created_at", "updated_by", "updated_at")

    fieldsets = (
        (_("Basic Info"), {"fields": ("problem", "s3_path", "test_count")}),
        (
            _("Metadata"),
            {
                "fields": ("created_by", "created_at", "updated_by", "updated_at"),
                "classes": ("collapse",),
                "description": _("Automatically tracked metadata for this record."),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Creating a new object
            obj.created_by = request.user
        else:  # Updating an existing object
            obj.updated_by = request.user

        super().save_model(request, obj, form, change)


# Register the model with the admin site
admin.site.register(HiddenTestBundle, HiddenTestBundleAdmin)
