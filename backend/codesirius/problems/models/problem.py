from django.core.exceptions import ValidationError
from django.db import models

from codesirius.models import BaseModel
from problems.models.language import Language
from problems.models.tag import Tag


class Problem(BaseModel):
    """
    Model representing a problem.

    A problem is a task that a user can solve by writing code.

    Attributes:
        title: A CharField representing the title of the problem.
        description: A TextField representing the description of the problem.
        tags: A ManyToManyField representing the tags of the problem.
        languages: A ManyToManyField representing the languages of the problem.
        status: A CharField representing the status of the problem.
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT"
        PUBLISHED = "PUBLISHED"

    title = models.CharField(max_length=200, unique=True)
    description = models.TextField(max_length=5000, blank=True)
    tags = models.ManyToManyField(Tag)
    languages = models.ManyToManyField(Language)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT
    )

    class Meta:
        verbose_name = "Problem"
        verbose_name_plural = "Problems"

    def check_ready_for_publish(self):
        """
        Check if the problem is ready to be published.
        """
        if not self.description:
            raise ValidationError(
                {"description": "Description is required for a published problem"}
            )

        if set(self.execution_constraints.values_list("language_id", flat=True)) != set(
            self.languages.values_list("id", flat=True)
        ):
            raise ValidationError(
                {
                    "execution_constraints": "Execution constraints must be provided "
                    "for all languages"
                }
            )

    def clean(self):
        # make sure description is not empty if status is published
        if self.status == self.Status.PUBLISHED:
            self.check_ready_for_publish()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
