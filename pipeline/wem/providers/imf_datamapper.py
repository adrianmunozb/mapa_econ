"""IMF DataMapper API (World Economic Outlook series). Keyless; ISO3 country keys.

Response shape: ``{"values": {CODE: {ISO3: {"2020": 1.2, ...}}}}``. The API also returns
aggregates (euro area, world, ...) and forecasts; callers filter to known countries and
``latest`` ignores years after ``max_year`` so projections never pose as observations.
"""

from __future__ import annotations

import math
from datetime import date

from ..catalog import sources
from ..http import HttpClient
from .imf import ISO_FIX

BASE = "https://www.imf.org/external/datamapper/api/v1"


def parse_series(root: dict, code: str) -> dict[str, dict[int, float]]:
    """``{iso3: {year: value}}`` with non-finite/missing values dropped."""
    out: dict[str, dict[int, float]] = {}
    for iso, years in ((root.get("values") or {}).get(code) or {}).items():
        iso = ISO_FIX.get(iso, iso)
        for year, value in (years or {}).items():
            if value is None:
                continue
            try:
                y, v = int(year), float(value)
            except (TypeError, ValueError):
                continue
            if math.isfinite(v):
                out.setdefault(iso, {})[y] = v
    return out


class ImfDataMapperClient:
    source = sources.IMF_DATAMAPPER

    def __init__(self, http: HttpClient, max_year: int | None = None) -> None:
        self._http = http
        self._max_year = max_year if max_year is not None else date.today().year - 1

    def _series(self, code: str) -> dict[str, dict[int, float]]:
        return parse_series(self._http.get_json(f"{BASE}/{code}"), code)

    def latest(self, code: str) -> dict[str, dict]:
        out: dict[str, dict] = {}
        for iso, years in self._series(code).items():
            observed = [y for y in years if y <= self._max_year]
            if observed:
                year = max(observed)
                out[iso] = {"value": years[year], "year": year}
        return out

    def history(self, code: str, start: int, end: int) -> dict[str, dict[int, float]]:
        out: dict[str, dict[int, float]] = {}
        for iso, years in self._series(code).items():
            window = {y: v for y, v in years.items() if start <= y <= end}
            if window:
                out[iso] = window
        return out
