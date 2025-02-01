"""
Base model for all models in the entire project.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _


class BaseModel(models.Model):
    """
    Base model for all models in the entire project.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created at"),
        help_text=_("The date and time this record was created."),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated at"),
        help_text=_("The date and time this record was last updated."),
    )

    created_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created_by",
        verbose_name=_("Created by"),
        help_text=_("The user who created this record."),
    )

    updated_by = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_updated_by",
        verbose_name=_("Updated by"),
        help_text=_("The user who last updated this record."),
    )

    class Meta:
        abstract = True
        ordering = ["-created_at", "-updated_at"]
        get_latest_by = "created_at"
        verbose_name = _("Base model")
        verbose_name_plural = _("Base models")
        indexes = [
            models.Index(fields=["created_at", "updated_at"]),
            models.Index(fields=["created_by", "updated_by"]),
        ]

    def __str__(self):
        return f"{self._meta.verbose_name} {self.id}"
