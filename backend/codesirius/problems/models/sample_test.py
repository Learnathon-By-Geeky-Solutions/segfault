from django.db import models

from codesirius.models import BaseModel
from problems.models import Problem


class SampleTest(BaseModel):
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="sample_tests"
    )
    input = models.TextField(max_length=1000)
    output = models.TextField(max_length=1000)

    class Meta:
        verbose_name = "Sample Test"
        verbose_name_plural = "Sample Tests"

    def __str__(self):
        return f"Sample test for {self.problem.title}"
