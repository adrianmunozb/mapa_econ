import unittest

import build_bonds


def record(date, months=(120,)):
    return {"date": date, "points": [{"months": m, "yield": 3.0} for m in months]}


class RefreshProvidersTest(unittest.TestCase):
    def test_fresher_month_replaces_and_older_never_does(self):
        previous = {"ITA": record("2026-08"), "DEU": record("2026-11-25", (24, 120))}
        providers = [
            ("eurostat", lambda: {"ITA": record("2026-10"), "DEU": record("2026-10")}),
            ("stale", lambda: {"ITA": record("2026-09")}),
        ]
        countries, warnings = build_bonds.refresh_providers(previous, providers)
        self.assertEqual(countries["ITA"]["date"], "2026-10")
        self.assertEqual(countries["DEU"]["date"], "2026-11-25")  # curve kept over a 10Y point
        self.assertEqual(warnings, [])

    def test_a_failing_provider_keeps_previous_records(self):
        def broken():
            raise RuntimeError("HTTP 403")
        countries, warnings = build_bonds.refresh_providers({"NZL": record("2026-10-19")}, [("rbnz", broken)])
        self.assertEqual(countries["NZL"]["date"], "2026-10-19")
        self.assertEqual(warnings, ["rbnz: HTTP 403"])
