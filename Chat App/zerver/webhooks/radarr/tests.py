from zerver.lib.test_classes import WebhookTestCase


class RadarrHookTests(WebhookTestCase):
    STREAM_NAME = "radarr"
    URL_TEMPLATE = "/api/v1/external/radarr?api_key={api_key}&stream={stream}"
    WEBHOOK_DIR_NAME = "radarr"

    def test_radarr_test(self) -> None:
        """
        Tests if radarr test payload is handled correctly
        """
        expected_topic = "Radarr - Test"
        expected_message = "Radarr webhook has been successfully configured."
        self.check_webhook("radarr_test", expected_topic, expected_message)

    def test_radarr_health_check_warning(self) -> None:
        """
        Tests if radarr health check warning payload is handled correctly
        """
        expected_topic = "Health warning"
        expected_message = "No download client is available."
        self.check_webhook("radarr_health_check_warning", expected_topic, expected_message)

    def test_radarr_health_check_error(self) -> None:
        """
        Tests if radarr health check error payload is handled correctly
        """
        expected_topic = "Health error"
        expected_message = "Movie Gotham City Sirens (tmdbid 416649) was removed from TMDb."
        self.check_webhook("radarr_health_check_error", expected_topic, expected_message)

    def test_radarr_movie_renamed(self) -> None:
        """
        Tests if radarr movie renamed payload is handled correctly
        """
        expected_topic = "Marley & Me"
        expected_message = "The movie Marley & Me has been renamed."
        self.check_webhook("radarr_movie_renamed", expected_topic, expected_message)

    def test_radarr_movie_imported(self) -> None:
        """
        Tests if radarr movie imported payload is handled correctly
        """
        expected_topic = "Batman v Superman: Dawn of Justice"
        expected_message = "The movie Batman v Superman: Dawn of Justice has been imported."
        self.check_webhook("radarr_movie_imported", expected_topic, expected_message)

    def test_radarr_movie_imported_upgrade(self) -> None:
        """
        Tests if radarr movie imported upgrade payload is handled correctly
        """
        expected_topic = "Greenland"
        expected_message = "The movie Greenland has been upgraded from WEBRip-720p to WEBRip-1080p."
        self.check_webhook("radarr_movie_imported_upgrade", expected_topic, expected_message)

    def test_radarr_movie_grabbed(self) -> None:
        """
        Tests if radarr movie grabbed payload is handled correctly
        """
        expected_topic = "Greenland"
        expected_message = "The movie Greenland has been grabbed."
        self.check_webhook("radarr_movie_grabbed", expected_topic, expected_message)
