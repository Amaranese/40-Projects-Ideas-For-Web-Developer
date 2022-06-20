from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from unittest import mock

from django.utils.timezone import now as timezone_now

from zerver.lib.stream_topic import StreamTopicTarget
from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.user_topics import (
    add_topic_mute,
    get_topic_mutes,
    remove_topic_mute,
    topic_is_muted,
)
from zerver.models import UserProfile, UserTopic, get_stream


class MutedTopicsTests(ZulipTestCase):
    def test_get_deactivated_muted_topic(self) -> None:
        user = self.example_user("hamlet")
        self.login_user(user)

        stream = get_stream("Verona", user.realm)
        recipient = stream.recipient

        mock_date_muted = datetime(2020, 1, 1, tzinfo=timezone.utc).timestamp()

        assert recipient is not None
        add_topic_mute(
            user_profile=user,
            stream_id=stream.id,
            recipient_id=recipient.id,
            topic_name="Verona3",
            date_muted=datetime(2020, 1, 1, tzinfo=timezone.utc),
        )

        stream.deactivated = True
        stream.save()

        self.assertNotIn((stream.name, "Verona3", mock_date_muted), get_topic_mutes(user))
        self.assertIn((stream.name, "Verona3", mock_date_muted), get_topic_mutes(user, True))

    def test_user_ids_muting_topic(self) -> None:
        hamlet = self.example_user("hamlet")
        cordelia = self.example_user("cordelia")
        realm = hamlet.realm
        stream = get_stream("Verona", realm)
        recipient = stream.recipient
        topic_name = "teST topic"

        stream_topic_target = StreamTopicTarget(
            stream_id=stream.id,
            topic_name=topic_name,
        )

        user_ids = stream_topic_target.user_ids_muting_topic()
        self.assertEqual(user_ids, set())

        def mute_topic_for_user(user: UserProfile) -> None:
            assert recipient is not None
            add_topic_mute(
                user_profile=user,
                stream_id=stream.id,
                recipient_id=recipient.id,
                topic_name="test TOPIC",
                date_muted=timezone_now(),
            )

        mute_topic_for_user(hamlet)
        user_ids = stream_topic_target.user_ids_muting_topic()
        self.assertEqual(user_ids, {hamlet.id})
        hamlet_date_muted = UserTopic.objects.filter(
            user_profile=hamlet, visibility_policy=UserTopic.MUTED
        )[0].last_updated
        self.assertTrue(timezone_now() - hamlet_date_muted <= timedelta(seconds=100))

        mute_topic_for_user(cordelia)
        user_ids = stream_topic_target.user_ids_muting_topic()
        self.assertEqual(user_ids, {hamlet.id, cordelia.id})
        cordelia_date_muted = UserTopic.objects.filter(
            user_profile=cordelia, visibility_policy=UserTopic.MUTED
        )[0].last_updated
        self.assertTrue(timezone_now() - cordelia_date_muted <= timedelta(seconds=100))

    def test_add_muted_topic(self) -> None:
        user = self.example_user("hamlet")
        self.login_user(user)

        stream = get_stream("Verona", user.realm)

        url = "/api/v1/users/me/subscriptions/muted_topics"

        payloads: List[Dict[str, object]] = [
            {"stream": stream.name, "topic": "Verona3", "op": "add"},
            {"stream_id": stream.id, "topic": "Verona3", "op": "add"},
        ]

        mock_date_muted = datetime(2020, 1, 1, tzinfo=timezone.utc).timestamp()
        for data in payloads:
            with mock.patch(
                "zerver.views.muting.timezone_now",
                return_value=datetime(2020, 1, 1, tzinfo=timezone.utc),
            ):
                result = self.api_patch(user, url, data)
                self.assert_json_success(result)

            self.assertIn((stream.name, "Verona3", mock_date_muted), get_topic_mutes(user))
            self.assertTrue(topic_is_muted(user, stream.id, "verona3"))

            remove_topic_mute(
                user_profile=user,
                stream_id=stream.id,
                topic_name="Verona3",
            )

        # Verify the error handling for the database level
        # IntegrityError we'll get with a race between two processes
        # trying to mute the topic.  To do this, we patch the
        # topic_is_muted function to always return False when trying
        # to mute a topic that is already muted.
        assert stream.recipient is not None
        add_topic_mute(
            user_profile=user,
            stream_id=stream.id,
            recipient_id=stream.recipient.id,
            topic_name="Verona3",
            date_muted=datetime(2020, 1, 1, tzinfo=timezone.utc),
        )

        with mock.patch("zerver.views.muting.topic_is_muted", return_value=False):
            result = self.api_patch(user, url, data)
            self.assert_json_error(result, "Topic already muted")

    def test_remove_muted_topic(self) -> None:
        user = self.example_user("hamlet")
        realm = user.realm
        self.login_user(user)

        stream = get_stream("Verona", realm)
        recipient = stream.recipient

        url = "/api/v1/users/me/subscriptions/muted_topics"
        payloads: List[Dict[str, object]] = [
            {"stream": stream.name, "topic": "vERONA3", "op": "remove"},
            {"stream_id": stream.id, "topic": "vEroNA3", "op": "remove"},
        ]
        mock_date_muted = datetime(2020, 1, 1, tzinfo=timezone.utc).timestamp()

        assert recipient is not None
        for data in payloads:
            add_topic_mute(
                user_profile=user,
                stream_id=stream.id,
                recipient_id=recipient.id,
                topic_name="Verona3",
                date_muted=datetime(2020, 1, 1, tzinfo=timezone.utc),
            )
            self.assertIn((stream.name, "Verona3", mock_date_muted), get_topic_mutes(user))

            result = self.api_patch(user, url, data)

            self.assert_json_success(result)
            self.assertNotIn((stream.name, "Verona3", mock_date_muted), get_topic_mutes(user))
            self.assertFalse(topic_is_muted(user, stream.id, "verona3"))

    def test_muted_topic_add_invalid(self) -> None:
        user = self.example_user("hamlet")
        realm = user.realm
        self.login_user(user)

        stream = get_stream("Verona", realm)
        recipient = stream.recipient
        assert recipient is not None
        add_topic_mute(
            user_profile=user,
            stream_id=stream.id,
            recipient_id=recipient.id,
            topic_name="Verona3",
            date_muted=timezone_now(),
        )

        url = "/api/v1/users/me/subscriptions/muted_topics"

        data: Dict[str, Any] = {"stream": stream.name, "topic": "Verona3", "op": "add"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Topic already muted")

        data = {"stream_id": 999999999, "topic": "Verona3", "op": "add"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Invalid stream ID")

        data = {"topic": "Verona3", "op": "add"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Please supply 'stream'.")

        data = {"stream": stream.name, "stream_id": stream.id, "topic": "Verona3", "op": "add"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Please choose one: 'stream' or 'stream_id'.")

    def test_muted_topic_remove_invalid(self) -> None:
        user = self.example_user("hamlet")
        realm = user.realm
        self.login_user(user)
        stream = get_stream("Verona", realm)

        url = "/api/v1/users/me/subscriptions/muted_topics"
        data: Dict[str, Any] = {"stream": "BOGUS", "topic": "Verona3", "op": "remove"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Topic is not muted")

        data = {"stream": stream.name, "topic": "BOGUS", "op": "remove"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Topic is not muted")

        data = {"stream_id": 999999999, "topic": "BOGUS", "op": "remove"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Topic is not muted")

        data = {"topic": "Verona3", "op": "remove"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Please supply 'stream'.")

        data = {"stream": stream.name, "stream_id": stream.id, "topic": "Verona3", "op": "remove"}
        result = self.api_patch(user, url, data)
        self.assert_json_error(result, "Please choose one: 'stream' or 'stream_id'.")
