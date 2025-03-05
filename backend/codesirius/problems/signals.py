# problems/signals.py
from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from problems.models.problem import Problem
from problems.models.execution_constraint import ExecutionConstraint


@receiver(m2m_changed, sender=Problem.languages.through)
def remove_execution_constraints_on_language_removal(
    sender, instance, action, pk_set, **kwargs
):
    """
    Signal handler that deletes related ExecutionConstraint when a language
    is removed from a Problem.
    """
    if action == "post_remove":
        ExecutionConstraint.objects.filter(
            problem=instance, language_id__in=pk_set
        ).delete()
