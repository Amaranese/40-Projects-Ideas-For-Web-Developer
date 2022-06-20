from argparse import ArgumentParser
from typing import Any

from zerver.lib.management import ZulipBaseCommand
from zerver.lib.sessions import (
    delete_all_deactivated_user_sessions,
    delete_all_user_sessions,
    delete_realm_user_sessions,
)


class Command(ZulipBaseCommand):
    help = """\
Log out all users from active browser sessions.

Does not disable API keys, and thus will not log users out of the
mobile apps.
"""

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--deactivated-only",
            action="store_true",
            help="Only log out all users who are deactivated",
        )
        self.add_realm_args(parser, help="Only log out all users in a particular realm")

    def handle(self, *args: Any, **options: Any) -> None:
        realm = self.get_realm(options)
        if realm:
            delete_realm_user_sessions(realm)
        elif options["deactivated_only"]:
            delete_all_deactivated_user_sessions()
        else:
            delete_all_user_sessions()
