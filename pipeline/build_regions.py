#!/usr/bin/env python3
"""Build first-level regional boundaries and reported macro data.

Inputs are cached under data/raw/regions; outputs are static app data files.
No API key or paid service is used. Regional GDP coverage is the DOSE v2.11
dataset (83 countries, 1953–2020); geometry is from geoBoundaries gbOpen.
"""

from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "regions"
OUT = ROOT / "app" / "public" / "data"
DOSE_URL = "https://zenodo.org/records/16313760/files/DOSE_V2.11.csv?download=1"
BOUNDARIES_URL = "https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM1/"
DOSE_SOURCE = {
    "name": "DOSE — Global Dataset of Reported Sub-national Economic Output (v2.11)",
    "url": "https://doi.org/10.5281/zenodo.16313760",
    "license": "CC BY 4.0",
}
MIN_DATA_COVERAGE = 0.80
SIMPLIFY_TOLERANCE_DEGREES = 0.012
BOUNDARY_SOURCE = {
    "name": "geoBoundaries gbOpen ADM1",
    "url": "https://www.geoboundaries.org/",
    "license": "CC BY 4.0; attribution required",
}

# Some DOSE regions are reported under an aggregate name, or use a synonym for
# the current boundary name. These exceptions are explicit to avoid silent,
# unsafe fuzzy matches.
ALIASES: dict[tuple[str, str], list[str]] = {
    ("ESP", "Ceuta y Melilla"): ["Ciudad Autónoma de Ceuta", "Ciudad Autónoma de Melilla"],
    ("ESP", "Comunidad Valenciana"): ["Comunitat Valenciana"],
    ("ESP", "Cataluña"): ["Catalunya"],
    ("ESP", "País Vasco"): ["Euskadi"],
    ("IND", "Andaman Nicobar"): ["Andaman and Nicobar Islands"],
    ("IND", "Chattisgarh"): ["Chhattisgarh"],
    ("IND", "Jammu & Kashmir"): ["Jammu and Kashmir", "Ladakh"],
    ("CHN", "Ningxia"): ["Ningxia Ningxia Hui Autonomous Region"],
    ("CZE", "Central Bohemia Region"): ["Středočeský kraj"],
    ("CZE", "Prague"): ["Hlavní město Praha"],
    ("CZE", "South Bohemia Region"): ["Jihočeský kraj"],
    ("CZE", "The Hradec Kralove Region"): ["Královéhradecký kraj"],
    ("CZE", "The Karlovy Vary Region"): ["Karlovarský kraj"],
    ("CZE", "The Liberec Region"): ["Liberecký kraj"],
    ("CZE", "The Moravian-Silesian Region"): ["Moravskoslezský kraj"],
    ("CZE", "The Olomouc Region"): ["Olomoucký kraj"],
    ("CZE", "The Pardubice Region"): ["Pardubický kraj"],
    ("CZE", "The Plzen Region"): ["Plzeňský kraj"],
    ("CZE", "The South Moravian Region"): ["Jihomoravský kraj"],
    ("CZE", "The Usti Region"): ["Ústecký kraj"],
    ("CZE", "The Vysocina Region"): ["Kraj Vysočina"],
    ("CZE", "The Zlin Region"): ["Zlínský kraj"],
    ("POL", "Dolnośląskie"): ["Lower Silesian Voivodeship"],
    ("POL", "Kujawsko-Pomorskie"): ["Kuyavian-Pomeranian Voivodeship"],
    ("POL", "Lubelskie"): ["Lublin Voivodeship"],
    ("POL", "Lubuskie"): ["Lubusz Voivodeship"],
    ("POL", "Mazowieckie"): ["Masovian Voivodeship"],
    ("POL", "Małopolskie"): ["Lesser Poland Voivodeship"],
    ("POL", "Opolskie"): ["Opole Voivodeship"],
    ("POL", "Podkarpackie"): ["Subcarpathian Voivodeship"],
    ("POL", "Podlaskie"): ["Podlaskie Voivodeship"],
    ("POL", "Pomorskie"): ["Pomeranian Voivodeship"],
    ("POL", "Warmińsko-Mazurskie"): ["Warmian-Masurian Voivodeship"],
    ("POL", "Wielkopolskie"): ["Greater Poland Voivodeship"],
    ("POL", "Zachodniopomorskie"): ["West Pomeranian Voivodeship"],
    ("POL", "Łódzkie"): ["Łódź Voivodeship"],
    ("POL", "Śląskie"): ["Silesian Voivodeship"],
    ("POL", "Świętokrzyskie"): ["Świętokrzyskie Voivodeship"],
}


def cached_get(url: str, path: Path) -> bytes:
    if path.exists() and path.stat().st_size:
        return path.read_bytes()
    path.parent.mkdir(parents=True, exist_ok=True)
    response = requests.get(url, timeout=90)
    response.raise_for_status()
    path.write_bytes(response.content)
    return response.content


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "", value)


ADMIN_NAME_TOKENS = {
    "and", "autonomous", "city", "county", "department", "district", "hui", "municipality",
    "of", "prefecture", "province", "region", "special", "state", "the", "voivodeship",
    "uyghur", "zhuang",
}


def normalize_admin_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    tokens = [token for token in re.findall(r"[a-z0-9]+", value) if token not in ADMIN_NAME_TOKENS]
    collapsed: list[str] = []
    for token in tokens:
        if not collapsed or token != collapsed[-1]:
            collapsed.append(token)
    return "".join(collapsed)


def number(value: str | None) -> float | None:
    if value is None or not value.strip():
        return None
    try:
        result = float(value)
        return result if result == result and abs(result) != float("inf") else None
    except ValueError:
        return None


def polygons(geometry: dict) -> list:
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return geometry["coordinates"]
    raise ValueError(f"Unsupported ADM1 geometry type: {geometry['type']}")


def point_line_distance_sq(point: list[float], start: list[float], end: list[float]) -> float:
    dx, dy = end[0] - start[0], end[1] - start[1]
    if dx == 0 and dy == 0:
        return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2
    t = max(0.0, min(1.0, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)))
    x, y = start[0] + t * dx, start[1] + t * dy
    return (point[0] - x) ** 2 + (point[1] - y) ** 2


def simplify_path(points: list[list[float]], tolerance: float) -> list[list[float]]:
    if len(points) <= 2:
        return points
    keep = {0, len(points) - 1}
    stack = [(0, len(points) - 1)]
    limit = tolerance * tolerance
    while stack:
        first, last = stack.pop()
        distance, farthest = limit, None
        for index in range(first + 1, last):
            candidate = point_line_distance_sq(points[index], points[first], points[last])
            if candidate > distance:
                distance, farthest = candidate, index
        if farthest is not None:
            keep.add(farthest)
            stack.append((first, farthest))
            stack.append((farthest, last))
    return [points[index] for index in sorted(keep)]


def simplify_ring(ring: list[list[float]]) -> list[list[float]]:
    if len(ring) < 5:
        return [[round(value, 4) for value in point[:2]] for point in ring]
    vertices = [[round(value, 4) for value in point[:2]] for point in ring[:-1]]
    if len(vertices) < 4:
        return vertices + [vertices[0]]
    start = vertices[0]
    split = max(range(1, len(vertices)), key=lambda index: point_line_distance_sq(vertices[index], start, start))
    first = simplify_path(vertices[: split + 1], SIMPLIFY_TOLERANCE_DEGREES)
    second = simplify_path(vertices[split:] + [start], SIMPLIFY_TOLERANCE_DEGREES)
    result = first[:-1] + second[:-1] + [start]
    if len(result) < 4:
        return vertices + [vertices[0]]
    return result


def simplify_polygon(poly: list) -> list:
    return [simplify_ring(ring) for ring in poly]


def simplify_geometry(geometry: dict) -> dict:
    if geometry["type"] == "Polygon":
        return {"type": "Polygon", "coordinates": simplify_polygon(geometry["coordinates"])}
    return {
        "type": "MultiPolygon",
        "coordinates": [simplify_polygon(poly) for poly in geometry["coordinates"]],
    }


def main() -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    dose_path = RAW / "DOSE_V2.11.csv"
    cached_get(DOSE_URL, dose_path)

    # Preserve every reported year so region panels can show a real time series.
    series: dict[str, dict] = {}
    regions_by_country: dict[str, dict[str, dict]] = defaultdict(dict)
    with dose_path.open("r", encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            iso3 = row["GID_0"].strip()
            region_id = row["GID_1"].strip()
            region_name = row["region"].strip()
            year = row["year"].strip()
            pop = number(row.get("pop"))
            pc_usd = number(row.get("grp_pc_usd"))
            pc_usd_2015 = number(row.get("grp_pc_usd_2015"))
            total_lcu = number(row.get("grp_lcu"))
            metrics = {
                "gdpPerCapitaUsd": pc_usd,
                "gdpPerCapitaUsd2015": pc_usd_2015,
                "gdpTotalLocalCurrency": total_lcu,
                "population": pop,
                "gdpTotalUsd": pc_usd * pop if pc_usd is not None and pop is not None else None,
            }
            metrics = {key: value for key, value in metrics.items() if value is not None}
            entry = regions_by_country[iso3].setdefault(
                region_id,
                {"id": region_id, "name": region_name, "values": {}},
            )
            if metrics:
                entry["values"][year] = metrics

    metadata = json.loads(cached_get(BOUNDARIES_URL, RAW / "geoboundaries-all-adm1.json"))
    metadata_by_iso = {
        entry.get("boundaryISO"): entry
        for entry in metadata
        if entry.get("boundaryISO") and entry.get("boundaryType") == "ADM1"
    }

    features_by_country: dict[str, list[dict]] = defaultdict(list)
    region_index: dict[str, list[dict]] = {}
    coverage_by_country: dict[str, dict] = {}
    matched_by_country: dict[str, int] = {}
    unmatched_by_country: dict[str, list[str]] = {}
    country_codes = sorted(regions_by_country)
    for country_index, iso3 in enumerate(country_codes, start=1):
        country_regions = regions_by_country[iso3]
        # Historical/obsolete entities without a current ISO map are retained
        # in the data index only when a boundary can be identified.
        boundary_meta = metadata_by_iso.get(iso3)
        if not boundary_meta:
            continue
        geom_path = RAW / f"{iso3}-ADM1-simplified.geojson"
        geo = json.loads(cached_get(boundary_meta["simplifiedGeometryGeoJSON"], geom_path))
        shapes_by_name: dict[str, list[dict]] = defaultdict(list)
        shapes_by_admin_name: dict[str, list[dict]] = defaultdict(list)
        for feature in geo.get("features", []):
            props = feature.get("properties") or {}
            name = str(props.get("shapeName") or "").strip()
            if not name:
                continue
            # Keep slash-separated localized aliases so labels such as
            # "País Vasco/Euskadi" can match data published under either name.
            aliases = [name, *re.split(r"\s*/\s*", name)]
            for alias in aliases:
                shapes_by_name[normalize(alias)].append(feature)
                shapes_by_admin_name[normalize_admin_name(alias)].append(feature)

        matched_ids: set[str] = set()
        shape_to_region: dict[str, str] = {}
        unmatched: list[str] = []
        data_name_counts: dict[str, int] = defaultdict(int)
        for region in country_regions.values():
            data_name_counts[normalize(region["name"])] += 1
        for region in country_regions.values():
            name = region["name"]
            if data_name_counts[normalize(name)] > 1:
                unmatched.append(name)
                continue
            targets = ALIASES.get((iso3, name), [name])
            matched_shapes: list[dict] = []
            ambiguous = False
            for target in targets:
                exact = shapes_by_name.get(normalize(target), [])
                if exact:
                    unique_exact = {id(feature): feature for feature in exact}
                    if len(unique_exact) != 1:
                        ambiguous = True
                        break
                    matched_shapes.extend(unique_exact.values())
                    continue
                # Generic admin suffixes help join names such as "Aichi" and
                # "Aichi Prefecture". Accept the fallback only if it is unique.
                simplified = shapes_by_admin_name.get(normalize_admin_name(target), [])
                unique_simplified = {id(feature): feature for feature in simplified}
                if len(unique_simplified) == 1:
                    matched_shapes.extend(unique_simplified.values())
            # An exact, unique source-name match is safe. Ambiguous joins are
            # deliberately omitted instead of assigning a region twice.
            uniq_shapes = {id(feature): feature for feature in matched_shapes}
            matched_shapes = list(uniq_shapes.values())
            if ambiguous or not matched_shapes:
                unmatched.append(name)
                continue
            matched_ids.add(region["id"])
            for feature in matched_shapes:
                shape_id = str((feature.get("properties") or {}).get("shapeID") or "")
                if shape_id:
                    shape_to_region[shape_id] = region["id"]

        matched_by_country[iso3] = len(matched_ids)
        unmatched_by_country[iso3] = unmatched
        ratio = len(matched_ids) / len(country_regions) if country_regions else 0
        if ratio < MIN_DATA_COVERAGE:
            continue

        # Keep every administrative shape for a supported country. Shapes that
        # could not be matched to DOSE remain visible with the map's no-data color.
        for feature in geo.get("features", []):
            props = feature.get("properties") or {}
            shape_id = str(props.get("shapeID") or "")
            shape_name = str(props.get("shapeName") or "").strip()
            region_id = shape_to_region.get(shape_id)
            features_by_country[iso3].append({
                "type": "Feature",
                "geometry": simplify_geometry(feature["geometry"]),
                "properties": {
                    "iso3": iso3,
                    "shapeId": shape_id,
                    "regionId": region_id,
                    "name": country_regions[region_id]["name"] if region_id else shape_name,
                },
            })
        region_index[iso3] = [region for region in country_regions.values() if region["id"] in matched_ids]
        coverage_by_country[iso3] = {
            "regions": len(country_regions),
            "matched": len(matched_ids),
            "boundaryUnits": len(geo.get("features", [])),
        }
        if country_index % 10 == 0:
            print(f"Processed region boundaries for {country_index}/{len(country_codes)} countries", flush=True)

    OUT.mkdir(parents=True, exist_ok=True)
    regions_dir = OUT / "regions"
    regions_dir.mkdir(parents=True, exist_ok=True)
    regional_data_dir = OUT / "regional-data"
    regional_data_dir.mkdir(parents=True, exist_ok=True)
    active_countries = set(features_by_country)
    for directory in (regions_dir, regional_data_dir):
        for stale in directory.iterdir():
            if stale.is_file() and stale.stem not in active_countries:
                stale.unlink()
    for iso3, features in features_by_country.items():
        (regions_dir / f"{iso3}.geojson").write_text(
            json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        (regional_data_dir / f"{iso3}.json").write_text(
            json.dumps({"iso3": iso3, "regions": region_index[iso3]}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

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
        "sources": [DOSE_SOURCE, BOUNDARY_SOURCE],
        "countries": coverage_by_country,
    }
    (OUT / "regional-index.json").write_text(
        json.dumps(dataset, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    matched_total = sum(matched_by_country.values())
    total = sum(len(regions) for regions in regions_by_country.values())
    included_matches = sum(details["matched"] for details in coverage_by_country.values())
    included_total = sum(details["regions"] for details in coverage_by_country.values())
    print(f"Built regional data: {len(region_index)} countries, {included_matches}/{included_total} region joins, {matched_total}/{total} overall")
    for iso3 in sorted(coverage_by_country):
        missing = unmatched_by_country[iso3]
        if missing:
            print(f"  {iso3}: unmatched {', '.join(missing)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # keep fetch/build failures actionable for maintainers
        print(f"Regional data build failed: {exc}", file=sys.stderr)
        raise
