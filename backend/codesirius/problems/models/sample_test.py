from django.db import models

from problems.models import Problem


class SampleTest(models.Model):
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="sample_tests"
    )
    input = models.TextField(max_length=1000)
    output = models.TextField(max_length=1000)

    def __str__(self):
        return f"Sample test for {self.problem.title}"
