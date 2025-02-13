"""
BaseSubmission model
"""

from django.db import models

from codesirius.models import BaseModel
from problems.models import Problem, Language


class BaseSubmission(BaseModel):
    """
    Model representing a base submission.

    A base submission is a submission that a user can make to solve a problem.

    Attributes:
    """

    class Verdict(models.TextChoices):
        PENDING = "PENDING"
        ACCEPTED = "ACCEPTED"
        WRONG_ANSWER = "WRONG_ANSWER"
        TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
        MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
        RUNTIME_ERROR = "RUNTIME_ERROR"
        COMPILATION_ERROR = "COMPILATION_ERROR"

    problem = models.ForeignKey(
        Problem,
        on_delete=models.CASCADE,
    )
    code = models.TextField(max_length=10000)
    language = models.ForeignKey(
        Language,
        on_delete=models.CASCADE,
    )
    verdict = models.CharField(
        max_length=128, choices=Verdict.choices, default=Verdict.PENDING
    )

    class Meta:
        abstract = True
