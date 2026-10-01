"""Regional boundaries + reported regional macro data.

Inputs are cached under data/raw/regions; outputs are static app data files. No API
key or paid service is used. Regional GDP coverage is the DOSE v2.11 dataset
(83 countries, 1953–2020); geometry is from geoBoundaries gbOpen.

Outputs: regions/<ISO3>.geojson, regional-data/<ISO3>.json, regional-index.json
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from ..catalog import sources
from ..jsonio import COMPACT, write_json
from ..paths import Paths
from ..regions.boundaries import cached_get, index_shapes, load_country_geometry, load_metadata
from ..regions.dose import load_regions
from ..regions.features import build_features
from ..regions.matcher import match_country

DOSE_URL = "https://zenodo.org/records/16313760/files/DOSE_V2.11.csv?download=1"
MIN_DATA_COVERAGE = 0.80


def _write_country_files(out: Path, features_by_country: dict, region_index: dict) -> None:
    regions_dir, regional_data_dir = out / "regions", out / "regional-data"
    for directory in (regions_dir, regional_data_dir):
        directory.mkdir(parents=True, exist_ok=True)
    active = set(features_by_country)
    for directory in (regions_dir, regional_data_dir):
        for stale in directory.iterdir():
            if stale.is_file() and stale.stem not in active:
                stale.unlink()
    for iso3, features in features_by_country.items():
        write_json(regions_dir / f"{iso3}.geojson", {"type": "FeatureCollection", "features": features}, separators=COMPACT)
        write_json(regional_data_dir / f"{iso3}.json", {"iso3": iso3, "regions": region_index[iso3]}, separators=COMPACT)


def run(paths: Paths, args=()) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
    raw = paths.raw_dir / "regions"
    raw.mkdir(parents=True, exist_ok=True)
    dose_path = raw / "DOSE_V2.11.csv"
    cached_get(DOSE_URL, dose_path)
    regions_by_country = load_regions(dose_path)
    metadata_by_iso = load_metadata(raw)

    features_by_country: dict[str, list[dict]] = defaultdict(list)
    region_index: dict[str, list[dict]] = {}
    coverage_by_country: dict[str, dict] = {}
    matched_by_country: dict[str, int] = {}
    unmatched_by_country: dict[str, list[str]] = {}
    country_codes = sorted(regions_by_country)
    for country_index, iso3 in enumerate(country_codes, start=1):
        country_regions = regions_by_country[iso3]
        # Historical/obsolete entities without a current ISO map are retained in the
        # data index only when a boundary can be identified.
        boundary_meta = metadata_by_iso.get(iso3)
        if not boundary_meta:
            continue
        geo = load_country_geometry(raw, iso3, boundary_meta)
        match = match_country(iso3, country_regions, index_shapes(geo))

        matched_by_country[iso3] = len(match.matched_ids)
        unmatched_by_country[iso3] = match.unmatched
        ratio = len(match.matched_ids) / len(country_regions) if country_regions else 0
        if ratio < MIN_DATA_COVERAGE:
            continue

        features_by_country[iso3] = build_features(iso3, geo, country_regions, match.shape_to_region)
        region_index[iso3] = [r for r in country_regions.values() if r["id"] in match.matched_ids]
        coverage_by_country[iso3] = {
            "regions": len(country_regions),
            "matched": len(match.matched_ids),
            "boundaryUnits": len(geo.get("features", [])),
        }
        if country_index % 10 == 0:
            print(f"Processed region boundaries for {country_index}/{len(country_codes)} countries", flush=True)

    out = paths.out_dir
    out.mkdir(parents=True, exist_ok=True)
    _write_country_files(out, features_by_country, region_index)

    dataset = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "coverage": {
            "countries": len(region_index),
            "regions": sum(details["regions"] for details in coverage_by_country.values()),
            "firstYear": 1953,
            "lastYear": 2020,
            "minimumCountryMatch": MIN_DATA_COVERAGE,
            "notes": "Reported macro data vary by region and year. Missing values are not estimated; unmatched boundaries are shown without data.",
        },
        "sources": [sources.DOSE.to_dict(), sources.GEOBOUNDARIES.to_dict()],
        "countries": coverage_by_country,
    }
    write_json(out / "regional-index.json", dataset, separators=COMPACT)

    matched_total = sum(matched_by_country.values())
    total = sum(len(regions) for regions in regions_by_country.values())
    included_matches = sum(d["matched"] for d in coverage_by_country.values())
    included_total = sum(d["regions"] for d in coverage_by_country.values())
    print(f"Built regional data: {len(region_index)} countries, {included_matches}/{included_total} region joins, {matched_total}/{total} overall")
    for iso3 in sorted(coverage_by_country):
        missing = unmatched_by_country[iso3]
        if missing:
            print(f"  {iso3}: unmatched {', '.join(missing)}")
    return 0
