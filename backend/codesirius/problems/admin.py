from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError

from problems.models import (
    Language,
    Tag,
    Problem,
    ReferenceSolution,
    Submission,
    ExecutionConstraint,
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
