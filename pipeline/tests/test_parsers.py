import unittest

from wem.providers import bis, comtrade, eurostat, imf, natural_earth, worldbank
from wem.providers.imf_datamapper import ImfDataMapperClient, parse_series
from wem.providers.registry import ProviderPool
from wem.catalog import ALL_METRICS
from wem.regions.boundaries import index_shapes
from wem.regions.matcher import match_country
from wem.regions.names import normalize, normalize_admin_name
from wem.steps.current import real_policy_rates
from wem.steps.trade import top_partners


class WorldBankParsersTest(unittest.TestCase):
    def test_countries_drop_aggregates(self):
        rows = [
            {"id": "DEU", "iso2Code": "DE", "name": "Germany", "region": {"id": "ECS", "value": "Europe"}, "incomeLevel": {"value": "High"}},
            {"id": "WLD", "iso2Code": "1W", "name": "World", "region": {"id": "NA", "value": "Aggregates"}, "incomeLevel": {"value": "x"}},
        ]
        self.assertEqual(list(worldbank.parse_countries(rows)), ["DEU"])

    def test_latest_picks_newest_non_null_year(self):
        rows = [
            {"countryiso3code": "DEU", "date": "2024", "value": None},
            {"countryiso3code": "DEU", "date": "2023", "value": 1.5},
            {"countryiso3code": "DEU", "date": "2022", "value": 9.0},
            {"countryiso3code": "", "date": "2023", "value": 3.0},
        ]
        self.assertEqual(worldbank.parse_latest(rows), {"DEU": {"value": 1.5, "year": 2023}})

    def test_history_is_sparse(self):
        rows = [{"countryiso3code": "DEU", "date": "2020", "value": 2.0}, {"countryiso3code": "DEU", "date": "2021", "value": None}]
        self.assertEqual(worldbank.parse_history(rows), {"DEU": {2020: 2.0}})


class ImfDataMapperTest(unittest.TestCase):
    ROOT = {"values": {"X": {
        "USA": {"2022": 1.0, "2023": 2.0, "2024": None, "2029": 9.0, "bad": 5.0},
        "UVK": {"2020": 3.0},
        "NAN": {"2020": float("nan")},
    }}}

    def test_parse_series_drops_nulls_nan_and_bad_years_and_maps_kosovo(self):
        out = parse_series(self.ROOT, "X")
        self.assertEqual(out["USA"], {2022: 1.0, 2023: 2.0, 2029: 9.0})
        self.assertIn("XKX", out)
        self.assertNotIn("NAN", out)

    def test_latest_excludes_forecast_years(self):
        client = ImfDataMapperClient.__new__(ImfDataMapperClient)
        client._max_year = 2024
        client._series = lambda code: parse_series(self.ROOT, code)
        self.assertEqual(client.latest("X")["USA"], {"value": 2.0, "year": 2023})
        self.assertEqual(client.history("X", 2020, 2023)["USA"], {2022: 1.0, 2023: 2.0})


class CatalogTest(unittest.TestCase):
    def test_ids_codes_and_providers_are_consistent(self):
        ids = [m.id for m in ALL_METRICS]
        self.assertEqual(len(ids), len(set(ids)))
        for m in ALL_METRICS:
            self.assertTrue(m.indicator_code and m.label and m.label_en and m.description_en, m.id)
            self.assertIn(m.format, {"currency", "number", "percent", "years", "index"}, m.id)
            self.assertIn(m.domain, {"economy", "health", "social", "demographics", "environment", "infrastructure", "trade", "governance"}, m.id)
        pool = ProviderPool(http=None)
        for name in {m.provider for m in ALL_METRICS}:
            self.assertTrue(pool.get(name).source.name)
        with self.assertRaises(KeyError):
            pool.get("nope")


class NaturalEarthTest(unittest.TestCase):
    def test_iso3_ladder_and_kosovo_override(self):
        self.assertEqual(natural_earth.resolve_iso3({"ISO_A3": "FRA"}), "FRA")
        self.assertEqual(natural_earth.resolve_iso3({"ISO_A3": "-99", "ISO_A3_EH": "-99", "ADM0_A3": "KOS"}), "XKX")
        self.assertIsNone(natural_earth.resolve_iso3({"ISO_A3": "-99", "ISO_A3_EH": "-99", "ADM0_A3": "-99"}))


class CurrentDataTest(unittest.TestCase):
    def test_bis_euro_area_gets_ecb_rate_and_frozen_series_ignored(self):
        text = "REF_AREA,OBS_VALUE,TIME_PERIOD\nXM,2.0,2026-06-11\nDE,1.0,2026-06-01\nUS,4.5,2026-06-16\nGB,4.0,2026-06-18\n"
        out = bis.parse_policy_rates(text, {"US": "USA"})
        self.assertEqual(out["DEU"]["value"], 2.0)
        self.assertEqual(out["USA"], {"value": 4.5, "year": 2026, "period": "2026-06"})
        self.assertEqual(out["GBR"]["value"], 4.0)

    def test_bis_bulgaria_gets_ecb_rate_since_joining_the_euro(self):
        # Bulgaria adopted the euro on 1 Jan 2026 and BIS publishes no BG series.
        out = bis.parse_policy_rates("REF_AREA,OBS_VALUE,TIME_PERIOD\nXM,2.5,2026-11-17\n", {})
        self.assertEqual(out["BGR"], {"value": 2.5, "year": 2026, "period": "2026-11"})
        self.assertEqual(len(bis.EURO_AREA_ISO3), 21)

    def test_imf_cpi_maps_kosovo_and_skips_nulls(self):
        root = {"data": {
            "dataSets": [{"series": {"0:0": {"observations": {"0": [1.5]}}, "1:0": {"observations": {"0": [None]}}}}],
            "structures": [{"dimensions": {
                "series": [{"id": "COUNTRY", "values": [{"id": "UVK"}, {"id": "USA"}]}],
                "observation": [{"values": [{"value": "2026-M05"}]}]}}],
        }}
        self.assertEqual(imf.parse_cpi(root), {"XKX": {"value": 1.5, "year": 2026, "period": "2026-05"}})


class EuroSpreadTest(unittest.TestCase):
    ROOT = {
        "id": ["freq", "geo", "time"], "size": [1, 3, 2],
        "dimension": {
            "freq": {"category": {"index": {"M": 0}}},
            "geo": {"category": {"index": {"DE": 0, "IT": 1, "EL": 2}}},
            "time": {"category": {"index": {"2026-09": 0, "2026-10": 1}}},
        },
        # IT has only September; EL (Greece) has both months.
        "value": {"0": 3.473, "1": 3.416, "2": 4.362, "4": 3.9, "5": 4.1},
    }

    def test_parse_maps_greece_and_skips_gaps(self):
        out = eurostat.parse_monthly(self.ROOT)
        self.assertEqual(out["DEU"], {"2026-09": 3.473, "2026-10": 3.416})
        self.assertEqual(out["ITA"], {"2026-09": 4.362})
        self.assertEqual(out["GRC"]["2026-10"], 4.1)

    def test_spread_never_subtracts_different_months(self):
        out = eurostat.spreads_vs_bund(eurostat.parse_monthly(self.ROOT))
        # Italy's latest month is September, so the Bund is taken from September too.
        self.assertEqual(out["ITA"], {"value": 88.9, "year": 2026, "period": "2026-09"})
        self.assertEqual(out["GRC"]["value"], 68.4)
        self.assertEqual(out["DEU"]["value"], 0.0)

    def test_spread_needs_a_bund_observation(self):
        self.assertEqual(eurostat.spreads_vs_bund({"ITA": {"2026-09": 4.0}}), {})

    def test_geo_codes_cover_the_euro_area(self):
        self.assertEqual(set(eurostat.EUROSTAT_GEO), set(bis.EURO_AREA_ISO3))

    def test_real_policy_rate_is_rate_minus_inflation_with_both_periods(self):
        countries = {
            "TUR": {"metrics": {"policy_rate": {"value": 36.0, "year": 2026, "period": "2026-11"},
                                "inflation": {"value": 29.73, "year": 2026, "period": "2026-09"}}},
            "ABC": {"metrics": {"inflation": {"value": 2.0, "year": 2025}}},
        }
        out = real_policy_rates(countries)
        self.assertEqual(out, {"TUR": {"value": 6.27, "year": 2026, "period": "2026-11 · CPI 2026-09"}})


class TradeTest(unittest.TestCase):
    def test_top_partners_filters_and_sorts(self):
        partners = [("G001", 100.0, 2024), ("USA", 30.0, 2024), ("DEU", 50.0, 2024), ("FRA", 70.0, 2021), ("DEU2", 1.0, 2024)]
        flow = top_partners("FRA", partners, {"USA", "DEU", "FRA"})
        self.assertEqual(flow["total"], 100.0)
        self.assertEqual([p["p"] for p in flow["partners"]], ["DEU", "USA"])

    def test_no_partners_returns_none(self):
        self.assertIsNone(top_partners("FRA", [("G001", 1.0, 2024)], {"FRA"}))


class ComtradeTest(unittest.TestCase):
    def test_parse_products_skips_totals_and_zeros(self):
        rows = [{"cmdCode": "TOTAL", "primaryValue": 9}, {"cmdCode": "01", "primaryValue": 0}, {"cmdCode": "02", "primaryValue": 3}]
        self.assertEqual(comtrade.parse_products(rows), [("02", 3.0)])

    def test_reporters_skip_groups_and_unknown_countries(self):
        ref = {"results": [
            {"reporterCode": 276, "reporterCodeIsoAlpha3": "DEU", "isGroup": False},
            {"reporterCode": 97, "reporterCodeIsoAlpha3": "EUR", "isGroup": True},
            {"reporterCode": 1, "reporterCodeIsoAlpha3": "ZZZ", "isGroup": False},
        ]}
        self.assertEqual(comtrade.parse_reporters(ref, {"DEU"}), {"DEU": 276})


class RegionMatchingTest(unittest.TestCase):
    def test_name_normalisation(self):
        self.assertEqual(normalize("País Vasco"), "paisvasco")
        self.assertEqual(normalize_admin_name("Aichi Prefecture"), normalize_admin_name("Aichi"))

    def test_unique_match_ambiguous_and_missing(self):
        geo = {"features": [
            {"properties": {"shapeName": "Alpha", "shapeID": "a"}},
            {"properties": {"shapeName": "Beta Province", "shapeID": "b"}},
        ]}
        regions = {
            "1": {"id": "1", "name": "Alpha"},
            "2": {"id": "2", "name": "Beta"},         # joins via admin-suffix fallback
            "3": {"id": "3", "name": "Nowhere"},      # no shape
            "4": {"id": "4", "name": "Dup"}, "5": {"id": "5", "name": "Dup"},  # duplicate data names
        }
        m = match_country("XXX", regions, index_shapes(geo))
        self.assertEqual(m.matched_ids, {"1", "2"})
        self.assertEqual(m.shape_to_region, {"a": "1", "b": "2"})
        self.assertEqual(sorted(m.unmatched), ["Dup", "Dup", "Nowhere"])


if __name__ == "__main__":
    unittest.main()
