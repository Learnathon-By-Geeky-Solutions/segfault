from codesirius.models import BaseModel
from django.db import models


class Language(BaseModel):
    """
    Model representing a programming language.

    A language is a programming language that can be used to solve a problem.

    Attributes:
        name (str): The name of the language.
        version (str): The version of the language.
    """

    name = models.CharField(max_length=50, unique=True)
    version = models.CharField(max_length=50, blank=True)  # Optional

    def __str__(self):
        return self.name + " " + self.version
