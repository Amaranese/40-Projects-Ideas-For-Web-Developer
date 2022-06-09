# Settings system

The page documents the Zulip settings system, and hopefully should
help you decide how to correctly implement new settings you're adding
to Zulip.

We have two types of administrative settings in Zulip:

- **Server settings** are set via configuration files, and apply to
  the whole Zulip installation.
- **Realm settings** (or **organization settings**) are usually
  set via the /#organization page in the Zulip web application, and
  apply to a single Zulip realm/organization. (Which, for most Zulip
  servers, is the only realm on the server).

Philosophically, the goals of the settings system are to make it
convenient for:

- Zulip server administrators to configure
  Zulip's feature set for their server without needing to patch Zulip
- Realm administrators to configure settings for their organization
  independently without needing to talk with the server administrator.
- Secrets (passwords, API keys, etc.) to be stored in a separate place
  from shareable configuration.

## Server settings

Zulip uses the [Django settings
system](https://docs.djangoproject.com/en/3.2/topics/settings/), which
means that the settings files are Python programs that set a lot of
variables with all-capital names like `EMAIL_GATEWAY_PATTERN`. You can
access these anywhere in the Zulip Django code using e.g.:

```python
from django.conf import settings
print(settings.EMAIL_GATEWAY_PATTERN)
```

Additionally, if you need to access a Django setting in a shell
script (or just on the command line for debugging), you can use e.g.:

```console
$ ./scripts/get-django-setting EMAIL_GATEWAY_PATTERN
%s@localhost:9991
```

Zulip has separated those settings that we expect a system
administrator to change (with nice documentation) from the ~1000 lines
of settings needed by the Zulip Django app. As a result, there are a
few files involved in the Zulip settings for server administrators.
In a production environment, we have:

- `/etc/zulip/settings.py` (the template is in the Zulip repo at
  `zproject/prod_settings_template.py`) is the main system
  administrator-facing settings file for Zulip. It contains all the
  server-specific settings, such as how to send outgoing email, the
  hostname of the PostgreSQL database, etc., but does not contain any
  secrets (e.g. passwords, secret API keys, cryptographic keys, etc.).
  The way we generally do settings that can be controlled with shell
  access to a Zulip server is to put a default in
  `zproject/default_settings.py`, and then override it here. As this
  is the main documentation for Zulip settings, we recommend that
  production installations [carefully update `/etc/zulip/settings.py`
  every major
  release](../production/upgrade-or-modify.md#updating-settingspy-inline-documentation)
  to pick up new inline documentation.

- `/etc/zulip/zulip-secrets.conf` (generated by
  `scripts/setup/generate_secrets.py` as part of installation)
  contains secrets used by the Zulip installation. These are read
  using the [standard Python
  `RawConfigParser`](https://docs.python.org/3/library/configparser.html#configparser.RawConfigParser),
  and accessed in `zproject/computed_settings.py` by the `get_secret`
  function. All secrets/API keys/etc. used by the Zulip Django
  application should be stored here, and read using the `get_secret`
  function in `zproject/config.py`.

- `zproject/settings.py` is the main Django settings file for Zulip.
  It imports everything from `zproject/configured_settings.py` and
  `zproject/computed_settings.py`.

- `zproject/configured_settings.py` imports everything from
  `zproject/default_settings.py`, then in a prod environment imports
  `/etc/zulip/settings.py` via a symlink.

- `zproject/default_settings.py` has the default values for the settings the
  user would set in `/etc/zulip/settings.py`.

- `zproject/computed_settings.py` contains all the settings that are
  constant for all Zulip installations or computed as a function of
  `zproject/configured_settings.py` (e.g. configuration for logging,
  static assets, middleware, etc.).

In a development environment, we have `zproject/settings.py`, and
additionally:

- `zproject/dev_settings.py` has the custom settings for the Zulip development
  environment; these are set after importing `prod_settings_template.py`.

- `zproject/dev-secrets.conf` replaces
  `/etc/zulip/zulip-secrets.conf`, and is not tracked by Git. This
  allows you to configure your development environment to support
  features like [authentication
  options](../development/authentication.md) that require secrets to
  work. It is also used to set certain settings that in production
  belong in `/etc/zulip/settings.py`, e.g. `SOCIAL_AUTH_GITHUB_KEY`.
  You can see a full list with `git grep development_only=True`, or
  add additional settings of this form if needed.

- `zproject/test_settings.py` imports everything from
  `zproject/settings.py` and `zproject/test_extra_settings.py`.

- `zproject/test_extra_settings.py` has the (default) settings used
  for the Zulip tests (both backend and Puppeteer), which are applied on
  top of the development environment settings.

When adding a new server setting to Zulip, you will typically add it
in two or three places:

- `zproject/default_settings.py`, with a default value
  for production environments.

- If the settings has a secret key,
  you'll add a `get_secret` call in `zproject/computed_settings.py` (and the
  user will add the value when they configure the feature).

- In an appropriate section of `zproject/prod_settings_template.py`,
  with documentation in the comments explaining the setting's
  purpose and effect.

- Possibly also `zproject/dev_settings.py` and/or
  `zproject/test_settings.py`, if the desired value of the setting for
  Zulip development and/or test environments is different from the
  default for production.

Most settings should be enabled in the development environment, to
maximize convenience of testing all of Zulip's features; they should
be enabled by default in production if we expect most Zulip sites to
want those settings.

### Testing non-default settings

You can write tests for settings using e.g.
`with self.settings(TERMS_OF_SERVICE=None)`. However, this only works
for settings which are checked at runtime, not settings which are only
accessed in initialization of Django (or Zulip) internals
(e.g. `DATABASES`). See the [Django docs on overriding settings in
tests][django-test-settings] for more details.

[django-test-settings]: https://docs.djangoproject.com/en/3.2/topics/testing/tools/#overriding-settings

## Realm settings

Realm settings are preferred for any configuration that is a matter of
organizational policy (as opposed to technical capabilities of the
server). As a result, configuration options for user-facing
functionality is almost always added as a new realm setting, not a
server setting. The [new feature tutorial][doc-newfeat] documents the
process for adding a new realm setting to Zulip.

So for example, the following server settings will eventually be
replaced with realm settings:

- `NAME_CHANGES_DISABLED`
- `INLINE_IMAGE_PREVIEW`
- `ENABLE_GRAVATAR`
- Which authentication methods are allowed should probably appear in
  both places; in server settings indicating the capabilities of the
  server, and in the realm settings indicating which methods the realm
  administrator wants to allow users to log in with.

[doc-newfeat]: ../tutorials/new-feature-tutorial.md