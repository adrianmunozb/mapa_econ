"""Build the per-country feature collection shipped to the frontend."""

from __future__ import annotations

from .simplify import simplify_geometry


def build_features(iso3: str, geo: dict, country_regions: dict[str, dict], shape_to_region: dict[str, str]) -> list[dict]:
    """Keep every administrative shape for a supported country. Shapes that could not be
    matched to DOSE remain visible with the map's no-data colour."""
    features = []
    for feature in geo.get("features", []):
        props = feature.get("properties") or {}
        shape_id = str(props.get("shapeID") or "")
        shape_name = str(props.get("shapeName") or "").strip()
        region_id = shape_to_region.get(shape_id)
        features.append({
            "type": "Feature",
            "geometry": simplify_geometry(feature["geometry"]),
            "properties": {
                "iso3": iso3,
                "shapeId": shape_id,
                "regionId": region_id,
                "name": country_regions[region_id]["name"] if region_id else shape_name,
            },
        })
    return features
