from django.contrib.auth import get_user_model
from django.db import models

from problems.models.base_submission import BaseSubmission


class Submission(BaseSubmission):
    """
    Model representing a submission.

    A submission is a solution that a user can make to solve a problem.

    Attributes:
    """

    class Meta:
        verbose_name = "Submission"
        verbose_name_plural = "Submissions"

    def __str__(self):
        return f"Submission for {self.problem.title} [{self.language}]"
