# Generated by Django 5.1.5 on 2025-01-31 12:55

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0003_verificationcode"),
    ]

    operations = [
        migrations.DeleteModel(
            name="VerificationCode",
        ),
    ]
