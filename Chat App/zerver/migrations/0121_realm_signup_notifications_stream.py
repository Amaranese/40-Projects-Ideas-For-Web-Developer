# Generated by Django 1.11.5 on 2017-10-19 22:01

import django.db.models.deletion
from django.db import migrations, models
from django.db.backends.postgresql.schema import BaseDatabaseSchemaEditor
from django.db.migrations.state import StateApps


def set_initial_value_for_signup_notifications_stream(
    apps: StateApps, schema_editor: BaseDatabaseSchemaEditor
) -> None:
    realm_model = apps.get_model("zerver", "Realm")
    realms = realm_model.objects.exclude(notifications_stream__isnull=True)
    for realm in realms:
        realm.signup_notifications_stream = realm.notifications_stream
        realm.save(update_fields=["signup_notifications_stream"])


class Migration(migrations.Migration):

    dependencies = [
        ("zerver", "0120_botuserconfigdata"),
    ]

    operations = [
        migrations.AddField(
            model_name="realm",
            name="signup_notifications_stream",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="+",
                to="zerver.Stream",
            ),
        ),
        migrations.RunPython(
            set_initial_value_for_signup_notifications_stream,
            reverse_code=migrations.RunPython.noop,
            elidable=True,
        ),
    ]
