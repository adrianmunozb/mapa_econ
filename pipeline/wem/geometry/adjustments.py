"""Composable border adjustments applied to Natural Earth features.

Each adjustment is a small frozen dataclass with an ``apply`` method that mutates
a ``{iso3: feature}`` index in place. New cases (another disputed territory, a
different cut) are added as data in ``registry.py`` — no changes to the pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol

from shapely.geometry import box, mapping, shape

FeatureIndex = dict[str, dict]


class Adjustment(Protocol):
    def apply(self, features: FeatureIndex) -> None: ...


@dataclass(frozen=True)
class ParallelTransfer:
    """Move the part of ``donor`` lying on one side of a parallel to ``recipient``."""

    donor: str
    recipient: str
    lat: float
    keep: Literal["north", "south"] = "north"  # side the donor keeps
    recipient_name: str | None = None

    def apply(self, features: FeatureIndex) -> None:
        donor, recipient = features.get(self.donor), features.get(self.recipient)
        if donor is None or recipient is None:
            return  # source dataset lacks one of the two: nothing to adjust
        if self.keep == "north":
            moved_area = box(-180, -90, 180, self.lat)
        else:
            moved_area = box(-180, self.lat, 180, 90)
        donor_geom = shape(donor["geometry"])
        recipient_geom = shape(recipient["geometry"])
        recipient["geometry"] = mapping(
            recipient_geom.union(donor_geom.intersection(moved_area))
        )
        donor["geometry"] = mapping(donor_geom.difference(moved_area))
        if self.recipient_name:
            recipient["properties"]["name"] = self.recipient_name


def apply_adjustments(geojson: dict, adjustments: tuple[Adjustment, ...]) -> dict:
    """Apply ``adjustments`` in order to a FeatureCollection (mutated and returned)."""
    index = {
        f["properties"]["iso3"]: f
        for f in geojson.get("features", [])
        if f.get("properties", {}).get("iso3")
    }
    for adjustment in adjustments:
        adjustment.apply(index)
    return geojson
