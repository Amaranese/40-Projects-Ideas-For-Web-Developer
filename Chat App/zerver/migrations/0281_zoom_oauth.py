# Generated by Django 1.11.25 on 2019-11-06 22:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("zerver", "0280_userprofile_presence_enabled"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="zoom_token",
            field=models.JSONField(default=None, null=True),
        ),
    ]
