"""
Reference solution model
"""

from django.db import models

from codesirius.models import BaseModel
from problems.models import Problem, Language
from problems.models.base_submission import BaseSubmission


class ReferenceSolution(BaseSubmission):
    """
    Model representing a reference solution.
    """

    class Meta:
        verbose_name = "Reference Solution"
        verbose_name_plural = "Reference Solutions"

    def __str__(self):
        return f"Reference solution for {self.problem.title} [{self.language}]"
