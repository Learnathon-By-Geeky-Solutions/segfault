"""
Reference solution model
"""

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
