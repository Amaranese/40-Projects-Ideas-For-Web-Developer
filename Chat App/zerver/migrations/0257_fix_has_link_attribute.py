# Generated by Django 1.11.24 on 2019-10-07 05:25

import time
from typing import cast

import lxml
from django.db import migrations
from django.db.backends.postgresql.schema import BaseDatabaseSchemaEditor
from django.db.migrations.state import StateApps

BATCH_SIZE = 1000


def process_batch(apps: StateApps, id_start: int, id_end: int, last_id: int) -> None:
    Message = apps.get_model("zerver", "Message")
    for message in Message.objects.filter(id__gte=id_start, id__lte=id_end).order_by("id"):
        if message.rendered_content in ["", None]:
            # There have been bugs in the past that made it possible
            # for a message to have "" or None as its rendered_content; we
            # need to skip those because lxml won't process them.
            #
            # They should safely already have the correct state
            #   has_link=has_image=has_attachment=False.
            continue

        if message.id % 1000 == 0:
            print(f"Processed {message.id} / {last_id}")

        # Because we maintain the Attachment table, this should be as
        # simple as just checking if there's any Attachment
        # objects associated with this message.
        has_attachment = message.attachment_set.exists()

        # For has_link and has_image, we need to parse the messages.
        # Links are simple -- look for a link in the message.
        lxml_obj = lxml.html.fromstring(message.rendered_content)
        has_link = any(True for link in lxml_obj.iter("a"))

        # has_image refers to inline image previews, so we just check
        # for the relevant CSS class.
        has_image = any(
            True for img in cast(lxml.html.HtmlMixin, lxml_obj).find_class("message_inline_image")
        )

        if (
            message.has_link == has_link
            and message.has_attachment == has_attachment
            and message.has_image == has_image
        ):
            # No need to spend time with the database if there aren't changes.
            continue
        message.has_image = has_image
        message.has_link = has_link
        message.has_attachment = has_attachment
        message.save(update_fields=["has_link", "has_attachment", "has_image"])


def fix_has_link(apps: StateApps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    Message = apps.get_model("zerver", "Message")
    if not Message.objects.exists():
        # Nothing to do, and Message.objects.latest() will crash.
        return

    # This migration logic assumes that either the server is not
    # running, or that it's being run after the logic to correct how
    # `has_link` and friends are set for new messages have been
    # deployed.
    last_id = Message.objects.latest("id").id

    id_range_lower_bound = 0
    id_range_upper_bound = 0 + BATCH_SIZE
    while id_range_upper_bound <= last_id:
        process_batch(apps, id_range_lower_bound, id_range_upper_bound, last_id)

        id_range_lower_bound = id_range_upper_bound + 1
        id_range_upper_bound = id_range_lower_bound + BATCH_SIZE
        time.sleep(0.1)

    if last_id > id_range_lower_bound:
        # Copy for the last batch.
        process_batch(apps, id_range_lower_bound, last_id, last_id)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("zerver", "0256_userprofile_stream_set_recipient_column_values"),
    ]

    operations = [
        migrations.RunPython(fix_has_link, reverse_code=migrations.RunPython.noop, elidable=True),
    ]
