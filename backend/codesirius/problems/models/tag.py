from codesirius.models import BaseModel
from django.db import models


class Tag(BaseModel):
    """
    Model representing a tag.

    A tag is a keyword or term associated with a problem.

    Attributes:
        name (str): The name of the tag.
        description (str): The description of the tag. This is optional.
    """

    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(max_length=200, blank=True)  # Optional

    def __str__(self):
        return self.name
