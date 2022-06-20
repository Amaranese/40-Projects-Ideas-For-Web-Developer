import cProfile
import logging
import time
import traceback
from typing import (
    Any,
    AnyStr,
    Callable,
    Dict,
    Iterable,
    Iterator,
    List,
    MutableMapping,
    Optional,
    Tuple,
)
from urllib.parse import urlencode

from django.conf import settings
from django.conf.urls.i18n import is_language_prefix_patterns_used
from django.db import connection
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect, StreamingHttpResponse
from django.http.response import HttpResponseBase
from django.middleware.common import CommonMiddleware
from django.middleware.locale import LocaleMiddleware as DjangoLocaleMiddleware
from django.shortcuts import render
from django.utils import translation
from django.utils.cache import patch_vary_headers
from django.utils.deprecation import MiddlewareMixin
from django.utils.translation import gettext as _
from django.views.csrf import csrf_failure as html_csrf_failure
from django_scim.middleware import SCIMAuthCheckMiddleware
from django_scim.settings import scim_settings
from sentry_sdk import capture_exception
from sentry_sdk.integrations.logging import ignore_logger

from zerver.lib.cache import get_remote_cache_requests, get_remote_cache_time
from zerver.lib.db import reset_queries
from zerver.lib.debug import maybe_tracemalloc_listen
from zerver.lib.exceptions import ErrorCode, JsonableError, MissingAuthenticationError
from zerver.lib.html_to_text import get_content_description
from zerver.lib.markdown import get_markdown_requests, get_markdown_time
from zerver.lib.rate_limiter import RateLimitResult
from zerver.lib.request import REQ, RequestNotes, has_request_variables, set_request, unset_request
from zerver.lib.response import (
    AsynchronousResponse,
    json_response,
    json_response_from_error,
    json_unauthorized,
)
from zerver.lib.subdomains import get_subdomain
from zerver.lib.types import ViewFuncT
from zerver.lib.user_agent import parse_user_agent
from zerver.lib.utils import statsd
from zerver.models import Realm, SCIMClient, flush_per_request_caches, get_realm

logger = logging.getLogger("zulip.requests")
slow_query_logger = logging.getLogger("zulip.slow_queries")


def record_request_stop_data(log_data: MutableMapping[str, Any]) -> None:
    log_data["time_stopped"] = time.time()
    log_data["remote_cache_time_stopped"] = get_remote_cache_time()
    log_data["remote_cache_requests_stopped"] = get_remote_cache_requests()
    log_data["markdown_time_stopped"] = get_markdown_time()
    log_data["markdown_requests_stopped"] = get_markdown_requests()
    if settings.PROFILE_ALL_REQUESTS:
        log_data["prof"].disable()


def async_request_timer_stop(request: HttpRequest) -> None:
    log_data = RequestNotes.get_notes(request).log_data
    assert log_data is not None
    record_request_stop_data(log_data)


def record_request_restart_data(log_data: MutableMapping[str, Any]) -> None:
    if settings.PROFILE_ALL_REQUESTS:
        log_data["prof"].enable()
    log_data["time_restarted"] = time.time()
    log_data["remote_cache_time_restarted"] = get_remote_cache_time()
    log_data["remote_cache_requests_restarted"] = get_remote_cache_requests()
    log_data["markdown_time_restarted"] = get_markdown_time()
    log_data["markdown_requests_restarted"] = get_markdown_requests()


def async_request_timer_restart(request: HttpRequest) -> None:
    log_data = RequestNotes.get_notes(request).log_data
    assert log_data is not None
    if "time_restarted" in log_data:
        # Don't destroy data when being called from
        # finish_current_handler
        return
    record_request_restart_data(log_data)


def record_request_start_data(log_data: MutableMapping[str, Any]) -> None:
    if settings.PROFILE_ALL_REQUESTS:
        log_data["prof"] = cProfile.Profile()
        log_data["prof"].enable()

    reset_queries()
    log_data["time_started"] = time.time()
    log_data["remote_cache_time_start"] = get_remote_cache_time()
    log_data["remote_cache_requests_start"] = get_remote_cache_requests()
    log_data["markdown_time_start"] = get_markdown_time()
    log_data["markdown_requests_start"] = get_markdown_requests()


def timedelta_ms(timedelta: float) -> float:
    return timedelta * 1000


def format_timedelta(timedelta: float) -> str:
    if timedelta >= 1:
        return f"{timedelta:.1f}s"
    return f"{timedelta_ms(timedelta):.0f}ms"


def is_slow_query(time_delta: float, path: str) -> bool:
    if time_delta < 1.2:
        return False
    is_exempt = (
        path in ["/activity", "/json/report/error", "/api/v1/deployments/report_error"]
        or path.startswith("/realm_activity/")
        or path.startswith("/user_activity/")
    )
    if is_exempt:
        return time_delta >= 5
    if "webathena_kerberos" in path:
        return time_delta >= 10
    return True


statsd_blacklisted_requests = [
    "do_confirm",
    "signup_send_confirm",
    "new_realm_send_confirm",
    "eventslast_event_id",
    "webreq.content",
    "avatar",
    "user_uploads",
    "password.reset",
    "static",
    "json.bots",
    "json.users",
    "json.streams",
    "accounts.unsubscribe",
    "apple-touch-icon",
    "emoji",
    "json.bots",
    "upload_file",
    "realm_activity",
    "user_activity",
]


def write_log_line(
    log_data: MutableMapping[str, Any],
    path: str,
    method: str,
    remote_ip: str,
    requestor_for_logs: str,
    client_name: str,
    client_version: Optional[str] = None,
    status_code: int = 200,
    error_content: Optional[AnyStr] = None,
    error_content_iter: Optional[Iterable[AnyStr]] = None,
) -> None:
    assert error_content is None or error_content_iter is None
    if error_content is not None:
        error_content_iter = (error_content,)

    if settings.STATSD_HOST != "":
        # For statsd timer name
        if path == "/":
            statsd_path = "webreq"
        else:
            statsd_path = "webreq.{}".format(path[1:].replace("/", "."))
            # Remove non-ascii chars from path (there should be none; if there are, it's
            # because someone manually entered a nonexistent path), as UTF-8 chars make
            # statsd sad when it sends the key name over the socket
            statsd_path = statsd_path.encode("ascii", errors="ignore").decode("ascii")
        # TODO: This could probably be optimized to use a regular expression rather than a loop.
        suppress_statsd = any(
            blacklisted in statsd_path for blacklisted in statsd_blacklisted_requests
        )
    else:
        suppress_statsd = True
        statsd_path = ""

    time_delta = -1
    # A time duration of -1 means the StartLogRequests middleware
    # didn't run for some reason
    optional_orig_delta = ""
    if "time_started" in log_data:
        time_delta = time.time() - log_data["time_started"]
    if "time_stopped" in log_data:
        orig_time_delta = time_delta
        time_delta = (log_data["time_stopped"] - log_data["time_started"]) + (
            time.time() - log_data["time_restarted"]
        )
        optional_orig_delta = f" (lp: {format_timedelta(orig_time_delta)})"
    remote_cache_output = ""
    if "remote_cache_time_start" in log_data:
        remote_cache_time_delta = get_remote_cache_time() - log_data["remote_cache_time_start"]
        remote_cache_count_delta = (
            get_remote_cache_requests() - log_data["remote_cache_requests_start"]
        )
        if "remote_cache_requests_stopped" in log_data:
            # (now - restarted) + (stopped - start) = (now - start) + (stopped - restarted)
            remote_cache_time_delta += (
                log_data["remote_cache_time_stopped"] - log_data["remote_cache_time_restarted"]
            )
            remote_cache_count_delta += (
                log_data["remote_cache_requests_stopped"]
                - log_data["remote_cache_requests_restarted"]
            )

        if remote_cache_time_delta > 0.005:
            remote_cache_output = (
                f" (mem: {format_timedelta(remote_cache_time_delta)}/{remote_cache_count_delta})"
            )

        if not suppress_statsd:
            statsd.timing(f"{statsd_path}.remote_cache.time", timedelta_ms(remote_cache_time_delta))
            statsd.incr(f"{statsd_path}.remote_cache.querycount", remote_cache_count_delta)

    startup_output = ""
    if "startup_time_delta" in log_data and log_data["startup_time_delta"] > 0.005:
        startup_output = " (+start: {})".format(format_timedelta(log_data["startup_time_delta"]))

    markdown_output = ""
    if "markdown_time_start" in log_data:
        markdown_time_delta = get_markdown_time() - log_data["markdown_time_start"]
        markdown_count_delta = get_markdown_requests() - log_data["markdown_requests_start"]
        if "markdown_requests_stopped" in log_data:
            # (now - restarted) + (stopped - start) = (now - start) + (stopped - restarted)
            markdown_time_delta += (
                log_data["markdown_time_stopped"] - log_data["markdown_time_restarted"]
            )
            markdown_count_delta += (
                log_data["markdown_requests_stopped"] - log_data["markdown_requests_restarted"]
            )

        if markdown_time_delta > 0.005:
            markdown_output = (
                f" (md: {format_timedelta(markdown_time_delta)}/{markdown_count_delta})"
            )

            if not suppress_statsd:
                statsd.timing(f"{statsd_path}.markdown.time", timedelta_ms(markdown_time_delta))
                statsd.incr(f"{statsd_path}.markdown.count", markdown_count_delta)

    # Get the amount of time spent doing database queries
    db_time_output = ""
    queries = connection.connection.queries if connection.connection is not None else []
    if len(queries) > 0:
        query_time = sum(float(query.get("time", 0)) for query in queries)
        db_time_output = f" (db: {format_timedelta(query_time)}/{len(queries)}q)"

        if not suppress_statsd:
            # Log ms, db ms, and num queries to statsd
            statsd.timing(f"{statsd_path}.dbtime", timedelta_ms(query_time))
            statsd.incr(f"{statsd_path}.dbq", len(queries))
            statsd.timing(f"{statsd_path}.total", timedelta_ms(time_delta))

    if "extra" in log_data:
        extra_request_data = " {}".format(log_data["extra"])
    else:
        extra_request_data = ""
    if client_version is None:
        logger_client = f"({requestor_for_logs} via {client_name})"
    else:
        logger_client = f"({requestor_for_logs} via {client_name}/{client_version})"
    logger_timing = f"{format_timedelta(time_delta):>5}{optional_orig_delta}{remote_cache_output}{markdown_output}{db_time_output}{startup_output} {path}"
    logger_line = f"{remote_ip:<15} {method:<7} {status_code:3} {logger_timing}{extra_request_data} {logger_client}"
    if status_code in [200, 304] and method == "GET" and path.startswith("/static"):
        logger.debug(logger_line)
    else:
        logger.info(logger_line)

    if is_slow_query(time_delta, path):
        slow_query_logger.info(logger_line)

    if settings.PROFILE_ALL_REQUESTS:
        log_data["prof"].disable()
        profile_path = "/tmp/profile.data.{}.{}".format(path.split("/")[-1], int(time_delta * 1000))
        log_data["prof"].dump_stats(profile_path)

    # Log some additional data whenever we return certain 40x errors
    if 400 <= status_code < 500 and status_code not in [401, 404, 405]:
        assert error_content_iter is not None
        error_content_list = list(error_content_iter)
        if not error_content_list:
            error_data = ""
        elif isinstance(error_content_list[0], str):
            error_data = "".join(error_content_list)
        elif isinstance(error_content_list[0], bytes):
            error_data = repr(b"".join(error_content_list))
        if len(error_data) > 200:
            error_data = "[content more than 200 characters]"
        logger.info("status=%3d, data=%s, uid=%s", status_code, error_data, requestor_for_logs)


class RequestContext(MiddlewareMixin):
    def __call__(self, request: HttpRequest) -> HttpResponse:
        set_request(request)
        try:
            return self.get_response(request)
        finally:
            unset_request()


# We take advantage of `has_request_variables` being called multiple times
# when processing a request in order to process any `client` parameter that
# may have been sent in the request content.
@has_request_variables
def parse_client(
    request: HttpRequest,
    # As `client` is a common element to all API endpoints, we choose
    # not to document on every endpoint's individual parameters.
    req_client: Optional[str] = REQ("client", default=None, intentionally_undocumented=True),
) -> Tuple[str, Optional[str]]:
    # If the API request specified a client in the request content,
    # that has priority. Otherwise, extract the client from the
    # USER_AGENT.
    if req_client is not None:
        return req_client, None
    if "User-Agent" in request.headers:
        user_agent: Optional[Dict[str, str]] = parse_user_agent(request.headers["User-Agent"])
    else:
        user_agent = None
    if user_agent is None:
        # In the future, we will require setting USER_AGENT, but for
        # now we just want to tag these requests so we can review them
        # in logs and figure out the extent of the problem
        return "Unspecified", None

    client_name = user_agent["name"]
    if client_name.startswith("Zulip"):
        return client_name, user_agent.get("version")

    # We could show browser versions in logs, and it'd probably be a
    # good idea, but the current parsing will just get you Mozilla/5.0.
    #
    # Fixing this probably means using a third-party library, and
    # making sure it's fast enough that we're happy to do it even on
    # hot-path cases.
    return client_name, None


class LogRequests(MiddlewareMixin):
    # We primarily are doing logging using the process_view hook, but
    # for some views, process_view isn't run, so we call the start
    # method here too
    def process_request(self, request: HttpRequest) -> None:
        maybe_tracemalloc_listen()
        request_notes = RequestNotes.get_notes(request)

        if request_notes.log_data is not None:
            # Sanity check to ensure this is being called from the
            # Tornado code path that returns responses asynchronously.
            assert request_notes.saved_response is not None

            # Avoid re-initializing request_notes.log_data if it's already there.
            return

        try:
            request_notes.client_name, request_notes.client_version = parse_client(request)
        except JsonableError as e:
            logging.exception(e)
            request_notes.client_name = "Unparsable"
            request_notes.client_version = None

        request_notes.log_data = {}
        record_request_start_data(request_notes.log_data)

    def process_view(
        self,
        request: HttpRequest,
        view_func: ViewFuncT,
        args: List[str],
        kwargs: Dict[str, Any],
    ) -> None:
        request_notes = RequestNotes.get_notes(request)
        if request_notes.saved_response is not None:
            # The below logging adjustments are unnecessary (because
            # we've already imported everything) and incorrect
            # (because they'll overwrite data from pre-long-poll
            # request processing) when returning a saved response.
            return

        # process_request was already run; we save the initialization
        # time (i.e. the time between receiving the request and
        # figuring out which view function to call, which is primarily
        # importing modules on the first start)
        assert request_notes.log_data is not None
        request_notes.log_data["startup_time_delta"] = (
            time.time() - request_notes.log_data["time_started"]
        )
        # And then completely reset our tracking to only cover work
        # done as part of this request
        record_request_start_data(request_notes.log_data)

    def process_response(
        self, request: HttpRequest, response: HttpResponseBase
    ) -> HttpResponseBase:
        if isinstance(response, AsynchronousResponse):
            # This special AsynchronousResponse sentinel is
            # discarded after going through this code path as Tornado
            # intends to block, so we stop here to avoid unnecessary work.
            return response

        remote_ip = request.META["REMOTE_ADDR"]

        # Get the requestor's identifier and client, if available.
        request_notes = RequestNotes.get_notes(request)
        requestor_for_logs = request_notes.requestor_for_logs
        if requestor_for_logs is None:
            # Note that request.user is a Union[RemoteZulipServer, UserProfile, AnonymousUser],
            # if it is present.
            if hasattr(request, "user") and hasattr(request.user, "format_requestor_for_logs"):
                requestor_for_logs = request.user.format_requestor_for_logs()
            else:
                requestor_for_logs = "unauth@{}".format(get_subdomain(request) or "root")

        if response.streaming:
            assert isinstance(response, StreamingHttpResponse)
            content_iter: Optional[Iterator[bytes]] = response.streaming_content
            content = None
        else:
            content = response.content
            content_iter = None

        assert request_notes.client_name is not None and request_notes.log_data is not None
        write_log_line(
            request_notes.log_data,
            request.path,
            request.method,
            remote_ip,
            requestor_for_logs,
            request_notes.client_name,
            client_version=request_notes.client_version,
            status_code=response.status_code,
            error_content=content,
            error_content_iter=content_iter,
        )
        return response


class JsonErrorHandler(MiddlewareMixin):
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        super().__init__(get_response)
        ignore_logger("zerver.middleware.json_error_handler")

    def process_exception(
        self, request: HttpRequest, exception: Exception
    ) -> Optional[HttpResponse]:
        if isinstance(exception, MissingAuthenticationError):
            if "text/html" in request.headers.get("Accept", ""):
                # If this looks like a request from a top-level page in a
                # browser, send the user to the login page.
                #
                # TODO: The next part is a bit questionable; it will
                # execute the likely intent for intentionally visiting
                # an API endpoint without authentication in a browser,
                # but that's an unlikely to be done intentionally often.
                return HttpResponseRedirect(
                    f"{settings.HOME_NOT_LOGGED_IN}?{urlencode({'next': request.path})}"
                )
            if request.path.startswith("/api"):
                # For API routes, ask for HTTP basic auth (email:apiKey).
                return json_unauthorized()
            else:
                # For /json routes, ask for session authentication.
                return json_unauthorized(www_authenticate="session")

        if isinstance(exception, JsonableError):
            return json_response_from_error(exception)
        if RequestNotes.get_notes(request).error_format == "JSON":
            capture_exception(exception)
            json_error_logger = logging.getLogger("zerver.middleware.json_error_handler")
            json_error_logger.error(traceback.format_exc(), extra=dict(request=request))
            return json_response(res_type="error", msg=_("Internal server error"), status=500)
        return None


class TagRequests(MiddlewareMixin):
    def process_view(
        self, request: HttpRequest, view_func: ViewFuncT, args: List[str], kwargs: Dict[str, Any]
    ) -> None:
        self.process_request(request)

    def process_request(self, request: HttpRequest) -> None:
        if request.path.startswith("/api/") or request.path.startswith("/json/"):
            RequestNotes.get_notes(request).error_format = "JSON"
        else:
            RequestNotes.get_notes(request).error_format = "HTML"


class CsrfFailureError(JsonableError):
    http_status_code = 403
    code = ErrorCode.CSRF_FAILED
    data_fields = ["reason"]

    def __init__(self, reason: str) -> None:
        self.reason: str = reason

    @staticmethod
    def msg_format() -> str:
        return _("CSRF error: {reason}")


def csrf_failure(request: HttpRequest, reason: str = "") -> HttpResponse:
    if RequestNotes.get_notes(request).error_format == "JSON":
        return json_response_from_error(CsrfFailureError(reason))
    else:
        return html_csrf_failure(request, reason)


class LocaleMiddleware(DjangoLocaleMiddleware):
    def process_response(
        self, request: HttpRequest, response: HttpResponseBase
    ) -> HttpResponseBase:

        # This is the same as the default LocaleMiddleware, minus the
        # logic that redirects 404's that lack a prefixed language in
        # the path into having a language.  See
        # https://code.djangoproject.com/ticket/32005
        language = translation.get_language()
        language_from_path = translation.get_language_from_path(request.path_info)
        urlconf = getattr(request, "urlconf", settings.ROOT_URLCONF)
        i18n_patterns_used, _ = is_language_prefix_patterns_used(urlconf)
        if not (i18n_patterns_used and language_from_path):
            patch_vary_headers(response, ("Accept-Language",))
        assert language is not None
        response.setdefault("Content-Language", language)

        # An additional responsibility of our override of this middleware is to save the user's language
        # preference in a cookie. That determination is made by code handling the request
        # and saved in the set_language flag so that it can be used here.
        set_language = RequestNotes.get_notes(request).set_language
        if set_language is not None:
            response.set_cookie(settings.LANGUAGE_COOKIE_NAME, set_language)

        return response


class RateLimitMiddleware(MiddlewareMixin):
    def set_response_headers(
        self, response: HttpResponse, rate_limit_results: List[RateLimitResult]
    ) -> None:
        # The limit on the action that was requested is the minimum of the limits that get applied:
        limit = min(result.entity.max_api_calls() for result in rate_limit_results)
        response["X-RateLimit-Limit"] = str(limit)
        # Same principle applies to remaining API calls:
        remaining_api_calls = min(result.remaining for result in rate_limit_results)
        response["X-RateLimit-Remaining"] = str(remaining_api_calls)

        # The full reset time is the maximum of the reset times for the limits that get applied:
        reset_time = time.time() + max(result.secs_to_freedom for result in rate_limit_results)
        response["X-RateLimit-Reset"] = str(int(reset_time))

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        if not settings.RATE_LIMITING:
            return response

        # Add X-RateLimit-*** headers
        ratelimits_applied = RequestNotes.get_notes(request).ratelimits_applied
        if len(ratelimits_applied) > 0:
            self.set_response_headers(response, ratelimits_applied)

        return response


class FlushDisplayRecipientCache(MiddlewareMixin):
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        # We flush the per-request caches after every request, so they
        # are not shared at all between requests.
        flush_per_request_caches()
        return response


class HostDomainMiddleware(MiddlewareMixin):
    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        # Match against ALLOWED_HOSTS, which is rather permissive;
        # failure will raise DisallowedHost, which is a 400.
        request.get_host()

        # This check is important to avoid doing the extra work of
        # `get_realm` (which does a database query that could be
        # problematic for Tornado).  Also the error page below is only
        # appropriate for a page visited in a browser, not the API.
        #
        # API authentication will end up checking for an invalid
        # realm, and throw a JSON-format error if appropriate.
        if request.path.startswith(("/static/", "/api/", "/json/")):
            return None

        subdomain = get_subdomain(request)
        if subdomain == settings.SOCIAL_AUTH_SUBDOMAIN:
            # Realms are not supposed to exist on SOCIAL_AUTH_SUBDOMAIN.
            return None

        request_notes = RequestNotes.get_notes(request)
        try:
            request_notes.realm = get_realm(subdomain)
            request_notes.has_fetched_realm = True
        except Realm.DoesNotExist:
            if subdomain == Realm.SUBDOMAIN_FOR_ROOT_DOMAIN:
                # The root domain is used for creating new
                # organizations even if it does not host a realm.
                return None

            return render(request, "zerver/invalid_realm.html", status=404)

        return None


class SetRemoteAddrFromRealIpHeader(MiddlewareMixin):
    """Middleware that sets REMOTE_ADDR based on the X-Real-Ip header.

    This middleware is similar to Django's old
    SetRemoteAddrFromForwardedFor middleware.  We use X-Real-Ip, and
    not X-Forwarded-For, because the latter is a list of proxies, some
    number of which are trusted by us, and some of which could be
    arbitrarily set by the user.  nginx has already parsed which are
    which, and has set X-Real-Ip to the first one, going right to
    left, which is untrusted.

    Since we are always deployed behind nginx, we can trust the
    X-Real-Ip which is so set.  In development, we fall back to the
    REMOTE_ADDR supplied by the server.

    """

    def process_request(self, request: HttpRequest) -> None:
        try:
            real_ip = request.headers["X-Real-IP"]
        except KeyError:
            pass
        else:
            request.META["REMOTE_ADDR"] = real_ip


def alter_content(request: HttpRequest, content: bytes) -> bytes:
    first_paragraph_text = get_content_description(content, request)
    placeholder_open_graph_description = RequestNotes.get_notes(
        request
    ).placeholder_open_graph_description
    assert placeholder_open_graph_description is not None
    return content.replace(
        placeholder_open_graph_description.encode(),
        first_paragraph_text.encode(),
    )


class FinalizeOpenGraphDescription(MiddlewareMixin):
    def process_response(
        self, request: HttpRequest, response: StreamingHttpResponse
    ) -> StreamingHttpResponse:

        if RequestNotes.get_notes(request).placeholder_open_graph_description is not None:
            assert not response.streaming
            response.content = alter_content(request, response.content)
        return response


class ZulipCommonMiddleware(CommonMiddleware):
    """
    Patched version of CommonMiddleware to disable the APPEND_SLASH
    redirect behavior inside Tornado.

    While this has some correctness benefit in encouraging clients
    to implement the API correctly, this also saves about 600us in
    the runtime of every GET /events query, as the APPEND_SLASH
    route resolution logic is surprisingly expensive.

    TODO: We should probably extend this behavior to apply to all of
    our API routes.  The APPEND_SLASH behavior is really only useful
    for non-API endpoints things like /login.  But doing that
    transition will require more careful testing.
    """

    def should_redirect_with_slash(self, request: HttpRequest) -> bool:
        if settings.RUNNING_INSIDE_TORNADO:
            return False
        return super().should_redirect_with_slash(request)


def validate_scim_bearer_token(request: HttpRequest) -> Optional[SCIMClient]:
    """
    This function verifies the request is allowed to make SCIM requests on this subdomain,
    by checking the provided bearer token and ensuring it matches a scim client configured
    for this subdomain in settings.SCIM_CONFIG.
    If successful, returns the corresponding SCIMClient object. Returns None otherwise.
    """

    subdomain = get_subdomain(request)
    scim_config_dict = settings.SCIM_CONFIG.get(subdomain)
    if not scim_config_dict:
        return None

    valid_bearer_token = scim_config_dict.get("bearer_token")
    scim_client_name = scim_config_dict.get("scim_client_name")
    # We really don't want a misconfiguration where this is unset,
    # allowing free access to the SCIM API:
    assert valid_bearer_token
    assert scim_client_name

    if request.headers.get("Authorization") != f"Bearer {valid_bearer_token}":
        return None

    request_notes = RequestNotes.get_notes(request)
    assert request_notes.realm

    # While API authentication code paths are sufficiently high
    # traffic that we prefer to use a cache, SCIM is much lower
    # traffic, and doing a database query is plenty fast.
    return SCIMClient.objects.get(realm=request_notes.realm, name=scim_client_name)


class ZulipSCIMAuthCheckMiddleware(SCIMAuthCheckMiddleware):
    """
    Overridden version of middleware implemented in django-scim2
    (https://github.com/15five/django-scim2/blob/master/src/django_scim/middleware.py)
    to also handle authenticating the client.
    """

    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        # This determines whether this is a SCIM request based on the request's path
        # and if it is, logs request information, including the body, as well as the response
        # for debugging purposes to the `django_scim.middleware` logger, at DEBUG level.
        # We keep those logs in /var/log/zulip/scim.log
        if self.should_log_request(request):
            self.log_request(request)

        # Here we verify the request is indeed to a SCIM endpoint. That's ensured
        # by comparing the path with self.reverse_url, which is the root SCIM path /scim/b2/.
        # Of course we don't want to proceed with authenticating the request for SCIM
        # if a non-SCIM endpoint is being queried.
        if not request.path.startswith(self.reverse_url):
            return None

        scim_client = validate_scim_bearer_token(request)
        if not scim_client:
            response = HttpResponse(status=401)
            response["WWW-Authenticate"] = scim_settings.WWW_AUTHENTICATE_HEADER
            return response

        # The client has been successfully authenticated for SCIM on this subdomain,
        # so we can assign the corresponding SCIMClient object to request.user - which
        # will allow this request to pass request.user.is_authenticated checks from now on,
        # to be served by the relevant views implemented in django-scim2.
        request.user = scim_client
        return None
