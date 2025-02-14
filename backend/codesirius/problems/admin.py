from django.contrib import admin
from django.core.exceptions import ValidationError
from django import forms

from problems.models import Language, Tag, Problem, ReferenceSolution, Submission

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
admin.site.register(Problem)
