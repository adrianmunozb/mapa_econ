"""Run every step offline against the fake network and check the produced files."""

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from shapely.geometry import shape

from tests import fake_network
from wem.cli import main
from wem.paths import Paths
from wem.steps import STEPS


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


class EndToEndTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        cls.paths = Paths(Path(cls._tmp.name))
        cls.out = io.StringIO()
        with fake_network.install(), contextlib.redirect_stdout(cls.out):
            cls.code = main(["all"], cls.paths)
            cls.audit_code = main(["audit"], cls.paths)

    @classmethod
    def tearDownClass(cls):
        cls._tmp.cleanup()

    def test_all_steps_succeed(self):
        self.assertEqual((self.code, self.audit_code), (0, 0))

    def test_snapshot_has_metrics_and_countries(self):
        snap = load(self.paths.snapshot)
        self.assertEqual({c["iso3"] for c in snap["countries"]}, {"USA", "DEU", "MAR", "XKX"})
        ids = [m["id"] for m in snap["metrics"]]
        self.assertEqual(ids[ids.index("inflation") + 1], "policy_rate")
        self.assertTrue(all(m.get("labelEn") for m in snap["metrics"]))
        usa = next(c for c in snap["countries"] if c["iso3"] == "USA")
        self.assertIn("period", usa["metrics"]["inflation"])
        self.assertEqual(usa["metrics"]["policy_rate"]["value"], 4.5)

    def test_western_sahara_is_separated_from_morocco(self):
        feats = {f["properties"]["iso3"]: shape(f["geometry"]) for f in load(self.paths.countries_geojson)["features"] if f["properties"]["iso3"]}
        self.assertGreaterEqual(feats["MAR"].bounds[1], 27.66)
        self.assertLessEqual(feats["ESH"].bounds[3], 27.67)
        self.assertEqual(feats["MAR"].intersection(feats["ESH"]).area, 0)
        self.assertIn("XKX", feats)  # Kosovo override joined

    def test_timeseries_trade_and_products(self):
        self.assertIn("gdp_total", load(self.paths.timeseries)["data"]["USA"])
        flows = load(self.paths.trade)["flows"]
        self.assertTrue(all(p["p"] != iso for iso, f in flows.items() for p in f["partners"]))
        products = load(self.paths.trade_products)
        self.assertEqual(set(products["data"]), {"USA", "DEU", "MAR"})  # XKX has no data
        self.assertEqual(products["data"]["MAR"]["year"], 2022)  # year fallback
        self.assertIn("namesEn", products)

    def test_regions_output_and_stale_cleanup(self):
        index = load(self.paths.out_dir / "regional-index.json")
        self.assertEqual(set(index["countries"]), {"DEU"})  # USA: 50% join rate < 80% threshold
        self.assertTrue((self.paths.out_dir / "regions" / "DEU.geojson").exists())
        self.assertFalse((self.paths.out_dir / "regions" / "USA.geojson").exists())


class CliTest(unittest.TestCase):
    def test_unknown_step_and_help(self):
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(main(["nope"]), 2)
        with contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(main(["list"]), 0)
        for name in STEPS:
            self.assertIn(name, out.getvalue())


if __name__ == "__main__":
    unittest.main()
