import collections
import os
import re
import sys
import time
import weakref
from contextlib import contextmanager
from functools import wraps
from typing import (
    IO,
    TYPE_CHECKING,
    Any,
    Callable,
    Dict,
    Generator,
    Iterable,
    Iterator,
    List,
    Optional,
    Tuple,
    TypeVar,
    Union,
    cast,
)
from unittest import mock

import boto3
import fakeldap
import ldap
import orjson
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.db.migrations.state import StateApps
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.http.request import QueryDict
from django.test import override_settings
from django.urls import URLResolver
from moto import mock_s3
from mypy_boto3_s3.service_resource import Bucket

import zerver.lib.upload
from zerver.actions.realm_settings import do_set_realm_property
from zerver.lib import cache
from zerver.lib.avatar import avatar_url
from zerver.lib.cache import get_cache_backend
from zerver.lib.db import Params, ParamsT, Query, TimeTrackingCursor
from zerver.lib.integrations import WEBHOOK_INTEGRATIONS
from zerver.lib.notes import BaseNotes
from zerver.lib.request import RequestNotes
from zerver.lib.upload import LocalUploadBackend, S3UploadBackend
from zerver.models import (
    Client,
    Message,
    Realm,
    Subscription,
    UserMessage,
    UserProfile,
    get_client,
    get_realm,
    get_stream,
)
from zerver.tornado.handlers import AsyncDjangoHandler, allocate_handler_id
from zilencer.models import RemoteZulipServer
from zproject.backends import ExternalAuthDataDict, ExternalAuthResult

if TYPE_CHECKING:
    # Avoid an import cycle; we only need these for type annotations.
    from zerver.lib.test_classes import ClientArg, MigrationsTestCase, ZulipTestCase


class MockLDAP(fakeldap.MockLDAP):
    class LDAPError(ldap.LDAPError):
        pass

    class INVALID_CREDENTIALS(ldap.INVALID_CREDENTIALS):
        pass

    class NO_SUCH_OBJECT(ldap.NO_SUCH_OBJECT):
        pass

    class ALREADY_EXISTS(ldap.ALREADY_EXISTS):
        pass


@contextmanager
def stub_event_queue_user_events(
    event_queue_return: Any, user_events_return: Any
) -> Iterator[None]:
    with mock.patch("zerver.lib.events.request_event_queue", return_value=event_queue_return):
        with mock.patch("zerver.lib.events.get_user_events", return_value=user_events_return):
            yield


@contextmanager
def cache_tries_captured() -> Iterator[List[Tuple[str, Union[str, List[str]], Optional[str]]]]:
    cache_queries: List[Tuple[str, Union[str, List[str]], Optional[str]]] = []

    orig_get = cache.cache_get
    orig_get_many = cache.cache_get_many

    def my_cache_get(key: str, cache_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        cache_queries.append(("get", key, cache_name))
        return orig_get(key, cache_name)

    def my_cache_get_many(
        keys: List[str], cache_name: Optional[str] = None
    ) -> Dict[str, Any]:  # nocoverage -- simulated code doesn't use this
        cache_queries.append(("getmany", keys, cache_name))
        return orig_get_many(keys, cache_name)

    with mock.patch.multiple(cache, cache_get=my_cache_get, cache_get_many=my_cache_get_many):
        yield cache_queries


@contextmanager
def simulated_empty_cache() -> Iterator[List[Tuple[str, Union[str, List[str]], Optional[str]]]]:
    cache_queries: List[Tuple[str, Union[str, List[str]], Optional[str]]] = []

    def my_cache_get(key: str, cache_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        cache_queries.append(("get", key, cache_name))
        return None

    def my_cache_get_many(
        keys: List[str], cache_name: Optional[str] = None
    ) -> Dict[str, Any]:  # nocoverage -- simulated code doesn't use this
        cache_queries.append(("getmany", keys, cache_name))
        return {}

    with mock.patch.multiple(cache, cache_get=my_cache_get, cache_get_many=my_cache_get_many):
        yield cache_queries


@contextmanager
def queries_captured(
    include_savepoints: bool = False, keep_cache_warm: bool = False
) -> Generator[List[Dict[str, Union[str, bytes]]], None, None]:
    """
    Allow a user to capture just the queries executed during
    the with statement.
    """

    queries: List[Dict[str, Union[str, bytes]]] = []

    def wrapper_execute(
        self: TimeTrackingCursor,
        action: Callable[[Query, ParamsT], None],
        sql: Query,
        params: ParamsT,
    ) -> None:
        start = time.time()
        try:
            return action(sql, params)
        finally:
            stop = time.time()
            duration = stop - start
            if include_savepoints or not isinstance(sql, str) or "SAVEPOINT" not in sql:
                queries.append(
                    {
                        "sql": self.mogrify(sql, params).decode(),
                        "time": f"{duration:.3f}",
                    }
                )

    def cursor_execute(
        self: TimeTrackingCursor, sql: Query, params: Optional[Params] = None
    ) -> None:
        return wrapper_execute(self, super(TimeTrackingCursor, self).execute, sql, params)

    def cursor_executemany(self: TimeTrackingCursor, sql: Query, params: Iterable[Params]) -> None:
        return wrapper_execute(
            self, super(TimeTrackingCursor, self).executemany, sql, params
        )  # nocoverage -- doesn't actually get used in tests

    if not keep_cache_warm:
        cache = get_cache_backend(None)
        cache.clear()
    with mock.patch.multiple(
        TimeTrackingCursor, execute=cursor_execute, executemany=cursor_executemany
    ):
        yield queries


@contextmanager
def stdout_suppressed() -> Iterator[IO[str]]:
    """Redirect stdout to /dev/null."""

    with open(os.devnull, "a") as devnull:
        stdout, sys.stdout = sys.stdout, devnull
        try:
            yield stdout
        finally:
            sys.stdout = stdout


def reset_emails_in_zulip_realm() -> None:
    realm = get_realm("zulip")
    do_set_realm_property(
        realm,
        "email_address_visibility",
        Realm.EMAIL_ADDRESS_VISIBILITY_EVERYONE,
        acting_user=None,
    )


def get_test_image_file(filename: str) -> IO[bytes]:
    test_avatar_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../tests/images"))
    return open(os.path.join(test_avatar_dir, filename), "rb")


def read_test_image_file(filename: str) -> bytes:
    with get_test_image_file(filename) as img_file:
        return img_file.read()


def avatar_disk_path(
    user_profile: UserProfile, medium: bool = False, original: bool = False
) -> str:
    avatar_url_path = avatar_url(user_profile, medium)
    assert avatar_url_path is not None
    assert settings.LOCAL_UPLOADS_DIR is not None
    avatar_disk_path = os.path.join(
        settings.LOCAL_UPLOADS_DIR,
        "avatars",
        avatar_url_path.split("/")[-2],
        avatar_url_path.split("/")[-1].split("?")[0],
    )
    if original:
        return avatar_disk_path.replace(".png", ".original")
    return avatar_disk_path


def make_client(name: str) -> Client:
    client, _ = Client.objects.get_or_create(name=name)
    return client


def find_key_by_email(address: str) -> Optional[str]:
    from django.core.mail import outbox

    key_regex = re.compile("accounts/do_confirm/([a-z0-9]{24})>")
    for message in reversed(outbox):
        if address in message.to:
            match = key_regex.search(message.body)
            assert match is not None
            [key] = match.groups()
            return key
    return None  # nocoverage -- in theory a test might want this case, but none do


def message_stream_count(user_profile: UserProfile) -> int:
    return UserMessage.objects.select_related("message").filter(user_profile=user_profile).count()


def most_recent_usermessage(user_profile: UserProfile) -> UserMessage:
    query = (
        UserMessage.objects.select_related("message")
        .filter(user_profile=user_profile)
        .order_by("-message")
    )
    return query[0]  # Django does LIMIT here


def most_recent_message(user_profile: UserProfile) -> Message:
    usermessage = most_recent_usermessage(user_profile)
    return usermessage.message


def get_subscription(stream_name: str, user_profile: UserProfile) -> Subscription:
    stream = get_stream(stream_name, user_profile.realm)
    recipient_id = stream.recipient_id
    return Subscription.objects.get(
        user_profile=user_profile, recipient_id=recipient_id, active=True
    )


def get_user_messages(user_profile: UserProfile) -> List[Message]:
    query = (
        UserMessage.objects.select_related("message")
        .filter(user_profile=user_profile)
        .order_by("message")
    )
    return [um.message for um in query]


class DummyHandler(AsyncDjangoHandler):
    def __init__(self) -> None:
        allocate_handler_id(self)


class HostRequestMock(HttpRequest):
    """A mock request object where get_host() works.  Useful for testing
    routes that use Zulip's subdomains feature"""

    def __init__(
        self,
        post_data: Dict[str, Any] = {},
        user_profile: Optional[Union[UserProfile, AnonymousUser, RemoteZulipServer]] = None,
        host: str = settings.EXTERNAL_HOST,
        client_name: Optional[str] = None,
        meta_data: Optional[Dict[str, Any]] = None,
        tornado_handler: Optional[AsyncDjangoHandler] = DummyHandler(),
        path: str = "",
    ) -> None:
        self.host = host
        self.GET = QueryDict(mutable=True)
        self.method = ""

        # Convert any integer parameters passed into strings, even
        # though of course the HTTP API would do so.  Ideally, we'd
        # get rid of this abstraction entirely and just use the HTTP
        # API directly, but while it exists, we need this code
        self.POST = QueryDict(mutable=True)
        for key in post_data:
            self.POST[key] = str(post_data[key])
            self.method = "POST"

        if meta_data is None:
            self.META = {"PATH_INFO": "test"}
        else:
            self.META = meta_data
        self.path = path
        self.user = user_profile
        self._body = b""
        self.content_type = ""
        BaseNotes[str, str].get_notes

        RequestNotes.set_notes(
            self,
            RequestNotes(
                client_name="",
                log_data={},
                tornado_handler=None if tornado_handler is None else weakref.ref(tornado_handler),
                client=get_client(client_name) if client_name is not None else None,
            ),
        )

    @property
    def body(self) -> bytes:
        return super().body

    @body.setter
    def body(self, val: bytes) -> None:
        self._body = val

    def get_host(self) -> str:
        return self.host


INSTRUMENTING = os.environ.get("TEST_INSTRUMENT_URL_COVERAGE", "") == "TRUE"
INSTRUMENTED_CALLS: List[Dict[str, Any]] = []

UrlFuncT = TypeVar("UrlFuncT", bound=Callable[..., HttpResponse])  # TODO: make more specific


def append_instrumentation_data(data: Dict[str, Any]) -> None:
    INSTRUMENTED_CALLS.append(data)


def instrument_url(f: UrlFuncT) -> UrlFuncT:
    if not INSTRUMENTING:  # nocoverage -- option is always enabled; should we remove?
        return f
    else:

        def wrapper(
            self: "ZulipTestCase", url: str, info: object = {}, **kwargs: "ClientArg"
        ) -> HttpResponse:
            start = time.time()
            result = f(self, url, info, **kwargs)
            delay = time.time() - start
            test_name = self.id()
            if "?" in url:
                url, extra_info = url.split("?", 1)
            else:
                extra_info = ""

            if isinstance(info, HostRequestMock):
                info = "<HostRequestMock>"
            elif isinstance(info, bytes):
                info = "<bytes>"
            elif isinstance(info, dict):
                info = {
                    k: "<file object>" if hasattr(v, "read") and callable(getattr(v, "read")) else v
                    for k, v in info.items()
                }

            append_instrumentation_data(
                dict(
                    url=url,
                    status_code=result.status_code,
                    method=f.__name__,
                    delay=delay,
                    extra_info=extra_info,
                    info=info,
                    test_name=test_name,
                    kwargs=kwargs,
                )
            )
            return result

        return cast(UrlFuncT, wrapper)  # https://github.com/python/mypy/issues/1927


def write_instrumentation_reports(full_suite: bool, include_webhooks: bool) -> None:
    if INSTRUMENTING:
        calls = INSTRUMENTED_CALLS

        from zproject.urls import urlpatterns, v1_api_and_json_patterns

        # Find our untested urls.
        pattern_cnt: Dict[str, int] = collections.defaultdict(int)

        def re_strip(r: str) -> str:
            assert r.startswith(r"^")
            if r.endswith(r"$"):
                return r[1:-1]
            else:
                assert r.endswith(r"\Z")
                return r[1:-2]

        def find_patterns(patterns: List[Any], prefixes: List[str]) -> None:
            for pattern in patterns:
                find_pattern(pattern, prefixes)

        def cleanup_url(url: str) -> str:
            if url.startswith("/"):
                url = url[1:]
            if url.startswith("http://testserver/"):
                url = url[len("http://testserver/") :]
            if url.startswith("http://zulip.testserver/"):
                url = url[len("http://zulip.testserver/") :]
            if url.startswith("http://testserver:9080/"):
                url = url[len("http://testserver:9080/") :]
            return url

        def find_pattern(pattern: Any, prefixes: List[str]) -> None:

            if isinstance(pattern, type(URLResolver)):
                return  # nocoverage -- shouldn't actually happen

            if hasattr(pattern, "url_patterns"):
                return

            canon_pattern = prefixes[0] + re_strip(pattern.pattern.regex.pattern)
            cnt = 0
            for call in calls:
                if "pattern" in call:
                    continue

                url = cleanup_url(call["url"])

                for prefix in prefixes:
                    if url.startswith(prefix):
                        match_url = url[len(prefix) :]
                        if pattern.resolve(match_url):
                            if call["status_code"] in [200, 204, 301, 302]:
                                cnt += 1
                            call["pattern"] = canon_pattern
            pattern_cnt[canon_pattern] += cnt

        find_patterns(urlpatterns, ["", "en/", "de/"])
        find_patterns(v1_api_and_json_patterns, ["api/v1/", "json/"])

        assert len(pattern_cnt) > 100
        untested_patterns = {p.replace("\\", "") for p in pattern_cnt if pattern_cnt[p] == 0}

        exempt_patterns = {
            # We exempt some patterns that are called via Tornado.
            "api/v1/events",
            "api/v1/events/internal",
            "api/v1/register",
            # We also exempt some development environment debugging
            # static content URLs, since the content they point to may
            # or may not exist.
            "coverage/(?P<path>.+)",
            "confirmation_key/",
            "node-coverage/(?P<path>.+)",
            "docs/(?P<path>.+)",
            "help/add-custom-emoji",
            "help/configure-who-can-add-custom-emoji",
            "help/change-the-topic-of-a-message",
            "help/configure-missed-message-emails",
            "help/community-topic-edits",
            "help/about-streams-and-topics",
            "help/delete-a-stream",
            "help/add-an-alert-word",
            "help/change-notification-sound",
            "help/configure-message-notification-emails",
            "help/disable-new-login-emails",
            "help/test-mobile-notifications",
            "help/troubleshooting-desktop-notifications",
            "help/web-public-streams",
            "for/working-groups-and-communities/",
            "help/only-allow-admins-to-add-emoji",
            "help/night-mode",
            "api/delete-stream",
            "casper/(?P<path>.+)",
            "static/(?P<path>.+)",
            "flush_caches",
            "external_content/(?P<digest>[^/]+)/(?P<received_url>[^/]+)",
            # These are SCIM2 urls overridden from django-scim2 to return Not Implemented.
            # We actually test them, but it's not being detected as a tested pattern,
            # possibly due to the use of re_path. TODO: Investigate and get them
            # recognized as tested.
            "scim/v2/",
            "scim/v2/.search",
            "scim/v2/Bulk",
            "scim/v2/Me",
            "scim/v2/ResourceTypes(?:/(?P<uuid>[^/]+))?",
            "scim/v2/Schemas(?:/(?P<uuid>[^/]+))?",
            "scim/v2/ServiceProviderConfig",
            "scim/v2/Groups(?:/(?P<uuid>[^/]+))?",
            "scim/v2/Groups/.search",
            *(webhook.url for webhook in WEBHOOK_INTEGRATIONS if not include_webhooks),
        }

        untested_patterns -= exempt_patterns

        var_dir = "var"  # TODO make sure path is robust here
        fn = os.path.join(var_dir, "url_coverage.txt")
        with open(fn, "wb") as f:
            for call in calls:
                f.write(orjson.dumps(call, option=orjson.OPT_APPEND_NEWLINE))

        if full_suite:
            print(f"INFO: URL coverage report is in {fn}")
            print("INFO: Try running: ./tools/create-test-api-docs")

        if full_suite and len(untested_patterns):  # nocoverage -- test suite error handling
            print("\nERROR: Some URLs are untested!  Here's the list of untested URLs:")
            for untested_pattern in sorted(untested_patterns):
                print(f"   {untested_pattern}")
            sys.exit(1)


def load_subdomain_token(response: HttpResponse) -> ExternalAuthDataDict:
    assert isinstance(response, HttpResponseRedirect)
    token = response.url.rsplit("/", 1)[1]
    data = ExternalAuthResult(login_token=token, delete_stored_data=False).data_dict
    assert data is not None
    return data


FuncT = TypeVar("FuncT", bound=Callable[..., None])


def use_s3_backend(method: FuncT) -> FuncT:
    @mock_s3
    @override_settings(LOCAL_UPLOADS_DIR=None)
    def new_method(*args: Any, **kwargs: Any) -> Any:
        zerver.lib.upload.upload_backend = S3UploadBackend()
        try:
            return method(*args, **kwargs)
        finally:
            zerver.lib.upload.upload_backend = LocalUploadBackend()

    return new_method


def create_s3_buckets(*bucket_names: str) -> List[Bucket]:
    session = boto3.Session(settings.S3_KEY, settings.S3_SECRET_KEY)
    s3 = session.resource("s3")
    buckets = [s3.create_bucket(Bucket=name) for name in bucket_names]
    return buckets


def use_db_models(
    method: Callable[["MigrationsTestCase", StateApps], None]
) -> Callable[["MigrationsTestCase", StateApps], None]:  # nocoverage
    def method_patched_with_mock(self: "MigrationsTestCase", apps: StateApps) -> None:
        ArchivedAttachment = apps.get_model("zerver", "ArchivedAttachment")
        ArchivedMessage = apps.get_model("zerver", "ArchivedMessage")
        ArchivedUserMessage = apps.get_model("zerver", "ArchivedUserMessage")
        Attachment = apps.get_model("zerver", "Attachment")
        BotConfigData = apps.get_model("zerver", "BotConfigData")
        BotStorageData = apps.get_model("zerver", "BotStorageData")
        Client = apps.get_model("zerver", "Client")
        CustomProfileField = apps.get_model("zerver", "CustomProfileField")
        CustomProfileFieldValue = apps.get_model("zerver", "CustomProfileFieldValue")
        DefaultStream = apps.get_model("zerver", "DefaultStream")
        DefaultStreamGroup = apps.get_model("zerver", "DefaultStreamGroup")
        EmailChangeStatus = apps.get_model("zerver", "EmailChangeStatus")
        Huddle = apps.get_model("zerver", "Huddle")
        Message = apps.get_model("zerver", "Message")
        MultiuseInvite = apps.get_model("zerver", "MultiuseInvite")
        UserTopic = apps.get_model("zerver", "UserTopic")
        PreregistrationUser = apps.get_model("zerver", "PreregistrationUser")
        PushDeviceToken = apps.get_model("zerver", "PushDeviceToken")
        Reaction = apps.get_model("zerver", "Reaction")
        Realm = apps.get_model("zerver", "Realm")
        RealmAuditLog = apps.get_model("zerver", "RealmAuditLog")
        RealmDomain = apps.get_model("zerver", "RealmDomain")
        RealmEmoji = apps.get_model("zerver", "RealmEmoji")
        RealmFilter = apps.get_model("zerver", "RealmFilter")
        Recipient = apps.get_model("zerver", "Recipient")
        Recipient.PERSONAL = 1
        Recipient.STREAM = 2
        Recipient.HUDDLE = 3
        ScheduledEmail = apps.get_model("zerver", "ScheduledEmail")
        ScheduledMessage = apps.get_model("zerver", "ScheduledMessage")
        Service = apps.get_model("zerver", "Service")
        Stream = apps.get_model("zerver", "Stream")
        Subscription = apps.get_model("zerver", "Subscription")
        UserActivity = apps.get_model("zerver", "UserActivity")
        UserActivityInterval = apps.get_model("zerver", "UserActivityInterval")
        UserGroup = apps.get_model("zerver", "UserGroup")
        UserGroupMembership = apps.get_model("zerver", "UserGroupMembership")
        UserHotspot = apps.get_model("zerver", "UserHotspot")
        UserMessage = apps.get_model("zerver", "UserMessage")
        UserPresence = apps.get_model("zerver", "UserPresence")
        UserProfile = apps.get_model("zerver", "UserProfile")

        zerver_models_patch = mock.patch.multiple(
            "zerver.models",
            ArchivedAttachment=ArchivedAttachment,
            ArchivedMessage=ArchivedMessage,
            ArchivedUserMessage=ArchivedUserMessage,
            Attachment=Attachment,
            BotConfigData=BotConfigData,
            BotStorageData=BotStorageData,
            Client=Client,
            CustomProfileField=CustomProfileField,
            CustomProfileFieldValue=CustomProfileFieldValue,
            DefaultStream=DefaultStream,
            DefaultStreamGroup=DefaultStreamGroup,
            EmailChangeStatus=EmailChangeStatus,
            Huddle=Huddle,
            Message=Message,
            MultiuseInvite=MultiuseInvite,
            UserTopic=UserTopic,
            PreregistrationUser=PreregistrationUser,
            PushDeviceToken=PushDeviceToken,
            Reaction=Reaction,
            Realm=Realm,
            RealmAuditLog=RealmAuditLog,
            RealmDomain=RealmDomain,
            RealmEmoji=RealmEmoji,
            RealmFilter=RealmFilter,
            Recipient=Recipient,
            ScheduledEmail=ScheduledEmail,
            ScheduledMessage=ScheduledMessage,
            Service=Service,
            Stream=Stream,
            Subscription=Subscription,
            UserActivity=UserActivity,
            UserActivityInterval=UserActivityInterval,
            UserGroup=UserGroup,
            UserGroupMembership=UserGroupMembership,
            UserHotspot=UserHotspot,
            UserMessage=UserMessage,
            UserPresence=UserPresence,
            UserProfile=UserProfile,
        )
        zerver_test_helpers_patch = mock.patch.multiple(
            "zerver.lib.test_helpers",
            Client=Client,
            Message=Message,
            Subscription=Subscription,
            UserMessage=UserMessage,
            UserProfile=UserProfile,
        )

        zerver_test_classes_patch = mock.patch.multiple(
            "zerver.lib.test_classes",
            Client=Client,
            Message=Message,
            Realm=Realm,
            Recipient=Recipient,
            Stream=Stream,
            Subscription=Subscription,
            UserProfile=UserProfile,
        )

        with zerver_models_patch, zerver_test_helpers_patch, zerver_test_classes_patch:
            method(self, apps)

    return method_patched_with_mock


def create_dummy_file(filename: str) -> str:
    filepath = os.path.join(settings.TEST_WORKER_DIR, filename)
    with open(filepath, "w") as f:
        f.write("zulip!")
    return filepath


def zulip_reaction_info() -> Dict[str, str]:
    return dict(
        emoji_name="zulip",
        emoji_code="zulip",
        reaction_type="zulip_extra_emoji",
    )


@contextmanager
def mock_queue_publish(
    method_to_patch: str,
    **kwargs: object,
) -> Iterator[mock.MagicMock]:
    inner = mock.MagicMock(**kwargs)

    # This helper ensures that events published to the queues are
    # serializable as JSON; unserializable events would make RabbitMQ
    # crash in production.
    def verify_serialize(
        queue_name: str,
        event: Dict[str, object],
        processor: Optional[Callable[[object], None]] = None,
    ) -> None:
        marshalled_event = orjson.loads(orjson.dumps(event))
        assert marshalled_event == event
        inner(queue_name, event, processor)

    with mock.patch(method_to_patch, side_effect=verify_serialize):
        yield inner


def patch_queue_publish(
    method_to_patch: str,
) -> Callable[[Callable[..., None]], Callable[..., None]]:
    def inner(func: Callable[..., None]) -> Callable[..., None]:
        @wraps(func)
        def _wrapped(*args: object, **kwargs: object) -> None:
            with mock_queue_publish(method_to_patch) as m:
                func(*args, m, **kwargs)

        return _wrapped

    return inner
