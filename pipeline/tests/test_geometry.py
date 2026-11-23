import json
import unittest
from pathlib import Path

from shapely.geometry import shape

from wem.geometry import DEFAULT_ADJUSTMENTS, ParallelTransfer, apply_adjustments

GEOJSON = Path(__file__).resolve().parents[2] / "app/public/data/countries.geojson"


def square(x0, y0, x1, y1):
    return {"type": "Polygon", "coordinates": [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]}


def collection():
    return {
        "features": [
            {"properties": {"iso3": "AAA", "name": "A"}, "geometry": square(0, 0, 10, 10)},
            {"properties": {"iso3": "BBB", "name": "B"}, "geometry": square(0, -5, 10, 0)},
        ]
    }


class ParallelTransferTest(unittest.TestCase):
    def test_moves_south_part_and_preserves_area(self):
        gj = apply_adjustments(collection(), (ParallelTransfer("AAA", "BBB", lat=4, recipient_name="Bee"),))
        a, b = (shape(f["geometry"]) for f in gj["features"])
        self.assertAlmostEqual(a.area, 60)
        self.assertAlmostEqual(b.area, 90)
        self.assertEqual(gj["features"][1]["properties"]["name"], "Bee")

    def test_missing_feature_is_a_noop(self):
        gj = collection()
        before = json.dumps(gj)
        apply_adjustments(gj, (ParallelTransfer("AAA", "ZZZ", lat=4),))
        self.assertEqual(json.dumps(gj), before)


class WesternSaharaTest(unittest.TestCase):
    def test_default_registry_is_idempotent_on_shipped_data(self):
        gj = json.loads(GEOJSON.read_text())
        area = lambda g, i: shape(next(f for f in g["features"] if f["properties"]["iso3"] == i)["geometry"]).area
        before = {i: area(gj, i) for i in ("MAR", "ESH")}
        apply_adjustments(gj, DEFAULT_ADJUSTMENTS)
        after = {i: area(gj, i) for i in ("MAR", "ESH")}
        for i in before:
            self.assertAlmostEqual(before[i], after[i], places=6)
        mar = next(f for f in gj["features"] if f["properties"]["iso3"] == "MAR")
        esh = next(f for f in gj["features"] if f["properties"]["iso3"] == "ESH")
        self.assertGreaterEqual(shape(mar["geometry"]).bounds[1], 27.66)
        self.assertEqual(shape(mar["geometry"]).intersection(shape(esh["geometry"])).area, 0)


if __name__ == "__main__":
    unittest.main()
