# Generated by Django 1.11.6 on 2018-01-13 11:54

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("zilencer", "0005_remotepushdevicetoken_fix_uniqueness"),
        ("zerver", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("stripe_customer_id", models.CharField(max_length=255, unique=True)),
                (
                    "realm",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, to="zerver.Realm"
                    ),
                ),
            ],
        ),
    ]