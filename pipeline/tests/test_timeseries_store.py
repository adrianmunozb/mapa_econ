import tempfile
import unittest
from pathlib import Path

from wem import timeseries_store as store
from wem.paths import Paths


class TimeseriesStoreTest(unittest.TestCase):
    def test_roundtrip_and_stale_files_removed(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = Paths(Path(tmp))
            first = store.Timeseries(2004, 2006, {"name": "WB"}, {"a": {"name": "WB"}, "b": {"name": "IMF"}},
                                     {"a": {"DEU": {2004: 1.0, 2006: 2.0}}, "b": {"USA": {2005: 3.0}}})
            store.write(paths, first)
            back = store.read(paths)
            self.assertEqual(list(back.years), [2004, 2005, 2006])
            self.assertEqual(back.series["a"]["DEU"], {"2004": 1.0, "2006": 2.0})  # JSON keys are strings
            self.assertEqual(back.sources["b"]["name"], "IMF")

            store.write(paths, store.Timeseries(2004, 2006, {"name": "WB"}, {}, {"a": {"DEU": {2004: 1.0}}}))
            self.assertFalse((paths.timeseries_dir / "b.json").exists())
            self.assertEqual(store.read(paths).sources, {})


if __name__ == "__main__":
    unittest.main()
