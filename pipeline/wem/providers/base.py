"""Contract shared by every annual-indicator provider."""

from __future__ import annotations

from typing import Protocol

from ..models import Source


class IndicatorProvider(Protocol):
    """A source of country × year series addressed by an indicator code."""

    source: Source

    def latest(self, code: str) -> dict[str, dict]:
        """``{iso3: {value, year}}`` — the most recent observation per country."""

    def history(self, code: str, start: int, end: int) -> dict[str, dict[int, float]]:
        """Sparse ``{iso3: {year: value}}`` within ``[start, end]``."""
