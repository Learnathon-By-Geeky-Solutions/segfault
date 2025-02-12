from django.contrib.auth import get_user_model
from django.db import models

from codesirius.models import BaseModel
from problems.models import Problem, Language


class Submission(BaseModel):
    """
    Model representing a submission.

    A submission is a solution that a user can make to solve a problem.

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
        Problem, on_delete=models.CASCADE, related_name="submissions"
    )
    code = models.TextField(max_length=10000)
    language = models.ForeignKey(
        Language, on_delete=models.CASCADE, related_name="submissions"
    )
    user = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, related_name="submissions"
    )
    verdict = models.CharField(
        max_length=128, choices=Verdict.choices, default=Verdict.PENDING
    )

    class Meta:
        verbose_name = "Submission"
        verbose_name_plural = "Submissions"

    def __str__(self):
        return f"Submission for {self.problem.title} [{self.language}]"
