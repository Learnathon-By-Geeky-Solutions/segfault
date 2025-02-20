# problems/signals.py
from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from problems.models.problem import Problem
from problems.models.execution_constraints import ExecutionConstraints


@receiver(m2m_changed, sender=Problem.languages.through)
def remove_execution_constraints_on_language_removal(
    _sender, instance, action, pk_set, **kwargs
):
    """
    Signal handler that deletes related ExecutionConstraints when a language
    is removed from a Problem.
    """
    if action == "post_remove":
        ExecutionConstraints.objects.filter(
            problem=instance, language_id__in=pk_set
        ).delete()
