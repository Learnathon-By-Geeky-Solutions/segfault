from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from authentication.models import VerificationCode

User = get_user_model()


class UserAdmin(BaseUserAdmin):
    """Customize UserAdmin"""

    ordering = ["id"]
    list_display = [
        "first_name",
        "email",
        "username",
        "is_active",
        "is_staff",
        "is_superuser",
    ]

    fieldsets = (
        (None, {"fields": ("id", "username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
        ("Important dates", {"fields": ("created_at", "updated_at", "last_login")}),
        ("User Info", {"fields": ("created_by", "updated_by")}),
    )

    # set created_by and updated_by to current user
    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        obj.updated_by = request.user
        obj.save()

    readonly_fields = (
        "id",
        # "password",
        "created_at",
        "updated_at",
        "last_login",
        "created_by",
        "updated_by",
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "username",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    # change title of the administration site
    admin.site.site_header = "Codesirius Administration"


admin.site.register(User, UserAdmin)
# admin.site.register(User)
# admin.site.register(VerificationCode)


class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ["user", "code", "created_at", "updated_at"]
    fieldsets = [
        ("Primary Info", {"fields": ["user", "code"]}),
        ("Important Dates", {"fields": ["created_at", "updated_at"]}),
        (
            "Other Info",
            {
                "fields": [
                    "is_used",
                    "used_at",
                    "expires_at",
                    "created_by",
                    "updated_by",
                ]
            },
        ),
    ]
    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
        "expires_at",
        "is_used",
        "used_at",
    )


admin.site.register(VerificationCode, VerificationCodeAdmin)
admin.site.site_title = "Codesirius Admin Portal"
