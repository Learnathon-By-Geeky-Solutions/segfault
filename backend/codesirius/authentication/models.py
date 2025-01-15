from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.full_name:
            names = self.full_name.split(" ", 1)
            self.first_name = names[0]
            self.last_name = names[1] if len(names) > 1 else ""
        super().save(*args, **kwargs)
