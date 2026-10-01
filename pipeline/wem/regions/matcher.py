"""Join DOSE regions to boundary shapes, deliberately refusing ambiguous matches."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

from .aliases import ALIASES
from .boundaries import ShapeIndex
from .names import normalize, normalize_admin_name


@dataclass
class CountryMatch:
    matched_ids: set[str] = field(default_factory=set)
    shape_to_region: dict[str, str] = field(default_factory=dict)
    unmatched: list[str] = field(default_factory=list)


def match_country(iso3: str, country_regions: dict[str, dict], shapes: ShapeIndex) -> CountryMatch:
    result = CountryMatch()
    data_name_counts: dict[str, int] = defaultdict(int)
    for region in country_regions.values():
        data_name_counts[normalize(region["name"])] += 1
    for region in country_regions.values():
        name = region["name"]
        if data_name_counts[normalize(name)] > 1:
            result.unmatched.append(name)
            continue
        targets = ALIASES.get((iso3, name), [name])
        matched_shapes: list[dict] = []
        ambiguous = False
        for target in targets:
            exact = shapes.by_name.get(normalize(target), [])
            if exact:
                unique_exact = {id(feature): feature for feature in exact}
                if len(unique_exact) != 1:
                    ambiguous = True
                    break
                matched_shapes.extend(unique_exact.values())
                continue
            # Generic admin suffixes help join names such as "Aichi" and
            # "Aichi Prefecture". Accept the fallback only if it is unique.
            simplified = shapes.by_admin_name.get(normalize_admin_name(target), [])
            unique_simplified = {id(feature): feature for feature in simplified}
            if len(unique_simplified) == 1:
                matched_shapes.extend(unique_simplified.values())
        # An exact, unique source-name match is safe. Ambiguous joins are
        # deliberately omitted instead of assigning a region twice.
        matched_shapes = list({id(feature): feature for feature in matched_shapes}.values())
        if ambiguous or not matched_shapes:
            result.unmatched.append(name)
            continue
        result.matched_ids.add(region["id"])
        for feature in matched_shapes:
            shape_id = str((feature.get("properties") or {}).get("shapeID") or "")
            if shape_id:
                result.shape_to_region[shape_id] = region["id"]
    return result
