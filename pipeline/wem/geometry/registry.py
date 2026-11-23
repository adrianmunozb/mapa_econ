"""Declarative list of border adjustments applied to the Natural Earth geometry."""

from __future__ import annotations

from .adjustments import Adjustment, ParallelTransfer

# Natural Earth draws Morocco with the Moroccan-administered part of Western Sahara
# merged in. Cut it back out along the 27°40'N parallel (Cape Draa to the Algerian
# frontier) and give it to ESH, so the two territories show as separate areas.
DEFAULT_ADJUSTMENTS: tuple[Adjustment, ...] = (
    ParallelTransfer(
        donor="MAR",
        recipient="ESH",
        lat=27.6667,
        keep="north",
        recipient_name="Western Sahara",
    ),
)
