import datetime
import os
import shutil
from typing import Any, Callable, Dict, FrozenSet, List, Optional, Set, Tuple
from unittest.mock import patch

import orjson
from django.conf import settings
from django.db.models import Q
from django.utils.timezone import now as timezone_now

from analytics.models import UserCount
from zerver.actions.alert_words import do_add_alert_words
from zerver.actions.create_user import do_create_user
from zerver.actions.custom_profile_fields import (
    do_update_user_custom_profile_data_if_changed,
    try_add_realm_custom_profile_field,
)
from zerver.actions.muted_users import do_mute_user
from zerver.actions.presence import do_update_user_presence, do_update_user_status
from zerver.actions.reactions import check_add_reaction, do_add_reaction
from zerver.actions.realm_emoji import check_add_realm_emoji
from zerver.actions.realm_icon import do_change_icon_source
from zerver.actions.realm_logo import do_change_logo_source
from zerver.actions.realm_settings import do_change_realm_plan_type
from zerver.actions.user_activity import do_update_user_activity, do_update_user_activity_interval
from zerver.actions.user_topics import do_mute_topic
from zerver.actions.users import do_deactivate_user
from zerver.lib import upload
from zerver.lib.avatar_hash import user_avatar_path
from zerver.lib.bot_config import set_bot_config
from zerver.lib.bot_lib import StateHandler
from zerver.lib.export import Record, do_export_realm, do_export_user, export_usermessages_batch
from zerver.lib.import_realm import do_import_realm, get_incoming_message_ids
from zerver.lib.streams import create_stream_if_needed
from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.test_helpers import (
    create_s3_buckets,
    get_test_image_file,
    most_recent_message,
    most_recent_usermessage,
    read_test_image_file,
    use_s3_backend,
)
from zerver.lib.upload import claim_attachment, upload_avatar_image, upload_message_file
from zerver.lib.user_topics import add_topic_mute
from zerver.models import (
    AlertWord,
    Attachment,
    BotConfigData,
    BotStorageData,
    CustomProfileField,
    CustomProfileFieldValue,
    Huddle,
    Message,
    MutedUser,
    Reaction,
    Realm,
    RealmAuditLog,
    RealmEmoji,
    RealmUserDefault,
    Recipient,
    Stream,
    Subscription,
    UserGroup,
    UserGroupMembership,
    UserHotspot,
    UserMessage,
    UserPresence,
    UserProfile,
    UserStatus,
    UserTopic,
    get_active_streams,
    get_client,
    get_huddle_hash,
    get_stream,
)


def make_datetime(val: float) -> datetime.datetime:
    return datetime.datetime.fromtimestamp(val, tz=datetime.timezone.utc)


def get_output_dir() -> str:
    return os.path.join(settings.TEST_WORKER_DIR, "test-export")


def make_export_output_dir() -> str:
    output_dir = get_output_dir()
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)
    return output_dir


def read_json(fn: str) -> Any:
    output_dir = get_output_dir()
    full_fn = os.path.join(output_dir, fn)
    with open(full_fn, "rb") as f:
        return orjson.loads(f.read())


def export_fn(fn: str) -> str:
    output_dir = get_output_dir()
    return os.path.join(output_dir, fn)


def get_user_id(r: Realm, full_name: str) -> int:
    return UserProfile.objects.get(realm=r, full_name=full_name).id


def get_huddle_hashes(r: Realm) -> str:
    cordelia_full_name = "Cordelia, Lear's daughter"
    hamlet_full_name = "King Hamlet"
    othello_full_name = "Othello, the Moor of Venice"

    user_id_list = [
        get_user_id(r, cordelia_full_name),
        get_user_id(r, hamlet_full_name),
        get_user_id(r, othello_full_name),
    ]

    huddle_hash = get_huddle_hash(user_id_list)
    return huddle_hash


class ExportFile(ZulipTestCase):
    """This class is a container for shared helper functions
    used for both the realm-level and user-level export tests."""

    def setUp(self) -> None:
        super().setUp()
        self.rm_tree(settings.LOCAL_UPLOADS_DIR)

        # Deleting LOCAL_UPLOADS_DIR results in the test database
        # having RealmEmoji records without associated files.
        #
        # Even if we didn't delete them, the way that the test runner
        # varies settings.LOCAL_UPLOADS_DIR for each test worker
        # process would likely result in this being necessary anyway.
        RealmEmoji.objects.all().delete()

    def upload_files_for_user(
        self, user_profile: UserProfile, *, emoji_name: str = "whatever"
    ) -> None:
        message = most_recent_message(user_profile)
        url = upload_message_file(
            "dummy.txt", len(b"zulip!"), "text/plain", b"zulip!", user_profile
        )
        attachment_path_id = url.replace("/user_uploads/", "")
        claim_attachment(
            user_profile=user_profile,
            path_id=attachment_path_id,
            message=message,
            is_message_realm_public=True,
        )

        with get_test_image_file("img.png") as img_file:
            upload_avatar_image(img_file, user_profile, user_profile)

        user_profile.avatar_source = "U"
        user_profile.save()

        realm = user_profile.realm

        with get_test_image_file("img.png") as img_file:
            check_add_realm_emoji(realm, emoji_name, user_profile, img_file)

    def upload_files_for_realm(self, user_profile: UserProfile) -> None:
        realm = user_profile.realm

        with get_test_image_file("img.png") as img_file:
            upload.upload_backend.upload_realm_icon_image(img_file, user_profile)
            do_change_icon_source(realm, Realm.ICON_UPLOADED, acting_user=None)

        with get_test_image_file("img.png") as img_file:
            upload.upload_backend.upload_realm_logo_image(img_file, user_profile, night=False)
            do_change_logo_source(realm, Realm.LOGO_UPLOADED, False, acting_user=user_profile)
        with get_test_image_file("img.png") as img_file:
            upload.upload_backend.upload_realm_logo_image(img_file, user_profile, night=True)
            do_change_logo_source(realm, Realm.LOGO_UPLOADED, True, acting_user=user_profile)

    def verify_attachment_json(self, user: UserProfile) -> None:
        attachment = Attachment.objects.get(owner=user)
        (record,) = read_json("attachment.json")["zerver_attachment"]
        self.assertEqual(record["path_id"], attachment.path_id)
        self.assertEqual(record["owner"], attachment.owner_id)
        self.assertEqual(record["realm"], attachment.realm_id)

    def verify_uploads(self, user: UserProfile, is_s3: bool) -> None:
        realm = user.realm

        attachment = Attachment.objects.get(owner=user)
        path_id = attachment.path_id

        # Test uploads
        fn = export_fn(f"uploads/{path_id}")
        with open(fn) as f:
            self.assertEqual(f.read(), "zulip!")
        (record,) = read_json("uploads/records.json")
        self.assertEqual(record["path"], path_id)
        self.assertEqual(record["s3_path"], path_id)

        if is_s3:
            realm_str, random_hash, file_name = path_id.split("/")
            self.assertEqual(realm_str, str(realm.id))
            self.assert_length(random_hash, 24)
            self.assertEqual(file_name, "dummy.txt")

            self.assertEqual(record["realm_id"], realm.id)
            self.assertEqual(record["user_profile_id"], user.id)
        else:
            realm_str, slot, random_hash, file_name = path_id.split("/")
            self.assertEqual(realm_str, str(realm.id))
            # We randomly pick a number between 0 and 255 and turn it into
            # hex in order to avoid large directories.
            assert len(slot) <= 2
            self.assert_length(random_hash, 24)
            self.assertEqual(file_name, "dummy.txt")

    def verify_emojis(self, user: UserProfile, is_s3: bool) -> None:
        realm = user.realm

        realm_emoji = RealmEmoji.objects.get(author=user)
        file_name = realm_emoji.file_name
        assert file_name is not None
        assert file_name.endswith(".png")

        emoji_path = f"{realm.id}/emoji/images/{file_name}"
        emoji_dir = export_fn(f"emoji/{realm.id}/emoji/images")
        self.assertEqual(os.listdir(emoji_dir), [file_name])

        (record,) = read_json("emoji/records.json")
        self.assertEqual(record["file_name"], file_name)
        self.assertEqual(record["path"], emoji_path)
        self.assertEqual(record["s3_path"], emoji_path)

        if is_s3:
            self.assertEqual(record["realm_id"], realm.id)
            self.assertEqual(record["user_profile_id"], user.id)

    def verify_realm_logo_and_icon(self) -> None:
        records = read_json("realm_icons/records.json")
        image_files = set()

        for record in records:
            self.assertEqual(record["path"], record["s3_path"])
            image_path = export_fn(f"realm_icons/{record['path']}")
            if image_path.endswith(".original"):
                with open(image_path, "rb") as image_file:
                    image_data = image_file.read()
                self.assertEqual(image_data, read_test_image_file("img.png"))
            else:
                self.assertTrue(os.path.exists(image_path))

            image_files.add(os.path.basename(image_path))

        self.assertEqual(
            set(image_files),
            {
                "night_logo.png",
                "logo.original",
                "logo.png",
                "icon.png",
                "night_logo.original",
                "icon.original",
            },
        )

    def verify_avatars(self, user: UserProfile) -> None:
        records = read_json("avatars/records.json")
        exported_paths = set()

        # Make sure all files in records.json got written.
        for record in records:
            self.assertEqual(record["path"], record["s3_path"])
            path = record["path"]
            fn = export_fn(f"avatars/{path}")
            assert os.path.exists(fn)

            if path.endswith(".original"):
                exported_paths.add(path)

                # For now we know that all our tests use
                # emojis based on img.png.  This may change some
                # day.
                with open(fn, "rb") as fb:
                    fn_data = fb.read()

                self.assertEqual(fn_data, read_test_image_file("img.png"))

        assert exported_paths

        # Right now we expect only our user to have an uploaded avatar.
        db_paths = {user_avatar_path(user) + ".original"}
        self.assertEqual(exported_paths, db_paths)


class RealmImportExportTest(ExportFile):
    def export_realm(
        self,
        realm: Realm,
        exportable_user_ids: Optional[Set[int]] = None,
        consent_message_id: Optional[int] = None,
    ) -> None:
        output_dir = make_export_output_dir()
        with patch("zerver.lib.export.create_soft_link"), self.assertLogs(level="INFO"):
            do_export_realm(
                realm=realm,
                output_dir=output_dir,
                threads=0,
                exportable_user_ids=exportable_user_ids,
                consent_message_id=consent_message_id,
            )
            export_usermessages_batch(
                input_path=os.path.join(output_dir, "messages-000001.json.partial"),
                output_path=os.path.join(output_dir, "messages-000001.json"),
                consent_message_id=consent_message_id,
            )

    def test_export_files_from_local(self) -> None:
        user = self.example_user("hamlet")
        realm = user.realm
        self.upload_files_for_user(user)
        self.upload_files_for_realm(user)
        self.export_realm(realm)

        self.verify_attachment_json(user)
        self.verify_uploads(user, is_s3=False)
        self.verify_avatars(user)
        self.verify_emojis(user, is_s3=False)
        self.verify_realm_logo_and_icon()

    @use_s3_backend
    def test_export_files_from_s3(self) -> None:
        create_s3_buckets(settings.S3_AUTH_UPLOADS_BUCKET, settings.S3_AVATAR_BUCKET)

        user = self.example_user("hamlet")
        realm = user.realm

        self.upload_files_for_user(user)
        self.upload_files_for_realm(user)
        self.export_realm(realm)

        self.verify_attachment_json(user)
        self.verify_uploads(user, is_s3=True)
        self.verify_avatars(user)
        self.verify_emojis(user, is_s3=True)
        self.verify_realm_logo_and_icon()

    def test_zulip_realm(self) -> None:
        realm = Realm.objects.get(string_id="zulip")

        default_bot = self.example_user("default_bot")
        pm_a_msg_id = self.send_personal_message(self.example_user("AARON"), default_bot)
        pm_b_msg_id = self.send_personal_message(default_bot, self.example_user("iago"))
        pm_c_msg_id = self.send_personal_message(
            self.example_user("othello"), self.example_user("hamlet")
        )

        realm_user_default = RealmUserDefault.objects.get(realm=realm)
        realm_user_default.default_language = "de"
        realm_user_default.save()

        self.export_realm(realm)

        data = read_json("realm.json")
        self.assert_length(data["zerver_userprofile_crossrealm"], 3)
        self.assert_length(data["zerver_userprofile_mirrordummy"], 0)

        exported_user_emails = self.get_set(data["zerver_userprofile"], "delivery_email")
        self.assertIn(self.example_email("cordelia"), exported_user_emails)
        self.assertIn("default-bot@zulip.com", exported_user_emails)

        exported_streams = self.get_set(data["zerver_stream"], "name")
        self.assertEqual(
            exported_streams,
            {"Denmark", "Rome", "Scotland", "Venice", "Verona", "core team"},
        )

        exported_alert_words = data["zerver_alertword"]

        # We set up 4 alert words for Hamlet, Cordelia, etc.
        # when we populate the test database.
        num_zulip_users = 10
        self.assert_length(exported_alert_words, num_zulip_users * 4)

        self.assertIn("robotics", {r["word"] for r in exported_alert_words})

        exported_realm_user_default = data["zerver_realmuserdefault"]
        self.assert_length(exported_realm_user_default, 1)
        self.assertEqual(exported_realm_user_default[0]["default_language"], "de")

        data = read_json("messages-000001.json")
        um = UserMessage.objects.all()[0]
        exported_um = self.find_by_id(data["zerver_usermessage"], um.id)
        self.assertEqual(exported_um["message"], um.message_id)
        self.assertEqual(exported_um["user_profile"], um.user_profile_id)

        exported_message = self.find_by_id(data["zerver_message"], um.message_id)
        self.assertEqual(exported_message["content"], um.message.content)

        exported_message_ids = self.get_set(data["zerver_message"], "id")
        self.assertIn(pm_a_msg_id, exported_message_ids)
        self.assertIn(pm_b_msg_id, exported_message_ids)
        self.assertIn(pm_c_msg_id, exported_message_ids)

    def test_export_realm_with_exportable_user_ids(self) -> None:
        realm = Realm.objects.get(string_id="zulip")

        cordelia = self.example_user("iago")
        hamlet = self.example_user("hamlet")
        user_ids = {cordelia.id, hamlet.id}

        pm_a_msg_id = self.send_personal_message(
            self.example_user("AARON"), self.example_user("othello")
        )
        pm_b_msg_id = self.send_personal_message(
            self.example_user("cordelia"), self.example_user("iago")
        )
        pm_c_msg_id = self.send_personal_message(
            self.example_user("hamlet"), self.example_user("othello")
        )
        pm_d_msg_id = self.send_personal_message(
            self.example_user("iago"), self.example_user("hamlet")
        )

        self.export_realm(realm, exportable_user_ids=user_ids)

        data = read_json("realm.json")

        exported_user_emails = self.get_set(data["zerver_userprofile"], "delivery_email")
        self.assertIn(self.example_email("iago"), exported_user_emails)
        self.assertIn(self.example_email("hamlet"), exported_user_emails)
        self.assertNotIn("default-bot@zulip.com", exported_user_emails)
        self.assertNotIn(self.example_email("cordelia"), exported_user_emails)

        dummy_user_emails = self.get_set(data["zerver_userprofile_mirrordummy"], "delivery_email")
        self.assertIn(self.example_email("cordelia"), dummy_user_emails)
        self.assertIn(self.example_email("othello"), dummy_user_emails)
        self.assertIn("default-bot@zulip.com", dummy_user_emails)
        self.assertNotIn(self.example_email("iago"), dummy_user_emails)
        self.assertNotIn(self.example_email("hamlet"), dummy_user_emails)

        data = read_json("messages-000001.json")

        exported_message_ids = self.get_set(data["zerver_message"], "id")
        self.assertNotIn(pm_a_msg_id, exported_message_ids)
        self.assertIn(pm_b_msg_id, exported_message_ids)
        self.assertIn(pm_c_msg_id, exported_message_ids)
        self.assertIn(pm_d_msg_id, exported_message_ids)

    def test_export_realm_with_member_consent(self) -> None:
        realm = Realm.objects.get(string_id="zulip")

        # Create private streams and subscribe users for testing export
        create_stream_if_needed(realm, "Private A", invite_only=True)
        self.subscribe(self.example_user("iago"), "Private A")
        self.subscribe(self.example_user("othello"), "Private A")
        self.send_stream_message(self.example_user("iago"), "Private A", "Hello stream A")

        create_stream_if_needed(realm, "Private B", invite_only=True)
        self.subscribe(self.example_user("prospero"), "Private B")
        stream_b_message_id = self.send_stream_message(
            self.example_user("prospero"), "Private B", "Hello stream B"
        )
        self.subscribe(self.example_user("hamlet"), "Private B")

        create_stream_if_needed(realm, "Private C", invite_only=True)
        self.subscribe(self.example_user("othello"), "Private C")
        self.subscribe(self.example_user("prospero"), "Private C")
        stream_c_message_id = self.send_stream_message(
            self.example_user("othello"), "Private C", "Hello stream C"
        )

        # Create huddles
        self.send_huddle_message(
            self.example_user("iago"), [self.example_user("cordelia"), self.example_user("AARON")]
        )
        huddle_a = Huddle.objects.last()
        self.send_huddle_message(
            self.example_user("ZOE"),
            [self.example_user("hamlet"), self.example_user("AARON"), self.example_user("othello")],
        )
        huddle_b = Huddle.objects.last()

        huddle_c_message_id = self.send_huddle_message(
            self.example_user("AARON"),
            [self.example_user("cordelia"), self.example_user("ZOE"), self.example_user("othello")],
        )

        # Create PMs
        pm_a_msg_id = self.send_personal_message(
            self.example_user("AARON"), self.example_user("othello")
        )
        pm_b_msg_id = self.send_personal_message(
            self.example_user("cordelia"), self.example_user("iago")
        )
        pm_c_msg_id = self.send_personal_message(
            self.example_user("hamlet"), self.example_user("othello")
        )
        pm_d_msg_id = self.send_personal_message(
            self.example_user("iago"), self.example_user("hamlet")
        )

        # Send message advertising export and make users react
        self.send_stream_message(
            self.example_user("othello"),
            "Verona",
            topic_name="Export",
            content="Thumbs up for export",
        )
        message = Message.objects.last()
        assert message is not None
        consented_user_ids = [self.example_user(user).id for user in ["iago", "hamlet"]]
        do_add_reaction(
            self.example_user("iago"), message, "outbox", "1f4e4", Reaction.UNICODE_EMOJI
        )
        do_add_reaction(
            self.example_user("hamlet"), message, "outbox", "1f4e4", Reaction.UNICODE_EMOJI
        )

        assert message is not None
        self.export_realm(realm, consent_message_id=message.id)

        data = read_json("realm.json")

        self.assert_length(data["zerver_userprofile_crossrealm"], 3)
        self.assert_length(data["zerver_userprofile_mirrordummy"], 0)

        exported_user_emails = self.get_set(data["zerver_userprofile"], "delivery_email")
        self.assertIn(self.example_email("cordelia"), exported_user_emails)
        self.assertIn(self.example_email("hamlet"), exported_user_emails)
        self.assertIn(self.example_email("iago"), exported_user_emails)
        self.assertIn(self.example_email("othello"), exported_user_emails)
        self.assertIn("default-bot@zulip.com", exported_user_emails)

        exported_streams = self.get_set(data["zerver_stream"], "name")
        self.assertEqual(
            exported_streams,
            {
                "core team",
                "Denmark",
                "Rome",
                "Scotland",
                "Venice",
                "Verona",
                "Private A",
                "Private B",
                "Private C",
            },
        )

        data = read_json("messages-000001.json")
        exported_usermessages = UserMessage.objects.filter(
            user_profile__in=[self.example_user("iago"), self.example_user("hamlet")]
        )
        um = exported_usermessages[0]
        self.assert_length(data["zerver_usermessage"], len(exported_usermessages))
        exported_um = self.find_by_id(data["zerver_usermessage"], um.id)
        self.assertEqual(exported_um["message"], um.message_id)
        self.assertEqual(exported_um["user_profile"], um.user_profile_id)

        exported_message = self.find_by_id(data["zerver_message"], um.message_id)
        self.assertEqual(exported_message["content"], um.message.content)

        public_stream_names = ["Denmark", "Rome", "Scotland", "Venice", "Verona"]
        public_stream_ids = Stream.objects.filter(name__in=public_stream_names).values_list(
            "id", flat=True
        )
        public_stream_recipients = Recipient.objects.filter(
            type_id__in=public_stream_ids, type=Recipient.STREAM
        )
        public_stream_message_ids = Message.objects.filter(
            recipient__in=public_stream_recipients
        ).values_list("id", flat=True)

        # Messages from Private stream C are not exported since no member gave consent
        private_stream_ids = Stream.objects.filter(
            name__in=["Private A", "Private B", "core team"]
        ).values_list("id", flat=True)
        private_stream_recipients = Recipient.objects.filter(
            type_id__in=private_stream_ids, type=Recipient.STREAM
        )
        private_stream_message_ids = Message.objects.filter(
            recipient__in=private_stream_recipients
        ).values_list("id", flat=True)

        pm_recipients = Recipient.objects.filter(
            type_id__in=consented_user_ids, type=Recipient.PERSONAL
        )
        pm_query = Q(recipient__in=pm_recipients) | Q(sender__in=consented_user_ids)
        exported_pm_ids = (
            Message.objects.filter(pm_query)
            .values_list("id", flat=True)
            .values_list("id", flat=True)
        )

        # Third huddle is not exported since none of the members gave consent
        assert huddle_a is not None and huddle_b is not None
        huddle_recipients = Recipient.objects.filter(
            type_id__in=[huddle_a.id, huddle_b.id], type=Recipient.HUDDLE
        )
        pm_query = Q(recipient__in=huddle_recipients) | Q(sender__in=consented_user_ids)
        exported_huddle_ids = (
            Message.objects.filter(pm_query)
            .values_list("id", flat=True)
            .values_list("id", flat=True)
        )

        exported_msg_ids = (
            set(public_stream_message_ids)
            | set(private_stream_message_ids)
            | set(exported_pm_ids)
            | set(exported_huddle_ids)
        )
        self.assertEqual(self.get_set(data["zerver_message"], "id"), exported_msg_ids)

        # TODO: This behavior is wrong and should be fixed. The message should not be exported
        # since it was sent before the only consented user iago joined the stream.
        self.assertIn(stream_b_message_id, exported_msg_ids)

        self.assertNotIn(stream_c_message_id, exported_msg_ids)
        self.assertNotIn(huddle_c_message_id, exported_msg_ids)

        self.assertNotIn(pm_a_msg_id, exported_msg_ids)
        self.assertIn(pm_b_msg_id, exported_msg_ids)
        self.assertIn(pm_c_msg_id, exported_msg_ids)
        self.assertIn(pm_d_msg_id, exported_msg_ids)

    """
    Tests for import_realm
    """

    def test_import_realm(self) -> None:

        original_realm = Realm.objects.get(string_id="zulip")

        hamlet = self.example_user("hamlet")
        cordelia = self.example_user("cordelia")
        othello = self.example_user("othello")

        with get_test_image_file("img.png") as img_file:
            realm_emoji = check_add_realm_emoji(
                realm=hamlet.realm, name="hawaii", author=hamlet, image_file=img_file
            )
            assert realm_emoji
            self.assertEqual(realm_emoji.name, "hawaii")

        # Deactivate a user to ensure such a case is covered.
        do_deactivate_user(self.example_user("aaron"), acting_user=None)
        # data to test import of huddles
        huddle = [
            self.example_user("hamlet"),
            self.example_user("othello"),
        ]
        self.send_huddle_message(
            self.example_user("cordelia"),
            huddle,
            "test huddle message",
        )

        user_mention_message = "@**King Hamlet** Hello"
        self.send_stream_message(self.example_user("iago"), "Verona", user_mention_message)

        stream_mention_message = "Subscribe to #**Denmark**"
        self.send_stream_message(self.example_user("hamlet"), "Verona", stream_mention_message)

        user_group_mention_message = "Hello @*hamletcharacters*"
        self.send_stream_message(self.example_user("othello"), "Verona", user_group_mention_message)

        special_characters_message = "```\n'\n```\n@**Polonius**"
        self.send_stream_message(self.example_user("iago"), "Denmark", special_characters_message)

        sample_user = self.example_user("hamlet")

        check_add_reaction(
            user_profile=cordelia,
            message_id=most_recent_message(hamlet).id,
            emoji_name="hawaii",
            emoji_code=None,
            reaction_type=None,
        )
        reaction = Reaction.objects.order_by("id").last()
        assert reaction

        # Verify strange invariant for Reaction/RealmEmoji.
        self.assertEqual(reaction.emoji_code, str(realm_emoji.id))

        # data to test import of hotspots
        UserHotspot.objects.create(
            user=sample_user,
            hotspot="intro_streams",
        )

        # data to test import of muted topic
        stream = get_stream("Verona", original_realm)
        recipient = stream.recipient
        assert recipient is not None
        add_topic_mute(
            user_profile=sample_user,
            stream_id=stream.id,
            recipient_id=recipient.id,
            topic_name="Verona2",
        )

        # data to test import of muted users
        do_mute_user(hamlet, cordelia)
        do_mute_user(cordelia, hamlet)
        do_mute_user(cordelia, othello)

        client = get_client("website")

        do_update_user_presence(sample_user, client, timezone_now(), UserPresence.ACTIVE)

        # send Cordelia to the islands
        do_update_user_status(
            user_profile=cordelia,
            away=True,
            status_text="in Hawaii",
            client_id=client.id,
            emoji_name="hawaii",
            emoji_code=str(realm_emoji.id),
            reaction_type=Reaction.REALM_EMOJI,
        )

        user_status = UserStatus.objects.order_by("id").last()
        assert user_status

        # Verify strange invariant for UserStatus/RealmEmoji.
        self.assertEqual(user_status.emoji_code, str(realm_emoji.id))

        # data to test import of botstoragedata and botconfigdata
        bot_profile = do_create_user(
            email="bot-1@zulip.com",
            password="test",
            realm=original_realm,
            full_name="bot",
            bot_type=UserProfile.EMBEDDED_BOT,
            bot_owner=sample_user,
            acting_user=None,
        )
        storage = StateHandler(bot_profile)
        storage.put("some key", "some value")

        set_bot_config(bot_profile, "entry 1", "value 1")

        realm_user_default = RealmUserDefault.objects.get(realm=original_realm)
        realm_user_default.default_language = "de"
        realm_user_default.twenty_four_hour_time = True
        realm_user_default.save()

        # We want to have an extra, malformed RealmEmoji with no .author
        # to test that upon import that gets fixed.
        with get_test_image_file("img.png") as img_file:
            new_realm_emoji = check_add_realm_emoji(
                realm=hamlet.realm, name="hawaii2", author=hamlet, image_file=img_file
            )
            assert new_realm_emoji is not None
        original_realm_emoji_count = RealmEmoji.objects.count()
        self.assertGreaterEqual(original_realm_emoji_count, 2)
        new_realm_emoji.author = None
        new_realm_emoji.save()

        getters = self.get_realm_getters()

        snapshots: Dict[str, object] = {}

        for f in getters:
            snapshots[f.__name__] = f(original_realm)

        self.export_realm(original_realm)

        with self.settings(BILLING_ENABLED=False), self.assertLogs(level="INFO"):
            do_import_realm(os.path.join(settings.TEST_WORKER_DIR, "test-export"), "test-zulip")

        # Make sure our export/import didn't somehow leak info into the
        # original realm.
        for f in getters:
            # One way this will fail is if you make a getter that doesn't
            # properly restrict its results to a single realm.
            if f(original_realm) != snapshots[f.__name__]:
                raise AssertionError(
                    f"""
                    The export/import process is corrupting your
                    original realm according to {f.__name__}!

                    If you wrote that getter, are you sure you
                    are only grabbing objects from one realm?
                    """
                )

        imported_realm = Realm.objects.get(string_id="test-zulip")

        # test realm
        self.assertTrue(Realm.objects.filter(string_id="test-zulip").exists())
        self.assertNotEqual(imported_realm.id, original_realm.id)

        def assert_realm_values(f: Callable[[Realm], object]) -> None:
            orig_realm_result = f(original_realm)
            imported_realm_result = f(imported_realm)
            # orig_realm_result should be truthy and have some values, otherwise
            # the test is kind of meaningless
            assert orig_realm_result

            # It may be helpful to do print(f.__name__) if you are having
            # trouble debugging this.

            # print(f.__name__, orig_realm_result, imported_realm_result)
            self.assertEqual(orig_realm_result, imported_realm_result)

        for f in getters:
            assert_realm_values(f)

        self.verify_emoji_code_foreign_keys()

        # Our huddle hashes change, because hashes use ids that change.
        self.assertNotEqual(get_huddle_hashes(original_realm), get_huddle_hashes(imported_realm))

        # test to highlight that bs4 which we use to do data-**id
        # replacements modifies the HTML sometimes. eg replacing <br>
        # with </br>, &#39; with \' etc. The modifications doesn't
        # affect how the browser displays the rendered_content so we
        # are okay with using bs4 for this.  lxml package also has
        # similar behavior.
        orig_polonius_user = self.example_user("polonius")
        original_msg = Message.objects.get(
            content=special_characters_message, sender__realm=original_realm
        )
        self.assertEqual(
            original_msg.rendered_content,
            '<div class="codehilite"><pre><span></span><code>&#39;\n</code></pre></div>\n'
            f'<p><span class="user-mention" data-user-id="{orig_polonius_user.id}">@Polonius</span></p>',
        )
        imported_polonius_user = UserProfile.objects.get(
            delivery_email=self.example_email("polonius"), realm=imported_realm
        )
        imported_msg = Message.objects.get(
            content=special_characters_message, sender__realm=imported_realm
        )
        self.assertEqual(
            imported_msg.rendered_content,
            '<div class="codehilite"><pre><span></span><code>\'\n</code></pre></div>\n'
            f'<p><span class="user-mention" data-user-id="{imported_polonius_user.id}">@Polonius</span></p>',
        )

        # Check recipient_id was generated correctly for the imported users and streams.
        for user_profile in UserProfile.objects.filter(realm=imported_realm):
            self.assertEqual(
                user_profile.recipient_id,
                Recipient.objects.get(type=Recipient.PERSONAL, type_id=user_profile.id).id,
            )
        for stream in Stream.objects.filter(realm=imported_realm):
            self.assertEqual(
                stream.recipient_id,
                Recipient.objects.get(type=Recipient.STREAM, type_id=stream.id).id,
            )

        for huddle_object in Huddle.objects.all():
            # Huddles don't have a realm column, so we just test all Huddles for simplicity.
            self.assertEqual(
                huddle_object.recipient_id,
                Recipient.objects.get(type=Recipient.HUDDLE, type_id=huddle_object.id).id,
            )

        for user_profile in UserProfile.objects.filter(realm=imported_realm):
            # Check that all Subscriptions have the correct is_user_active set.
            self.assertEqual(
                Subscription.objects.filter(
                    user_profile=user_profile, is_user_active=user_profile.is_active
                ).count(),
                Subscription.objects.filter(user_profile=user_profile).count(),
            )
        # Verify that we've actually tested something meaningful instead of a blind import
        # with is_user_active=True used for everything.
        self.assertTrue(Subscription.objects.filter(is_user_active=False).exists())

        all_imported_realm_emoji = RealmEmoji.objects.filter(realm=imported_realm)
        self.assertEqual(all_imported_realm_emoji.count(), original_realm_emoji_count)
        for imported_realm_emoji in all_imported_realm_emoji:
            self.assertNotEqual(imported_realm_emoji.author, None)

    def get_realm_getters(self) -> List[Callable[[Realm], object]]:
        names = set()
        getters: List[Callable[[Realm], object]] = []

        def getter(f: Callable[[Realm], object]) -> Callable[[Realm], object]:
            getters.append(f)
            assert f.__name__.startswith("get_")

            # Avoid dups
            assert f.__name__ not in names
            names.add(f.__name__)
            return f

        @getter
        def get_admin_bot_emails(r: Realm) -> Set[str]:
            return {user.email for user in r.get_admin_users_and_bots()}

        @getter
        def get_active_emails(r: Realm) -> Set[str]:
            return {user.email for user in r.get_active_users()}

        @getter
        def get_active_stream_names(r: Realm) -> Set[str]:
            return {stream.name for stream in get_active_streams(r)}

        # test recipients
        def get_recipient_stream(r: Realm) -> Recipient:
            recipient = Stream.objects.get(name="Verona", realm=r).recipient
            assert recipient is not None
            return recipient

        def get_recipient_user(r: Realm) -> Recipient:
            return UserProfile.objects.get(full_name="Iago", realm=r).recipient

        @getter
        def get_stream_recipient_type(r: Realm) -> int:
            return get_recipient_stream(r).type

        @getter
        def get_user_recipient_type(r: Realm) -> int:
            return get_recipient_user(r).type

        # test subscription
        def get_subscribers(recipient: Recipient) -> Set[str]:
            subscriptions = Subscription.objects.filter(recipient=recipient)
            users = {sub.user_profile.email for sub in subscriptions}
            return users

        @getter
        def get_stream_subscribers(r: Realm) -> Set[str]:
            return get_subscribers(get_recipient_stream(r))

        @getter
        def get_user_subscribers(r: Realm) -> Set[str]:
            return get_subscribers(get_recipient_user(r))

        # test custom profile fields
        @getter
        def get_custom_profile_field_names(r: Realm) -> Set[str]:
            custom_profile_fields = CustomProfileField.objects.filter(realm=r)
            custom_profile_field_names = {field.name for field in custom_profile_fields}
            return custom_profile_field_names

        @getter
        def get_custom_profile_with_field_type_user(
            r: Realm,
        ) -> Tuple[Set[object], Set[object], Set[FrozenSet[str]]]:
            fields = CustomProfileField.objects.filter(field_type=CustomProfileField.USER, realm=r)

            def get_email(user_id: int) -> str:
                return UserProfile.objects.get(id=user_id).email

            def get_email_from_value(field_value: CustomProfileFieldValue) -> Set[str]:
                user_id_list = orjson.loads(field_value.value)
                return {get_email(user_id) for user_id in user_id_list}

            def custom_profile_field_values_for(
                fields: List[CustomProfileField],
            ) -> Set[FrozenSet[str]]:
                user_emails: Set[FrozenSet[str]] = set()
                for field in fields:
                    values = CustomProfileFieldValue.objects.filter(field=field)
                    for value in values:
                        user_emails.add(frozenset(get_email_from_value(value)))
                return user_emails

            field_names, field_hints = (set() for i in range(2))
            for field in fields:
                field_names.add(field.name)
                field_hints.add(field.hint)

            return (field_hints, field_names, custom_profile_field_values_for(fields))

        # test realmauditlog
        @getter
        def get_realm_audit_log_event_type(r: Realm) -> Set[str]:
            realmauditlogs = RealmAuditLog.objects.filter(realm=r).exclude(
                event_type__in=[RealmAuditLog.REALM_PLAN_TYPE_CHANGED, RealmAuditLog.STREAM_CREATED]
            )
            realmauditlog_event_type = {log.event_type for log in realmauditlogs}
            return realmauditlog_event_type

        @getter
        def get_huddle_message(r: Realm) -> str:
            huddle_hash = get_huddle_hashes(r)
            huddle_id = Huddle.objects.get(huddle_hash=huddle_hash).id
            huddle_recipient = Recipient.objects.get(type_id=huddle_id, type=3)
            huddle_message = Message.objects.get(recipient=huddle_recipient)
            self.assertEqual(huddle_message.content, "test huddle message")
            return huddle_message.content

        @getter
        def get_alertwords(r: Realm) -> Set[str]:
            return {rec.word for rec in AlertWord.objects.filter(realm_id=r.id)}

        @getter
        def get_realm_emoji_names(r: Realm) -> Set[str]:
            names = {rec.name for rec in RealmEmoji.objects.filter(realm_id=r.id)}
            assert "hawaii" in names
            return names

        @getter
        def get_realm_user_statuses(r: Realm) -> Set[Tuple[str, str, int, str]]:
            cordelia = self.example_user("cordelia")
            tups = {
                (rec.user_profile.full_name, rec.emoji_name, rec.status, rec.status_text)
                for rec in UserStatus.objects.filter(user_profile__realm_id=r.id)
            }
            assert (cordelia.full_name, "hawaii", UserStatus.AWAY, "in Hawaii") in tups
            return tups

        @getter
        def get_realm_emoji_reactions(r: Realm) -> Set[Tuple[str, str]]:
            cordelia = self.example_user("cordelia")
            tups = {
                (rec.emoji_name, rec.user_profile.full_name)
                for rec in Reaction.objects.filter(
                    user_profile__realm_id=r.id, reaction_type=Reaction.REALM_EMOJI
                )
            }
            self.assertEqual(tups, {("hawaii", cordelia.full_name)})
            return tups

        # test userhotspot
        @getter
        def get_user_hotspots(r: Realm) -> Set[str]:
            user_id = get_user_id(r, "King Hamlet")
            hotspots = UserHotspot.objects.filter(user_id=user_id)
            user_hotspots = {hotspot.hotspot for hotspot in hotspots}
            return user_hotspots

        # test muted topics
        @getter
        def get_muted_topics(r: Realm) -> Set[str]:
            user_profile_id = get_user_id(r, "King Hamlet")
            muted_topics = UserTopic.objects.filter(
                user_profile_id=user_profile_id, visibility_policy=UserTopic.MUTED
            )
            topic_names = {muted_topic.topic_name for muted_topic in muted_topics}
            return topic_names

        @getter
        def get_muted_users(r: Realm) -> Set[Tuple[str, str, str]]:
            mute_objects = MutedUser.objects.filter(user_profile__realm=r)
            muter_tuples = {
                (
                    mute_object.user_profile.full_name,
                    mute_object.muted_user.full_name,
                    str(mute_object.date_muted),
                )
                for mute_object in mute_objects
            }
            return muter_tuples

        @getter
        def get_user_group_names(r: Realm) -> Set[str]:
            return {group.name for group in UserGroup.objects.filter(realm=r)}

        @getter
        def get_user_membership(r: Realm) -> Set[str]:
            usergroup = UserGroup.objects.get(realm=r, name="hamletcharacters")
            usergroup_membership = UserGroupMembership.objects.filter(user_group=usergroup)
            users = {membership.user_profile.email for membership in usergroup_membership}
            return users

        # test botstoragedata and botconfigdata
        @getter
        def get_botstoragedata(r: Realm) -> Dict[str, object]:
            bot_profile = UserProfile.objects.get(full_name="bot", realm=r)
            bot_storage_data = BotStorageData.objects.get(bot_profile=bot_profile)
            return {"key": bot_storage_data.key, "data": bot_storage_data.value}

        @getter
        def get_botconfigdata(r: Realm) -> Dict[str, object]:
            bot_profile = UserProfile.objects.get(full_name="bot", realm=r)
            bot_config_data = BotConfigData.objects.get(bot_profile=bot_profile)
            return {"key": bot_config_data.key, "data": bot_config_data.value}

        # test messages
        def get_stream_messages(r: Realm) -> Message:
            recipient = get_recipient_stream(r)
            messages = Message.objects.filter(recipient=recipient)
            return messages

        @getter
        def get_stream_topics(r: Realm) -> Set[str]:
            messages = get_stream_messages(r)
            topics = {m.topic_name() for m in messages}
            return topics

        # test usermessages
        @getter
        def get_usermessages_user(r: Realm) -> Set[object]:
            messages = get_stream_messages(r).order_by("content")
            usermessage = UserMessage.objects.filter(message=messages[0])
            usermessage_user = {um.user_profile.email for um in usermessage}
            return usermessage_user

        # tests to make sure that various data-*-ids in rendered_content
        # are replaced correctly with the values of newer realm.

        @getter
        def get_user_mention(r: Realm) -> str:
            mentioned_user = UserProfile.objects.get(
                delivery_email=self.example_email("hamlet"), realm=r
            )
            data_user_id = f'data-user-id="{mentioned_user.id}"'
            mention_message = get_stream_messages(r).get(rendered_content__contains=data_user_id)
            return mention_message.content

        @getter
        def get_stream_mention(r: Realm) -> str:
            mentioned_stream = get_stream("Denmark", r)
            data_stream_id = f'data-stream-id="{mentioned_stream.id}"'
            mention_message = get_stream_messages(r).get(rendered_content__contains=data_stream_id)
            return mention_message.content

        @getter
        def get_user_group_mention(r: Realm) -> str:
            user_group = UserGroup.objects.get(realm=r, name="hamletcharacters")
            data_usergroup_id = f'data-user-group-id="{user_group.id}"'
            mention_message = get_stream_messages(r).get(
                rendered_content__contains=data_usergroup_id
            )
            return mention_message.content

        @getter
        def get_userpresence_timestamp(r: Realm) -> Set[object]:
            # It should be sufficient to compare UserPresence timestamps to verify
            # they got exported/imported correctly.
            return set(UserPresence.objects.filter(realm=r).values_list("timestamp", flat=True))

        @getter
        def get_realm_user_default_values(r: Realm) -> Dict[str, object]:
            realm_user_default = RealmUserDefault.objects.get(realm=r)
            return {
                "default_language": realm_user_default.default_language,
                "twenty_four_hour_time": realm_user_default.twenty_four_hour_time,
            }

        return getters

    def test_import_realm_with_no_realm_user_default_table(self) -> None:
        original_realm = Realm.objects.get(string_id="zulip")

        RealmUserDefault.objects.get(realm=original_realm).delete()
        self.export_realm(original_realm)

        with self.settings(BILLING_ENABLED=False), self.assertLogs(level="INFO"):
            do_import_realm(os.path.join(settings.TEST_WORKER_DIR, "test-export"), "test-zulip")

        self.assertTrue(Realm.objects.filter(string_id="test-zulip").exists())
        imported_realm = Realm.objects.get(string_id="test-zulip")

        # RealmUserDefault table with default values is created, if it is not present in
        # the import data.
        self.assertTrue(RealmUserDefault.objects.filter(realm=imported_realm).exists())

        realm_user_default = RealmUserDefault.objects.get(realm=imported_realm)
        self.assertEqual(realm_user_default.default_language, "en")
        self.assertEqual(realm_user_default.twenty_four_hour_time, False)

    def test_import_files_from_local(self) -> None:
        user = self.example_user("hamlet")
        realm = user.realm

        self.upload_files_for_user(user)
        self.upload_files_for_realm(user)

        self.export_realm(realm)

        with self.settings(BILLING_ENABLED=False), self.assertLogs(level="INFO"):
            do_import_realm(os.path.join(settings.TEST_WORKER_DIR, "test-export"), "test-zulip")
        imported_realm = Realm.objects.get(string_id="test-zulip")

        # Test attachments
        uploaded_file = Attachment.objects.get(realm=imported_realm)
        self.assert_length(b"zulip!", uploaded_file.size)

        assert settings.LOCAL_UPLOADS_DIR is not None
        attachment_file_path = os.path.join(
            settings.LOCAL_UPLOADS_DIR, "files", uploaded_file.path_id
        )
        self.assertTrue(os.path.isfile(attachment_file_path))

        # Test emojis
        realm_emoji = RealmEmoji.objects.get(realm=imported_realm)
        emoji_path = RealmEmoji.PATH_ID_TEMPLATE.format(
            realm_id=imported_realm.id,
            emoji_file_name=realm_emoji.file_name,
        )
        emoji_file_path = os.path.join(settings.LOCAL_UPLOADS_DIR, "avatars", emoji_path)
        self.assertTrue(os.path.isfile(emoji_file_path))

        # Test avatars
        user_profile = UserProfile.objects.get(full_name=user.full_name, realm=imported_realm)
        avatar_path_id = user_avatar_path(user_profile) + ".original"
        avatar_file_path = os.path.join(settings.LOCAL_UPLOADS_DIR, "avatars", avatar_path_id)
        self.assertTrue(os.path.isfile(avatar_file_path))

        # Test realm icon and logo
        upload_path = upload.upload_backend.realm_avatar_and_logo_path(imported_realm)
        full_upload_path = os.path.join(settings.LOCAL_UPLOADS_DIR, upload_path)

        test_image_data = read_test_image_file("img.png")
        self.assertIsNotNone(test_image_data)

        with open(os.path.join(full_upload_path, "icon.original"), "rb") as f:
            self.assertEqual(f.read(), test_image_data)
        self.assertTrue(os.path.isfile(os.path.join(full_upload_path, "icon.png")))
        self.assertEqual(imported_realm.icon_source, Realm.ICON_UPLOADED)

        with open(os.path.join(full_upload_path, "logo.original"), "rb") as f:
            self.assertEqual(f.read(), test_image_data)
        self.assertTrue(os.path.isfile(os.path.join(full_upload_path, "logo.png")))
        self.assertEqual(imported_realm.logo_source, Realm.LOGO_UPLOADED)

        with open(os.path.join(full_upload_path, "night_logo.original"), "rb") as f:
            self.assertEqual(f.read(), test_image_data)
        self.assertTrue(os.path.isfile(os.path.join(full_upload_path, "night_logo.png")))
        self.assertEqual(imported_realm.night_logo_source, Realm.LOGO_UPLOADED)

    @use_s3_backend
    def test_import_files_from_s3(self) -> None:
        uploads_bucket, avatar_bucket = create_s3_buckets(
            settings.S3_AUTH_UPLOADS_BUCKET, settings.S3_AVATAR_BUCKET
        )

        user = self.example_user("hamlet")
        realm = user.realm

        self.upload_files_for_realm(user)
        self.upload_files_for_user(user)
        self.export_realm(realm)

        with self.settings(BILLING_ENABLED=False), self.assertLogs(level="INFO"):
            do_import_realm(os.path.join(settings.TEST_WORKER_DIR, "test-export"), "test-zulip")

        imported_realm = Realm.objects.get(string_id="test-zulip")
        test_image_data = read_test_image_file("img.png")

        # Test attachments
        uploaded_file = Attachment.objects.get(realm=imported_realm)
        self.assert_length(b"zulip!", uploaded_file.size)

        attachment_content = uploads_bucket.Object(uploaded_file.path_id).get()["Body"].read()
        self.assertEqual(b"zulip!", attachment_content)

        # Test emojis
        realm_emoji = RealmEmoji.objects.get(realm=imported_realm)
        emoji_path = RealmEmoji.PATH_ID_TEMPLATE.format(
            realm_id=imported_realm.id,
            emoji_file_name=realm_emoji.file_name,
        )
        emoji_key = avatar_bucket.Object(emoji_path)
        self.assertIsNotNone(emoji_key.get()["Body"].read())
        self.assertEqual(emoji_key.key, emoji_path)

        # Test avatars
        user_profile = UserProfile.objects.get(full_name=user.full_name, realm=imported_realm)
        avatar_path_id = user_avatar_path(user_profile) + ".original"
        original_image_key = avatar_bucket.Object(avatar_path_id)
        self.assertEqual(original_image_key.key, avatar_path_id)
        image_data = avatar_bucket.Object(avatar_path_id).get()["Body"].read()
        self.assertEqual(image_data, test_image_data)

        # Test realm icon and logo
        upload_path = upload.upload_backend.realm_avatar_and_logo_path(imported_realm)

        original_icon_path_id = os.path.join(upload_path, "icon.original")
        original_icon_key = avatar_bucket.Object(original_icon_path_id)
        self.assertEqual(original_icon_key.get()["Body"].read(), test_image_data)
        resized_icon_path_id = os.path.join(upload_path, "icon.png")
        resized_icon_key = avatar_bucket.Object(resized_icon_path_id)
        self.assertEqual(resized_icon_key.key, resized_icon_path_id)
        self.assertEqual(imported_realm.icon_source, Realm.ICON_UPLOADED)

        original_logo_path_id = os.path.join(upload_path, "logo.original")
        original_logo_key = avatar_bucket.Object(original_logo_path_id)
        self.assertEqual(original_logo_key.get()["Body"].read(), test_image_data)
        resized_logo_path_id = os.path.join(upload_path, "logo.png")
        resized_logo_key = avatar_bucket.Object(resized_logo_path_id)
        self.assertEqual(resized_logo_key.key, resized_logo_path_id)
        self.assertEqual(imported_realm.logo_source, Realm.LOGO_UPLOADED)

        night_logo_original_path_id = os.path.join(upload_path, "night_logo.original")
        night_logo_original_key = avatar_bucket.Object(night_logo_original_path_id)
        self.assertEqual(night_logo_original_key.get()["Body"].read(), test_image_data)
        resized_night_logo_path_id = os.path.join(upload_path, "night_logo.png")
        resized_night_logo_key = avatar_bucket.Object(resized_night_logo_path_id)
        self.assertEqual(resized_night_logo_key.key, resized_night_logo_path_id)
        self.assertEqual(imported_realm.night_logo_source, Realm.LOGO_UPLOADED)

    def test_get_incoming_message_ids(self) -> None:
        import_dir = os.path.join(
            settings.DEPLOY_ROOT, "zerver", "tests", "fixtures", "import_fixtures"
        )
        message_ids = get_incoming_message_ids(
            import_dir=import_dir,
            sort_by_date=True,
        )

        self.assertEqual(message_ids, [888, 999, 555])

        message_ids = get_incoming_message_ids(
            import_dir=import_dir,
            sort_by_date=False,
        )

        self.assertEqual(message_ids, [555, 888, 999])

    def test_plan_type(self) -> None:
        user = self.example_user("hamlet")
        realm = user.realm
        do_change_realm_plan_type(realm, Realm.PLAN_TYPE_LIMITED, acting_user=None)

        self.upload_files_for_user(user)
        self.export_realm(realm)

        with self.settings(BILLING_ENABLED=True), self.assertLogs(level="INFO"):
            realm = do_import_realm(
                os.path.join(settings.TEST_WORKER_DIR, "test-export"), "test-zulip-1"
            )
            self.assertEqual(realm.plan_type, Realm.PLAN_TYPE_LIMITED)
            self.assertEqual(realm.max_invites, 100)
            self.assertEqual(realm.upload_quota_gb, 5)
            self.assertEqual(realm.message_visibility_limit, 10000)
            self.assertTrue(
                RealmAuditLog.objects.filter(
                    realm=realm, event_type=RealmAuditLog.REALM_PLAN_TYPE_CHANGED
                ).exists()
            )
        with self.settings(BILLING_ENABLED=False), self.assertLogs(level="INFO"):
            realm = do_import_realm(
                os.path.join(settings.TEST_WORKER_DIR, "test-export"), "test-zulip-2"
            )
            self.assertEqual(realm.plan_type, Realm.PLAN_TYPE_SELF_HOSTED)
            self.assertEqual(realm.max_invites, 100)
            self.assertEqual(realm.upload_quota_gb, None)
            self.assertEqual(realm.message_visibility_limit, None)
            self.assertTrue(
                RealmAuditLog.objects.filter(
                    realm=realm, event_type=RealmAuditLog.REALM_PLAN_TYPE_CHANGED
                ).exists()
            )


class SingleUserExportTest(ExportFile):
    def do_files_test(self, is_s3: bool) -> None:
        output_dir = make_export_output_dir()

        cordelia = self.example_user("cordelia")
        othello = self.example_user("othello")

        self.upload_files_for_user(cordelia)
        self.upload_files_for_user(othello, emoji_name="bogus")  # try to pollute export

        with self.assertLogs(level="INFO"):
            do_export_user(cordelia, output_dir)

        self.verify_uploads(cordelia, is_s3=is_s3)
        self.verify_avatars(cordelia)
        self.verify_emojis(cordelia, is_s3=is_s3)

    def test_local_files(self) -> None:
        self.do_files_test(is_s3=False)

    @use_s3_backend
    def test_s3_files(self) -> None:
        create_s3_buckets(settings.S3_AUTH_UPLOADS_BUCKET, settings.S3_AVATAR_BUCKET)
        self.do_files_test(is_s3=True)

    def test_message_data(self) -> None:
        hamlet = self.example_user("hamlet")
        cordelia = self.example_user("cordelia")
        othello = self.example_user("othello")
        polonius = self.example_user("polonius")

        self.subscribe(cordelia, "Denmark")

        smile_message_id = self.send_stream_message(hamlet, "Denmark", "SMILE!")

        check_add_reaction(
            user_profile=cordelia,
            message_id=smile_message_id,
            emoji_name="smile",
            emoji_code=None,
            reaction_type=None,
        )
        reaction = Reaction.objects.order_by("id").last()
        assert reaction

        # Send a message that Cordelia should not have in the export.
        self.send_stream_message(othello, "Denmark", "bogus")

        hi_stream_message_id = self.send_stream_message(cordelia, "Denmark", "hi stream")
        assert most_recent_usermessage(cordelia).message_id == hi_stream_message_id

        # Try to fool the export again
        self.send_personal_message(othello, hamlet)
        self.send_huddle_message(othello, [hamlet, polonius])

        hi_hamlet_message_id = self.send_personal_message(cordelia, hamlet, "hi hamlet")

        hi_peeps_message_id = self.send_huddle_message(cordelia, [hamlet, othello], "hi peeps")
        bye_peeps_message_id = self.send_huddle_message(othello, [cordelia, hamlet], "bye peeps")

        bye_hamlet_message_id = self.send_personal_message(cordelia, hamlet, "bye hamlet")

        hi_myself_message_id = self.send_personal_message(cordelia, cordelia, "hi myself")
        bye_stream_message_id = self.send_stream_message(cordelia, "Denmark", "bye stream")

        output_dir = make_export_output_dir()
        cordelia = self.example_user("cordelia")

        with self.assertLogs(level="INFO"):
            do_export_user(cordelia, output_dir)

        messages = read_json("messages-000001.json")

        huddle_name = "Cordelia, Lear's daughter, King Hamlet, Othello, the Moor of Venice"

        excerpt = [
            (rec["id"], rec["content"], rec["recipient_name"])
            for rec in messages["zerver_message"][-8:]
        ]
        self.assertEqual(
            excerpt,
            [
                (smile_message_id, "SMILE!", "Denmark"),
                (hi_stream_message_id, "hi stream", "Denmark"),
                (hi_hamlet_message_id, "hi hamlet", hamlet.full_name),
                (hi_peeps_message_id, "hi peeps", huddle_name),
                (bye_peeps_message_id, "bye peeps", huddle_name),
                (bye_hamlet_message_id, "bye hamlet", hamlet.full_name),
                (hi_myself_message_id, "hi myself", cordelia.full_name),
                (bye_stream_message_id, "bye stream", "Denmark"),
            ],
        )

    def test_user_data(self) -> None:
        # We register checkers during test setup, and then we call them at the end.
        checkers = {}

        def checker(f: Callable[[List[Record]], None]) -> Callable[[List[Record]], None]:
            # Every checker function that gets decorated here should be named
            # after one of the tables that we export in the single-user
            # export. The table name then is used by code toward the end of the
            # test to determine which portion of the data from users.json
            # to pass into the checker.
            table_name = f.__name__
            assert table_name not in checkers
            checkers[table_name] = f
            return f

        cordelia = self.example_user("cordelia")
        hamlet = self.example_user("hamlet")
        othello = self.example_user("othello")
        realm = cordelia.realm
        scotland = get_stream("Scotland", realm)
        client = get_client("some_app")
        now = timezone_now()

        @checker
        def zerver_userprofile(records: List[Record]) -> None:
            (rec,) = records
            self.assertEqual(rec["id"], cordelia.id)
            self.assertEqual(rec["email"], cordelia.email)
            self.assertEqual(rec["full_name"], cordelia.full_name)

        """
        Try to set up the test data roughly in order of table name, where
        possible, just to make it a bit easier to read the test.
        """

        do_add_alert_words(cordelia, ["pizza"])
        do_add_alert_words(hamlet, ["bogus"])

        @checker
        def zerver_alertword(records: List[Record]) -> None:
            self.assertEqual(records[-1]["word"], "pizza")

        favorite_city = try_add_realm_custom_profile_field(
            realm,
            "Favorite city",
            CustomProfileField.SHORT_TEXT,
        )

        def set_favorite_city(user: UserProfile, city: str) -> None:
            do_update_user_custom_profile_data_if_changed(
                user, [dict(id=favorite_city.id, value=city)]
            )

        set_favorite_city(cordelia, "Seattle")
        set_favorite_city(othello, "Moscow")

        @checker
        def zerver_customprofilefieldvalue(records: List[Record]) -> None:
            (rec,) = records
            self.assertEqual(rec["field"], favorite_city.id)
            self.assertEqual(rec["rendered_value"], "<p>Seattle</p>")

        do_mute_user(cordelia, othello)
        do_mute_user(hamlet, cordelia)  # should be ignored

        @checker
        def zerver_muteduser(records: List[Record]) -> None:
            self.assertEqual(records[-1]["muted_user"], othello.id)

        smile_message_id = self.send_stream_message(hamlet, "Denmark")

        check_add_reaction(
            user_profile=cordelia,
            message_id=smile_message_id,
            emoji_name="smile",
            emoji_code=None,
            reaction_type=None,
        )
        reaction = Reaction.objects.order_by("id").last()

        @checker
        def zerver_reaction(records: List[Record]) -> None:
            assert reaction
            (exported_reaction,) = records
            self.assertEqual(
                exported_reaction,
                dict(
                    id=reaction.id,
                    user_profile=cordelia.id,
                    emoji_name="smile",
                    reaction_type="unicode_emoji",
                    emoji_code=reaction.emoji_code,
                    message=smile_message_id,
                ),
            )

        self.subscribe(cordelia, "Scotland")

        create_stream_if_needed(realm, "bogus")
        self.subscribe(othello, "bogus")

        @checker
        def zerver_recipient(records: List[Record]) -> None:
            last_recipient = Recipient.objects.get(id=records[-1]["id"])
            self.assertEqual(last_recipient.type, Recipient.STREAM)
            stream_id = last_recipient.type_id
            self.assertEqual(stream_id, get_stream("Scotland", realm).id)

        @checker
        def zerver_stream(records: List[Record]) -> None:
            streams = {rec["name"] for rec in records}
            self.assertEqual(streams, {"Scotland", "Verona"})

        @checker
        def zerver_subscription(records: List[Record]) -> None:
            last_recipient = Recipient.objects.get(id=records[-1]["recipient"])
            self.assertEqual(last_recipient.type, Recipient.STREAM)
            stream_id = last_recipient.type_id
            self.assertEqual(stream_id, get_stream("Scotland", realm).id)

        do_update_user_activity(cordelia.id, client.id, "/some/endpoint", 2, now)
        do_update_user_activity(cordelia.id, client.id, "/some/endpoint", 3, now)
        do_update_user_activity(othello.id, client.id, "/bogus", 20, now)

        @checker
        def zerver_useractivity(records: List[Record]) -> None:
            (rec,) = records
            self.assertEqual(
                rec,
                dict(
                    client=client.id,
                    count=5,
                    id=rec["id"],
                    last_visit=rec["last_visit"],
                    query="/some/endpoint",
                    user_profile=cordelia.id,
                ),
            )
            self.assertEqual(make_datetime(rec["last_visit"]), now)

        do_update_user_activity_interval(cordelia, now)
        do_update_user_activity_interval(othello, now)

        @checker
        def zerver_useractivityinterval(records: List[Record]) -> None:
            (rec,) = records
            self.assertEqual(rec["user_profile"], cordelia.id)
            self.assertEqual(make_datetime(rec["start"]), now)

        do_update_user_presence(cordelia, client, now, UserPresence.ACTIVE)
        do_update_user_presence(othello, client, now, UserPresence.IDLE)

        @checker
        def zerver_userpresence(records: List[Record]) -> None:
            self.assertEqual(records[-1]["status"], UserPresence.ACTIVE)
            self.assertEqual(records[-1]["client"], client.id)
            self.assertEqual(make_datetime(records[-1]["timestamp"]), now)

        do_update_user_status(
            user_profile=cordelia,
            away=True,
            status_text="on vacation",
            client_id=client.id,
            emoji_name=None,
            emoji_code=None,
            reaction_type=None,
        )

        do_update_user_status(
            user_profile=othello,
            away=False,
            status_text="at my desk",
            client_id=client.id,
            emoji_name=None,
            emoji_code=None,
            reaction_type=None,
        )

        @checker
        def zerver_userstatus(records: List[Record]) -> None:
            rec = records[-1]
            self.assertEqual(rec["status_text"], "on vacation")
            self.assertEqual(rec["status"], UserStatus.AWAY)

        do_mute_topic(cordelia, scotland, "bagpipe music")
        do_mute_topic(othello, scotland, "nessie")

        @checker
        def zerver_usertopic(records: List[Record]) -> None:
            rec = records[-1]
            self.assertEqual(rec["topic_name"], "bagpipe music")
            self.assertEqual(rec["visibility_policy"], UserTopic.MUTED)

        """
        For some tables we don't bother with super realistic test data
        setup.
        """
        UserCount.objects.create(
            user=cordelia, realm=realm, property="whatever", value=42, end_time=now
        )
        UserCount.objects.create(
            user=othello, realm=realm, property="bogus", value=999999, end_time=now
        )

        @checker
        def analytics_usercount(records: List[Record]) -> None:
            (rec,) = records
            self.assertEqual(rec["value"], 42)

        UserHotspot.objects.create(user=cordelia, hotspot="topics")
        UserHotspot.objects.create(user=othello, hotspot="bogus")

        @checker
        def zerver_userhotspot(records: List[Record]) -> None:
            self.assertEqual(records[-1]["hotspot"], "topics")

        """
        The zerver_realmauditlog checker basically assumes that
        we subscribed Cordelia to Scotland.
        """

        @checker
        def zerver_realmauditlog(records: List[Record]) -> None:
            self.assertEqual(records[-1]["modified_stream"], scotland.id)

        output_dir = make_export_output_dir()

        with self.assertLogs(level="INFO"):
            do_export_user(cordelia, output_dir)

        user = read_json("user.json")

        for table_name, f in checkers.items():
            f(user[table_name])

        for table_name in user:
            if table_name not in checkers:
                raise AssertionError(
                    f"""
                    Please create a checker called "{table_name}"
                    to check the user["{table_name}"] data in users.json.

                    Please be thoughtful about where you introduce
                    the new code--if you read the test, the patterns
                    for how to test table data should be clear.
                    Try to mostly keep checkers in alphabetical order.
                    """
                )
