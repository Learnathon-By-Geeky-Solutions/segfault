from django.contrib import admin

from problems.models import Language, Tag, Problem

# Register your models here.

admin.site.register(Language)
admin.site.register(Tag)
admin.site.register(Problem)
