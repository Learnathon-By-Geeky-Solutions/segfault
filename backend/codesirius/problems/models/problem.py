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
    """

    title = models.CharField(max_length=200)
    description = models.TextField(max_length=5000, blank=True)
    tags = models.ManyToManyField(Tag, related_name="problems")
    languages = models.ManyToManyField(Language, related_name="problems")

    def __str__(self):
        return self.title
