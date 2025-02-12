"""
Reference solution model
"""

from django.db import models

from codesirius.models import BaseModel
from problems.models import Problem, Language


class ReferenceSolution(BaseModel):
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="reference_solutions"
    )
    code = models.TextField(max_length=10000)
    language = models.ForeignKey(
        Language, on_delete=models.CASCADE, related_name="reference_solutions"
    )

    class Meta:
        verbose_name = "Reference solution"
        verbose_name_plural = "Reference solutions"
