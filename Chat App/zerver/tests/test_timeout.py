import time
import traceback

from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.timeout import TimeoutExpired, timeout


class TimeoutTestCase(ZulipTestCase):
    # We can't use assertRaises because that doesn't store the
    # traceback, which we want to verify

    def something_exceptional(self) -> int:
        raise ValueError("Something went wrong")

    def sleep_x_seconds_y_times(self, x: float, y: int) -> int:
        for i in range(y):
            time.sleep(x)
        return 42  # nocoverage

    def test_timeout_returns(self) -> None:
        ret = timeout(1, lambda: 42)
        self.assertEqual(ret, 42)

    def test_timeout_exceeded(self) -> None:
        try:
            timeout(1, lambda: self.sleep_x_seconds_y_times(0.1, 50))
            raise AssertionError("Failed to raise a timeout")
        except TimeoutExpired as exc:
            tb = traceback.format_tb(exc.__traceback__)
            self.assertIn("in sleep_x_seconds_y_times", tb[-1])
            self.assertIn("time.sleep(x)", tb[-1])

    def test_timeout_raises(self) -> None:
        try:
            timeout(1, lambda: self.something_exceptional())
            raise AssertionError("Failed to raise an exception")
        except ValueError as exc:
            tb = traceback.format_tb(exc.__traceback__)
            self.assertIn("in something_exceptional", tb[-1])
            self.assertIn("raise ValueError", tb[-1])

    def test_timeout_warn(self) -> None:
        # If the sleep is long enough, it will outlast the attempts to
        # kill it
        with self.assertLogs(level="WARNING") as m:
            try:
                timeout(1, lambda: self.sleep_x_seconds_y_times(5, 1))
                raise AssertionError("Failed to raise a timeout")
            except TimeoutExpired as exc:
                tb = traceback.format_tb(exc.__traceback__)
                self.assertNotIn("in sleep_x_seconds_y_times", tb[-1])
                self.assertIn("raise TimeoutExpired", tb[-1])
        self.assertEqual(m.output, ["WARNING:root:Failed to time out backend thread"])
