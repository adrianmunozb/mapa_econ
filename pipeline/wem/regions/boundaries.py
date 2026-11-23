"""geoBoundaries gbOpen ADM1 access with a local download cache."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

import requests

from .names import normalize, normalize_admin_name

METADATA_URL = "https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM1/"


def cached_get(url: str, path: Path) -> bytes:
    """Download ``url`` once into ``path``; later runs reuse the cached bytes."""
    if path.exists() and path.stat().st_size:
        return path.read_bytes()
    path.parent.mkdir(parents=True, exist_ok=True)
    response = requests.get(url, timeout=90)
    response.raise_for_status()
    path.write_bytes(response.content)
    return response.content


def load_metadata(raw_dir: Path) -> dict[str, dict]:
    """ADM1 metadata entries keyed by country ISO3."""
    metadata = json.loads(cached_get(METADATA_URL, raw_dir / "geoboundaries-all-adm1.json"))
    return {
        entry.get("boundaryISO"): entry
        for entry in metadata
        if entry.get("boundaryISO") and entry.get("boundaryType") == "ADM1"
    }


def load_country_geometry(raw_dir: Path, iso3: str, meta: dict) -> dict:
    geom_path = raw_dir / f"{iso3}-ADM1-simplified.geojson"
    return json.loads(cached_get(meta["simplifiedGeometryGeoJSON"], geom_path))


@dataclass
class ShapeIndex:
    """Boundary features indexed by exact and by admin-suffix-stripped name."""

    by_name: dict[str, list[dict]] = field(default_factory=lambda: defaultdict(list))
    by_admin_name: dict[str, list[dict]] = field(default_factory=lambda: defaultdict(list))


def index_shapes(geo: dict) -> ShapeIndex:
    index = ShapeIndex()
    for feature in geo.get("features", []):
        props = feature.get("properties") or {}
        name = str(props.get("shapeName") or "").strip()
        if not name:
            continue
        # Keep slash-separated localized aliases so labels such as
        # "País Vasco/Euskadi" can match data published under either name.
        aliases = [name, *re.split(r"\s*/\s*", name)]
        for alias in aliases:
            index.by_name[normalize(alias)].append(feature)
            index.by_admin_name[normalize_admin_name(alias)].append(feature)
    return index
