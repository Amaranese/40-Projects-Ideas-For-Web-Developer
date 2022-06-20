import threading
import weakref
from collections import defaultdict
from dataclasses import dataclass, field
from functools import wraps
from types import FunctionType
from typing import (
    Any,
    Callable,
    Dict,
    Generic,
    List,
    Literal,
    MutableMapping,
    Optional,
    Sequence,
    Set,
    TypeVar,
    Union,
    cast,
    overload,
)

import orjson
from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponse
from django.utils.translation import gettext as _

import zerver.lib.rate_limiter as rate_limiter
import zerver.tornado.handlers as handlers
from zerver.lib.exceptions import ErrorCode, InvalidJSONError, JsonableError
from zerver.lib.notes import BaseNotes
from zerver.lib.types import Validator, ViewFuncT
from zerver.lib.validator import check_anything
from zerver.models import Client, Realm


@dataclass
class RequestNotes(BaseNotes[HttpRequest, "RequestNotes"]):
    """This class contains extra metadata that Zulip associated with a
    Django HttpRequest object. See the docstring for BaseNotes for
    details on how it works.

    Note that most Optional fields will be definitely not None once
    middleware has run. In the future, we may want to express that in
    the types by having different types EarlyRequestNotes and
    post-middleware RequestNotes types, but for now we have a lot
    of `assert request_notes.foo is not None` when accessing them.
    """

    client: Optional[Client] = None
    client_name: Optional[str] = None
    client_version: Optional[str] = None
    log_data: Optional[MutableMapping[str, Any]] = None
    rate_limit: Optional[str] = None
    requestor_for_logs: Optional[str] = None
    # We use realm_cached to indicate whether the realm is cached or not.
    # Because the default value of realm is None, which can indicate "unset"
    # and "nonexistence" at the same time.
    realm: Optional[Realm] = None
    has_fetched_realm: bool = False
    set_language: Optional[str] = None
    ratelimits_applied: List["rate_limiter.RateLimitResult"] = field(default_factory=lambda: [])
    query: Optional[str] = None
    error_format: Optional[str] = None
    placeholder_open_graph_description: Optional[str] = None
    saved_response: Optional[HttpResponse] = None
    # tornado_handler is a weak reference to work around a memory leak
    # in WeakKeyDictionary (https://bugs.python.org/issue44680).
    tornado_handler: Optional["weakref.ReferenceType[handlers.AsyncDjangoHandler]"] = None
    processed_parameters: Set[str] = field(default_factory=set)
    ignored_parameters: Set[str] = field(default_factory=set)

    @classmethod
    def init_notes(cls) -> "RequestNotes":
        return RequestNotes()


class RequestConfusingParmsError(JsonableError):
    code = ErrorCode.REQUEST_CONFUSING_VAR
    data_fields = ["var_name1", "var_name2"]

    def __init__(self, var_name1: str, var_name2: str) -> None:
        self.var_name1: str = var_name1
        self.var_name2: str = var_name2

    @staticmethod
    def msg_format() -> str:
        return _("Can't decide between '{var_name1}' and '{var_name2}' arguments")


class RequestVariableMissingError(JsonableError):
    code = ErrorCode.REQUEST_VARIABLE_MISSING
    data_fields = ["var_name"]

    def __init__(self, var_name: str) -> None:
        self.var_name: str = var_name

    @staticmethod
    def msg_format() -> str:
        return _("Missing '{var_name}' argument")


class RequestVariableConversionError(JsonableError):
    code = ErrorCode.REQUEST_VARIABLE_INVALID
    data_fields = ["var_name", "bad_value"]

    def __init__(self, var_name: str, bad_value: Any) -> None:
        self.var_name: str = var_name
        self.bad_value = bad_value

    @staticmethod
    def msg_format() -> str:
        return _("Bad value for '{var_name}': {bad_value}")


# Used in conjunction with @has_request_variables, below
ResultT = TypeVar("ResultT")


class _REQ(Generic[ResultT]):
    # NotSpecified is a sentinel value for determining whether a
    # default value was specified for a request variable.  We can't
    # use None because that could be a valid, user-specified default
    class _NotSpecified:
        pass

    NotSpecified = _NotSpecified()

    def __init__(
        self,
        whence: Optional[str] = None,
        *,
        converter: Optional[Callable[[str, str], ResultT]] = None,
        default: Union[_NotSpecified, ResultT, None] = NotSpecified,
        json_validator: Optional[Validator[ResultT]] = None,
        str_validator: Optional[Validator[ResultT]] = None,
        argument_type: Optional[str] = None,
        intentionally_undocumented: bool = False,
        documentation_pending: bool = False,
        aliases: Sequence[str] = [],
        path_only: bool = False,
    ) -> None:
        """whence: the name of the request variable that should be used
        for this parameter.  Defaults to a request variable of the
        same name as the parameter.

        converter: a function that takes a string and returns a new
        value.  If specified, this will be called on the request
        variable value before passing to the function

        default: a value to be used for the argument if the parameter
        is missing in the request

        json_validator: similar to converter, but takes an already
        parsed JSON data structure.  If specified, we will parse the
        JSON request variable value before passing to the function

        str_validator: Like json_validator, but doesn't parse JSON
        first.

        argument_type: pass 'body' to extract the parsed JSON
        corresponding to the request body

        aliases: alternate names for the POST var

        path_only: Used for parameters included in the URL that we still want
        to validate via REQ's hooks.

        """

        if argument_type == "body" and converter is None and json_validator is None:
            # legacy behavior
            json_validator = cast(Callable[[str, object], ResultT], check_anything)

        self.post_var_name = whence
        self.func_var_name: Optional[str] = None
        self.converter = converter
        self.json_validator = json_validator
        self.str_validator = str_validator
        self.default = default
        self.argument_type = argument_type
        self.aliases = aliases
        self.intentionally_undocumented = intentionally_undocumented
        self.documentation_pending = documentation_pending
        self.path_only = path_only

        assert converter is None or (
            json_validator is None and str_validator is None
        ), "converter and json_validator are mutually exclusive"
        assert (
            json_validator is None or str_validator is None
        ), "json_validator and str_validator are mutually exclusive"


# This factory function ensures that mypy can correctly analyze REQ.
#
# Note that REQ claims to return a type matching that of the parameter
# of which it is the default value, allowing type checking of view
# functions using has_request_variables. In reality, REQ returns an
# instance of class _REQ to enable the decorator to scan the parameter
# list for _REQ objects and patch the parameters as the true types.
#
# See also this documentation to learn how @overload helps here.
# https://zulip.readthedocs.io/en/latest/testing/mypy.html#using-overload-to-accurately-describe-variations
#
# Overload 1: converter
@overload
def REQ(
    whence: Optional[str] = ...,
    *,
    converter: Callable[[str, str], ResultT],
    default: ResultT = ...,
    argument_type: Optional[Literal["body"]] = ...,
    intentionally_undocumented: bool = ...,
    documentation_pending: bool = ...,
    aliases: Sequence[str] = ...,
    path_only: bool = ...,
) -> ResultT:
    ...


# Overload 2: json_validator
@overload
def REQ(
    whence: Optional[str] = ...,
    *,
    default: ResultT = ...,
    json_validator: Validator[ResultT],
    argument_type: Optional[Literal["body"]] = ...,
    intentionally_undocumented: bool = ...,
    documentation_pending: bool = ...,
    aliases: Sequence[str] = ...,
    path_only: bool = ...,
) -> ResultT:
    ...


# Overload 3: no converter/json_validator, default: str or unspecified, argument_type=None
@overload
def REQ(
    whence: Optional[str] = ...,
    *,
    default: str = ...,
    str_validator: Optional[Validator[str]] = ...,
    intentionally_undocumented: bool = ...,
    documentation_pending: bool = ...,
    aliases: Sequence[str] = ...,
    path_only: bool = ...,
) -> str:
    ...


# Overload 4: no converter/validator, default=None, argument_type=None
@overload
def REQ(
    whence: Optional[str] = ...,
    *,
    default: None,
    str_validator: Optional[Validator[str]] = ...,
    intentionally_undocumented: bool = ...,
    documentation_pending: bool = ...,
    aliases: Sequence[str] = ...,
    path_only: bool = ...,
) -> Optional[str]:
    ...


# Overload 5: argument_type="body"
@overload
def REQ(
    whence: Optional[str] = ...,
    *,
    default: ResultT = ...,
    argument_type: Literal["body"],
    intentionally_undocumented: bool = ...,
    documentation_pending: bool = ...,
    aliases: Sequence[str] = ...,
    path_only: bool = ...,
) -> ResultT:
    ...


# Implementation
def REQ(
    whence: Optional[str] = None,
    *,
    converter: Optional[Callable[[str, str], ResultT]] = None,
    default: Union[_REQ._NotSpecified, ResultT] = _REQ.NotSpecified,
    json_validator: Optional[Validator[ResultT]] = None,
    str_validator: Optional[Validator[ResultT]] = None,
    argument_type: Optional[str] = None,
    intentionally_undocumented: bool = False,
    documentation_pending: bool = False,
    aliases: Sequence[str] = [],
    path_only: bool = False,
) -> ResultT:
    return cast(
        ResultT,
        _REQ(
            whence,
            converter=converter,
            default=default,
            json_validator=json_validator,
            str_validator=str_validator,
            argument_type=argument_type,
            intentionally_undocumented=intentionally_undocumented,
            documentation_pending=documentation_pending,
            aliases=aliases,
            path_only=path_only,
        ),
    )


arguments_map: Dict[str, List[str]] = defaultdict(list)

# Extracts variables from the request object and passes them as
# named function arguments.  The request object must be the first
# argument to the function.
#
# To use, assign a function parameter a default value that is an
# instance of the _REQ class.  That parameter will then be automatically
# populated from the HTTP request.  The request object must be the
# first argument to the decorated function.
#
# This should generally be the innermost (syntactically bottommost)
# decorator applied to a view, since other decorators won't preserve
# the default parameter values used by has_request_variables.
#
# Note that this can't be used in helper functions which are not
# expected to call json_success or raise JsonableError, as it uses JsonableError
# internally when it encounters an error
def has_request_variables(view_func: ViewFuncT) -> ViewFuncT:
    num_params = view_func.__code__.co_argcount
    default_param_values = cast(FunctionType, view_func).__defaults__
    if default_param_values is None:
        default_param_values = ()
    num_default_params = len(default_param_values)
    default_param_names = view_func.__code__.co_varnames[num_params - num_default_params :]

    post_params = []

    view_func_full_name = ".".join([view_func.__module__, view_func.__name__])

    for (name, value) in zip(default_param_names, default_param_values):
        if isinstance(value, _REQ):
            value.func_var_name = name
            if value.post_var_name is None:
                value.post_var_name = name
            post_params.append(value)

            # Record arguments that should be documented so that our
            # automated OpenAPI docs tests can compare these against the code.
            if (
                not value.intentionally_undocumented
                and not value.documentation_pending
                and not value.path_only
            ):
                arguments_map[view_func_full_name].append(value.post_var_name)

    @wraps(view_func)
    def _wrapped_view_func(request: HttpRequest, *args: object, **kwargs: object) -> HttpResponse:
        request_notes = RequestNotes.get_notes(request)
        for param in post_params:
            func_var_name = param.func_var_name
            if param.path_only:
                # For path_only parameters, they should already have
                # been passed via the URL, so there's no need for REQ
                # to do anything.
                #
                # TODO: Either run validators for path_only parameters
                # or don't declare them using REQ.
                assert func_var_name in kwargs
            if func_var_name in kwargs:
                continue
            assert func_var_name is not None

            post_var_name: Optional[str]

            if param.argument_type == "body":
                post_var_name = "request"
                try:
                    val = request.body.decode(request.encoding or "utf-8")
                except UnicodeDecodeError:
                    raise JsonableError(_("Malformed payload"))
            else:
                # This is a view bug, not a user error, and thus should throw a 500.
                assert param.argument_type is None, "Invalid argument type"

                post_var_names = [param.post_var_name]
                post_var_names += param.aliases
                post_var_name = None

                for req_var in post_var_names:
                    assert req_var is not None
                    if req_var in request.POST:
                        val = request.POST[req_var]
                        request_notes.processed_parameters.add(req_var)
                    elif req_var in request.GET:
                        val = request.GET[req_var]
                        request_notes.processed_parameters.add(req_var)
                    else:
                        # This is covered by test_REQ_aliases, but coverage.py
                        # fails to recognize this for some reason.
                        continue  # nocoverage
                    if post_var_name is not None:
                        raise RequestConfusingParmsError(post_var_name, req_var)
                    post_var_name = req_var

                if post_var_name is None:
                    post_var_name = param.post_var_name
                    assert post_var_name is not None
                    if param.default is _REQ.NotSpecified:
                        raise RequestVariableMissingError(post_var_name)
                    kwargs[func_var_name] = param.default
                    continue

            if param.converter is not None:
                try:
                    val = param.converter(post_var_name, val)
                except JsonableError:
                    raise
                except Exception:
                    raise RequestVariableConversionError(post_var_name, val)

            # json_validator is like converter, but doesn't handle JSON parsing; we do.
            if param.json_validator is not None:
                try:
                    val = orjson.loads(val)
                except orjson.JSONDecodeError:
                    if param.argument_type == "body":
                        raise InvalidJSONError(_("Malformed JSON"))
                    raise JsonableError(_('Argument "{}" is not valid JSON.').format(post_var_name))

                try:
                    val = param.json_validator(post_var_name, val)
                except ValidationError as error:
                    raise JsonableError(error.message)

            # str_validators is like json_validator, but for direct strings (no JSON parsing).
            if param.str_validator is not None:
                try:
                    val = param.str_validator(post_var_name, val)
                except ValidationError as error:
                    raise JsonableError(error.message)

            kwargs[func_var_name] = val

        return view_func(request, *args, **kwargs)

    return cast(ViewFuncT, _wrapped_view_func)  # https://github.com/python/mypy/issues/1927


local = threading.local()


def get_current_request() -> Optional[HttpRequest]:
    """Returns the current HttpRequest object; this should only be used by
    logging frameworks, which have no other access to the current
    request.  All other codepaths should pass through the current
    request object, rather than rely on this thread-local global.

    """
    return getattr(local, "request", None)


def set_request(req: HttpRequest) -> None:
    setattr(local, "request", req)


def unset_request() -> None:
    if hasattr(local, "request"):
        delattr(local, "request")
