import unittest
from datetime import date

from wem.providers import ecb
from wem.steps.verify import build_report, report_to_json


def country(iso3, **metrics):
    return {"iso3": iso3, "metrics": metrics}


class VerifyReportTest(unittest.TestCase):
    YIELDS = {"DEU": {"2026-08": 3.185, "2026-10": 3.416},
              "ITA": {"2026-08": 3.986, "2026-10": 4.68},
              "ESP": {"2026-07": 3.534, "2026-10": 4.066}}
    BONDS = {"countries": {
        "ITA": {"date": "2026-08", "source": {"name": "OECD via FRED"}, "points": [{"months": 120, "yield": 3.986}]},
        "DEU": {"date": "2026-10-19", "source": {"name": "Bundesbank"}, "points": [{"months": 120, "yield": 3.49}]},
    }}

    def report(self, snap, yields=YIELDS, hicp=None, dfr=("2026-09-16", 2.5)):
        return build_report(snap, self.BONDS, yields, hicp, dfr, date(2026, 11, 25))

    def test_matching_values_pass_and_stale_ones_are_flagged(self):
        snap = {"countries": [
            country("DEU", policy_rate={"value": 2.5, "period": "2026-11"},
                    euro_spread_bund={"value": 0.0, "period": "2026-10"}),
            country("ITA", euro_spread_bund={"value": 126.4, "period": "2026-10"}),
            country("ESP", euro_spread_bund={"value": 35.0, "period": "2026-08"}),  # stale month
        ]}
        text, issues = self.report(snap)
        self.assertIn("| DEU | 2.50 | 2026-11 | 2.50 | 2026-09-16 | OK |", text)
        self.assertIn("| ITA | 126.4 | 2026-10 | 126.4 | 2026-10 | OK |", text)
        self.assertIn("| ESP | 35.0 | 2026-08 | 65.0 | 2026-10 | DESACTUALIZADO |", text)
        # The bond layer's Italian value matches Eurostat for August but lags two months.
        self.assertIn("DESFASADO 2 meses", text)
        self.assertGreater(issues, 0)

    def test_missing_source_is_reported_not_counted(self):
        snap = {"countries": [country("DEU", policy_rate={"value": 2.5, "period": "2026-11"})]}
        text, _ = self.report(snap, yields=None, dfr=None)
        self.assertIn("fuente no disponible", text)

    def test_inflation_compares_the_same_month_with_a_tolerance(self):
        snap = {"countries": [country("ESP", inflation={"value": 3.1, "period": "2026-09"}),
                              country("ITA", inflation={"value": 4.0, "period": "2026-09"})]}
        text, _ = self.report(snap, hicp={"ESP": {"2026-09": 3.0}, "ITA": {"2026-09": 2.0}})
        self.assertIn("| ESP | 3.10 | 2026-09 | 3.00 | 0.10 | OK |", text)
        self.assertIn("| ITA | 4.00 | 2026-09 | 2.00 | 2.00 | REVISAR |", text)


class ReportJsonTest(VerifyReportTest):
    def test_json_has_one_section_per_check_with_its_table(self):
        snap = {"countries": [country("DEU", policy_rate={"value": 2.5, "period": "2026-11"},
                                      euro_spread_bund={"value": 0.0, "period": "2026-10"})]}
        text, issues = self.report(snap)
        data = report_to_json(text, date(2026, 11, 25), issues)
        self.assertEqual(data["generatedAt"], "2026-11-25")
        self.assertEqual(len(data["sections"]), 4)
        first = data["sections"][0]
        self.assertIn("BCE", first["title"])
        self.assertEqual(first["columns"][0], "País")
        self.assertEqual(first["rows"][0][:2], ["DEU", "2.50"])
        self.assertIn("https://data.ecb.europa.eu", first["notes"][0])
        self.assertTrue(all(len(r) == len(s["columns"]) for s in data["sections"] for r in s["rows"]))


class EcbParserTest(unittest.TestCase):
    def test_latest_row_wins_and_empty_values_are_skipped(self):
        text = "KEY,TIME_PERIOD,OBS_VALUE\nX,2026-06-11,2.0\nX,2026-09-16,2.5\nX,2026-10-01,\n"
        self.assertEqual(ecb.parse_latest(text), ("2026-09-16", 2.5))
        self.assertIsNone(ecb.parse_latest("KEY,TIME_PERIOD,OBS_VALUE\n"))
