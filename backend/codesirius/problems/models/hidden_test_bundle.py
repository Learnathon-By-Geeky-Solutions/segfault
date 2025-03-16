from django.db import models

from codesirius.models import BaseModel
from problems.models.problem import Problem


class HiddenTestBundle(BaseModel):
    """
    Model representing a hidden test bundle.

    A hidden test bundle is a bundle of hidden tests that belong to a problem.
    The bundle is stored in an S3 bucket as a zip file.

    Attributes:
        problem (Problem): The problem that the hidden test belongs to.
        s3_path (str): The S3 path to the hidden test bundle.
        test_count (int): The number of hidden tests in the bundle.
    """

    problem = models.OneToOneField(
        Problem,
        on_delete=models.CASCADE,
        related_name="hidden_test_bundle",
    )

    s3_path = models.CharField(max_length=1000)
    test_count = models.PositiveIntegerField()

    class Meta:
        verbose_name = "Hidden Test Bundle"
        verbose_name_plural = "Hidden Test Bundles"

    def __str__(self) -> str:
        return f"Hidden test bundle for {self.problem.title}"
