# Generated by Django 5.1.4 on 2025-01-14 20:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="full_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
