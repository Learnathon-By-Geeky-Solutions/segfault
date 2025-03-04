from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from codesirius.models import BaseModel
from problems.models.language import Language
from problems.models.problem import Problem


class ExecutionConstraint(BaseModel):
    """
    Model representing the execution constraints of a problem.

    Execution constraints are the constraints that are applied to the execution of a
    problem.

    We ensure that the execution constraints are unique for a problem and a language.
    Language is consisted of name and version. (Just in case you need to know)

    Attributes:
        problem (Problem): The problem to which the execution constraints belong.
                          One problem can have multiple execution constraints based
                          on the language.
        time_limit (int): The time limit for the execution of the problem.
                         This is measured in seconds.
        memory_limit (int): The memory limit for the execution of the problem.
                            This is measured in megabytes.
        language (Language): The language for which the execution constraints are
                            applied.
    """

    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="execution_constraints"
    )
    time_limit = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(300)], null=True
    )
    memory_limit = models.IntegerField(
        validators=[MinValueValidator(32), MaxValueValidator(1024)],
        null=True,
    )
    language = models.ForeignKey(
        Language, on_delete=models.CASCADE, related_name="execution_constraints"
    )

    class Meta:
        verbose_name = "Execution Constraints"
        verbose_name_plural = "Execution Constraints"
        constraints = [
            models.UniqueConstraint(
                fields=["problem", "language"], name="unique_problem_language"
            )
        ]

    def clean(self):
        super().clean()
        # check if it is a update operation
        if self.pk:
            # get the existing object from the database
            existing = ExecutionConstraint.objects.get(pk=self.pk)
            if self.language not in existing.problem.languages.all():
                raise ValidationError(
                    {"language": "Language is not supported by the problem."}
                )
        elif self.language not in self.problem.languages.all():
            # this is a create operation
            raise ValidationError(
                {"language": "Language is not supported by the problem."}
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"""
            {self.language.name} {self.language.version}
            - {self.time_limit} sec. {self.memory_limit} MB
            [Problem: {self.problem.title}]
            """
