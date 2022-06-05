import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple, Type, Union, cast

from django.conf import settings
from django.db.models.query import QuerySet
from django.http import HttpRequest, HttpResponse, HttpResponseNotFound
from django.shortcuts import render
from django.utils import translation
from django.utils.timezone import now as timezone_now
from django.utils.translation import gettext as _

from analytics.lib.counts import COUNT_STATS, CountStat
from analytics.lib.time_utils import time_range
from analytics.models import (
    BaseCount,
    InstallationCount,
    RealmCount,
    StreamCount,
    UserCount,
    installation_epoch,
)
from zerver.decorator import (
    require_non_guest_user,
    require_server_admin,
    require_server_admin_api,
    to_utc_datetime,
    zulip_login_required,
)
from zerver.lib.exceptions import JsonableError
from zerver.lib.i18n import get_and_set_request_language, get_language_translation_data
from zerver.lib.request import REQ, has_request_variables
from zerver.lib.response import json_success
from zerver.lib.timestamp import convert_to_UTC
from zerver.lib.validator import to_non_negative_int
from zerver.models import Client, Realm, UserProfile, get_realm

if settings.ZILENCER_ENABLED:
    from zilencer.models import RemoteInstallationCount, RemoteRealmCount, RemoteZulipServer

MAX_TIME_FOR_FULL_ANALYTICS_GENERATION = timedelta(days=1, minutes=30)


def is_analytics_ready(realm: Realm) -> bool:
    return (timezone_now() - realm.date_created) > MAX_TIME_FOR_FULL_ANALYTICS_GENERATION


def render_stats(
    request: HttpRequest,
    data_url_suffix: str,
    target_name: str,
    for_installation: bool = False,
    remote: bool = False,
    analytics_ready: bool = True,
) -> HttpResponse:
    assert request.user.is_authenticated
    page_params = dict(
        data_url_suffix=data_url_suffix,
        for_installation=for_installation,
        remote=remote,
    )

    request_language = get_and_set_request_language(
        request,
        request.user.default_language,
        translation.get_language_from_path(request.path_info),
    )

    page_params["translation_data"] = get_language_translation_data(request_language)

    return render(
        request,
        "analytics/stats.html",
        context=dict(
            target_name=target_name, page_params=page_params, analytics_ready=analytics_ready
        ),
    )


@zulip_login_required
def stats(request: HttpRequest) -> HttpResponse:
    assert request.user.is_authenticated
    realm = request.user.realm
    if request.user.is_guest:
        # TODO: Make @zulip_login_required pass the UserProfile so we
        # can use @require_member_or_admin
        raise JsonableError(_("Not allowed for guest users"))
    return render_stats(
        request, "", realm.name or realm.string_id, analytics_ready=is_analytics_ready(realm)
    )


@require_server_admin
@has_request_variables
def stats_for_realm(request: HttpRequest, realm_str: str) -> HttpResponse:
    try:
        realm = get_realm(realm_str)
    except Realm.DoesNotExist:
        return HttpResponseNotFound()

    return render_stats(
        request,
        f"/realm/{realm_str}",
        realm.name or realm.string_id,
        analytics_ready=is_analytics_ready(realm),
    )


@require_server_admin
@has_request_variables
def stats_for_remote_realm(
    request: HttpRequest, remote_server_id: int, remote_realm_id: int
) -> HttpResponse:
    assert settings.ZILENCER_ENABLED
    server = RemoteZulipServer.objects.get(id=remote_server_id)
    return render_stats(
        request,
        f"/remote/{server.id}/realm/{remote_realm_id}",
        f"Realm {remote_realm_id} on server {server.hostname}",
    )


@require_server_admin_api
@has_request_variables
def get_chart_data_for_realm(
    request: HttpRequest, user_profile: UserProfile, realm_str: str, **kwargs: Any
) -> HttpResponse:
    try:
        realm = get_realm(realm_str)
    except Realm.DoesNotExist:
        raise JsonableError(_("Invalid organization"))

    return get_chart_data(request=request, user_profile=user_profile, realm=realm, **kwargs)


@require_server_admin_api
@has_request_variables
def get_chart_data_for_remote_realm(
    request: HttpRequest,
    user_profile: UserProfile,
    remote_server_id: int,
    remote_realm_id: int,
    **kwargs: Any,
) -> HttpResponse:
    assert settings.ZILENCER_ENABLED
    server = RemoteZulipServer.objects.get(id=remote_server_id)
    return get_chart_data(
        request=request,
        user_profile=user_profile,
        server=server,
        remote=True,
        remote_realm_id=int(remote_realm_id),
        **kwargs,
    )


@require_server_admin
def stats_for_installation(request: HttpRequest) -> HttpResponse:
    return render_stats(request, "/installation", "installation", True)


@require_server_admin
def stats_for_remote_installation(request: HttpRequest, remote_server_id: int) -> HttpResponse:
    assert settings.ZILENCER_ENABLED
    server = RemoteZulipServer.objects.get(id=remote_server_id)
    return render_stats(
        request,
        f"/remote/{server.id}/installation",
        f"remote installation {server.hostname}",
        True,
        True,
    )


@require_server_admin_api
@has_request_variables
def get_chart_data_for_installation(
    request: HttpRequest, user_profile: UserProfile, chart_name: str = REQ(), **kwargs: Any
) -> HttpResponse:
    return get_chart_data(
        request=request, user_profile=user_profile, for_installation=True, **kwargs
    )


@require_server_admin_api
@has_request_variables
def get_chart_data_for_remote_installation(
    request: HttpRequest,
    user_profile: UserProfile,
    remote_server_id: int,
    chart_name: str = REQ(),
    **kwargs: Any,
) -> HttpResponse:
    assert settings.ZILENCER_ENABLED
    server = RemoteZulipServer.objects.get(id=remote_server_id)
    return get_chart_data(
        request=request,
        user_profile=user_profile,
        for_installation=True,
        remote=True,
        server=server,
        **kwargs,
    )


@require_non_guest_user
@has_request_variables
def get_chart_data(
    request: HttpRequest,
    user_profile: UserProfile,
    chart_name: str = REQ(),
    min_length: Optional[int] = REQ(converter=to_non_negative_int, default=None),
    start: Optional[datetime] = REQ(converter=to_utc_datetime, default=None),
    end: Optional[datetime] = REQ(converter=to_utc_datetime, default=None),
    realm: Optional[Realm] = None,
    for_installation: bool = False,
    remote: bool = False,
    remote_realm_id: Optional[int] = None,
    server: Optional["RemoteZulipServer"] = None,
) -> HttpResponse:
    TableType = Union[
        Type["RemoteInstallationCount"],
        Type[InstallationCount],
        Type["RemoteRealmCount"],
        Type[RealmCount],
    ]
    if for_installation:
        if remote:
            assert settings.ZILENCER_ENABLED
            aggregate_table: TableType = RemoteInstallationCount
            assert server is not None
        else:
            aggregate_table = InstallationCount
    else:
        if remote:
            assert settings.ZILENCER_ENABLED
            aggregate_table = RemoteRealmCount
            assert server is not None
            assert remote_realm_id is not None
        else:
            aggregate_table = RealmCount

    tables: Union[Tuple[TableType], Tuple[TableType, Type[UserCount]]]

    if chart_name == "number_of_humans":
        stats = [
            COUNT_STATS["1day_actives::day"],
            COUNT_STATS["realm_active_humans::day"],
            COUNT_STATS["active_users_audit:is_bot:day"],
        ]
        tables = (aggregate_table,)
        subgroup_to_label: Dict[CountStat, Dict[Optional[str], str]] = {
            stats[0]: {None: "_1day"},
            stats[1]: {None: "_15day"},
            stats[2]: {"false": "all_time"},
        }
        labels_sort_function = None
        include_empty_subgroups = True
    elif chart_name == "messages_sent_over_time":
        stats = [COUNT_STATS["messages_sent:is_bot:hour"]]
        tables = (aggregate_table, UserCount)
        subgroup_to_label = {stats[0]: {"false": "human", "true": "bot"}}
        labels_sort_function = None
        include_empty_subgroups = True
    elif chart_name == "messages_sent_by_message_type":
        stats = [COUNT_STATS["messages_sent:message_type:day"]]
        tables = (aggregate_table, UserCount)
        subgroup_to_label = {
            stats[0]: {
                "public_stream": _("Public streams"),
                "private_stream": _("Private streams"),
                "private_message": _("Private messages"),
                "huddle_message": _("Group private messages"),
            }
        }
        labels_sort_function = lambda data: sort_by_totals(data["everyone"])
        include_empty_subgroups = True
    elif chart_name == "messages_sent_by_client":
        stats = [COUNT_STATS["messages_sent:client:day"]]
        tables = (aggregate_table, UserCount)
        # Note that the labels are further re-written by client_label_map
        subgroup_to_label = {
            stats[0]: {str(id): name for id, name in Client.objects.values_list("id", "name")}
        }
        labels_sort_function = sort_client_labels
        include_empty_subgroups = False
    elif chart_name == "messages_read_over_time":
        stats = [COUNT_STATS["messages_read::hour"]]
        tables = (aggregate_table, UserCount)
        subgroup_to_label = {stats[0]: {None: "read"}}
        labels_sort_function = None
        include_empty_subgroups = True
    else:
        raise JsonableError(_("Unknown chart name: {}").format(chart_name))

    # Most likely someone using our API endpoint. The /stats page does not
    # pass a start or end in its requests.
    if start is not None:
        start = convert_to_UTC(start)
    if end is not None:
        end = convert_to_UTC(end)
    if start is not None and end is not None and start > end:
        raise JsonableError(
            _("Start time is later than end time. Start: {start}, End: {end}").format(
                start=start,
                end=end,
            )
        )

    if realm is None:
        # Note that this value is invalid for Remote tables; be
        # careful not to access it in those code paths.
        realm = user_profile.realm

    if remote:
        # For remote servers, we don't have fillstate data, and thus
        # should simply use the first and last data points for the
        # table.
        assert server is not None
        assert aggregate_table is RemoteInstallationCount or aggregate_table is RemoteRealmCount
        aggregate_table_remote = cast(
            Union[Type[RemoteInstallationCount], Type[RemoteRealmCount]], aggregate_table
        )  # https://stackoverflow.com/questions/68540528/mypy-assertions-on-the-types-of-types
        if not aggregate_table_remote.objects.filter(server=server).exists():
            raise JsonableError(
                _("No analytics data available. Please contact your server administrator.")
            )
        if start is None:
            first = aggregate_table_remote.objects.filter(server=server).first()
            assert first is not None
            start = first.end_time
        if end is None:
            last = aggregate_table_remote.objects.filter(server=server).last()
            assert last is not None
            end = last.end_time
    else:
        # Otherwise, we can use tables on the current server to
        # determine a nice range, and some additional validation.
        if start is None:
            if for_installation:
                start = installation_epoch()
            else:
                start = realm.date_created
        if end is None:
            end = max(
                stat.last_successful_fill() or datetime.min.replace(tzinfo=timezone.utc)
                for stat in stats
            )

        if start > end and (timezone_now() - start > MAX_TIME_FOR_FULL_ANALYTICS_GENERATION):
            logging.warning(
                "User from realm %s attempted to access /stats, but the computed "
                "start time: %s (creation of realm or installation) is later than the computed "
                "end time: %s (last successful analytics update). Is the "
                "analytics cron job running?",
                realm.string_id,
                start,
                end,
            )
            raise JsonableError(
                _("No analytics data available. Please contact your server administrator.")
            )

    assert len({stat.frequency for stat in stats}) == 1
    end_times = time_range(start, end, stats[0].frequency, min_length)
    data: Dict[str, Any] = {
        "end_times": [int(end_time.timestamp()) for end_time in end_times],
        "frequency": stats[0].frequency,
    }

    aggregation_level = {
        InstallationCount: "everyone",
        RealmCount: "everyone",
        UserCount: "user",
    }
    if settings.ZILENCER_ENABLED:
        aggregation_level[RemoteInstallationCount] = "everyone"
        aggregation_level[RemoteRealmCount] = "everyone"

    # -1 is a placeholder value, since there is no relevant filtering on InstallationCount
    id_value = {
        InstallationCount: -1,
        RealmCount: realm.id,
        UserCount: user_profile.id,
    }
    if settings.ZILENCER_ENABLED:
        if server is not None:
            id_value[RemoteInstallationCount] = server.id
        # TODO: RemoteRealmCount logic doesn't correctly handle
        # filtering by server_id as well.
        if remote_realm_id is not None:
            id_value[RemoteRealmCount] = remote_realm_id

    for table in tables:
        data[aggregation_level[table]] = {}
        for stat in stats:
            data[aggregation_level[table]].update(
                get_time_series_by_subgroup(
                    stat,
                    table,
                    id_value[table],
                    end_times,
                    subgroup_to_label[stat],
                    include_empty_subgroups,
                )
            )

    if labels_sort_function is not None:
        data["display_order"] = labels_sort_function(data)
    else:
        data["display_order"] = None
    return json_success(request, data=data)


def sort_by_totals(value_arrays: Dict[str, List[int]]) -> List[str]:
    totals = [(sum(values), label) for label, values in value_arrays.items()]
    totals.sort(reverse=True)
    return [label for total, label in totals]


# For any given user, we want to show a fixed set of clients in the chart,
# regardless of the time aggregation or whether we're looking at realm or
# user data. This fixed set ideally includes the clients most important in
# understanding the realm's traffic and the user's traffic. This function
# tries to rank the clients so that taking the first N elements of the
# sorted list has a reasonable chance of doing so.
def sort_client_labels(data: Dict[str, Dict[str, List[int]]]) -> List[str]:
    realm_order = sort_by_totals(data["everyone"])
    user_order = sort_by_totals(data["user"])
    label_sort_values: Dict[str, float] = {}
    for i, label in enumerate(realm_order):
        label_sort_values[label] = i
    for i, label in enumerate(user_order):
        label_sort_values[label] = min(i - 0.1, label_sort_values.get(label, i))
    return [label for label, sort_value in sorted(label_sort_values.items(), key=lambda x: x[1])]


def table_filtered_to_id(table: Type[BaseCount], key_id: int) -> QuerySet:
    if table == RealmCount:
        return RealmCount.objects.filter(realm_id=key_id)
    elif table == UserCount:
        return UserCount.objects.filter(user_id=key_id)
    elif table == StreamCount:
        return StreamCount.objects.filter(stream_id=key_id)
    elif table == InstallationCount:
        return InstallationCount.objects.all()
    elif settings.ZILENCER_ENABLED and table == RemoteInstallationCount:
        return RemoteInstallationCount.objects.filter(server_id=key_id)
    elif settings.ZILENCER_ENABLED and table == RemoteRealmCount:
        return RemoteRealmCount.objects.filter(realm_id=key_id)
    else:
        raise AssertionError(f"Unknown table: {table}")


def client_label_map(name: str) -> str:
    if name == "website":
        return "Web app"
    if name.startswith("desktop app"):
        return "Old desktop app"
    if name == "ZulipElectron":
        return "Desktop app"
    if name == "ZulipTerminal":
        return "Terminal app"
    if name == "ZulipAndroid":
        return "Old Android app"
    if name == "ZulipiOS":
        return "Old iOS app"
    if name == "ZulipMobile":
        return "Mobile app"
    if name in ["ZulipPython", "API: Python"]:
        return "Python API"
    if name.startswith("Zulip") and name.endswith("Webhook"):
        return name[len("Zulip") : -len("Webhook")] + " webhook"
    return name


def rewrite_client_arrays(value_arrays: Dict[str, List[int]]) -> Dict[str, List[int]]:
    mapped_arrays: Dict[str, List[int]] = {}
    for label, array in value_arrays.items():
        mapped_label = client_label_map(label)
        if mapped_label in mapped_arrays:
            for i in range(0, len(array)):
                mapped_arrays[mapped_label][i] += value_arrays[label][i]
        else:
            mapped_arrays[mapped_label] = [value_arrays[label][i] for i in range(0, len(array))]
    return mapped_arrays


def get_time_series_by_subgroup(
    stat: CountStat,
    table: Type[BaseCount],
    key_id: int,
    end_times: List[datetime],
    subgroup_to_label: Dict[Optional[str], str],
    include_empty_subgroups: bool,
) -> Dict[str, List[int]]:
    queryset = (
        table_filtered_to_id(table, key_id)
        .filter(property=stat.property)
        .values_list("subgroup", "end_time", "value")
    )
    value_dicts: Dict[Optional[str], Dict[datetime, int]] = defaultdict(lambda: defaultdict(int))
    for subgroup, end_time, value in queryset:
        value_dicts[subgroup][end_time] = value
    value_arrays = {}
    for subgroup, label in subgroup_to_label.items():
        if (subgroup in value_dicts) or include_empty_subgroups:
            value_arrays[label] = [value_dicts[subgroup][end_time] for end_time in end_times]

    if stat == COUNT_STATS["messages_sent:client:day"]:
        # HACK: We rewrite these arrays to collapse the Client objects
        # with similar names into a single sum, and generally give
        # them better names
        return rewrite_client_arrays(value_arrays)
    return value_arrays
