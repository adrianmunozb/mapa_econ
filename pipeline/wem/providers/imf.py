"""IMF SDMX 3.0: monthly CPI inflation and bilateral goods trade (IMTS). No API key."""

from __future__ import annotations

import math

from ..http import HttpClient
from ..periods import imf_period

CPI_URL = "https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/CPI/+/*.CPI._T.YOY_PCH_PA_PT.M"
IMTS_BASE = "https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IMTS/1.0.0"
EXPORTS_INDICATOR = "XG_FOB_USD"  # goods exports, FOB, USD

# IMF uses UVK for Kosovo; the World Bank (our join key) uses XKX.
ISO_FIX = {"UVK": "XKX"}


def parse_cpi(root: dict) -> dict[str, dict]:
    """``{iso3: {value, year, period}}`` from a CPI SDMX-JSON response."""
    d = root.get("data") or root
    series = d["dataSets"][0]["series"]
    dims = d["structures"][0]["dimensions"]["series"]
    country_pos = next(i for i, dim in enumerate(dims) if dim.get("id") == "COUNTRY")
    country_values = dims[country_pos]["values"]
    time_values = d["structures"][0]["dimensions"]["observation"][0]["values"]

    out: dict[str, dict] = {}
    for key, ser in series.items():
        idxs = [int(x) for x in key.split(":")]
        iso = country_values[idxs[country_pos]]["id"]
        iso = ISO_FIX.get(iso, iso)
        for tindex, ov in (ser.get("observations") or {}).items():
            if not ov or ov[0] is None:
                continue
            value = float(ov[0])
            if not math.isfinite(value):
                continue
            label, year = imf_period(time_values[int(tindex)]["value"])
            out[iso] = {"value": value, "year": year, "period": label}
    return out


def parse_partners(root: dict) -> list[tuple[str, float, int]]:
    """``(partner ISO3, value, year)`` triples from an IMTS SDMX-JSON response.

    Series are keyed by colon-joined dimension indices (e.g. "0:0:5:0"); the
    counterpart index maps through structures[].dimensions.series[].values, and the
    observation key indexes structures[].dimensions.observation[0].values for the year.
    """
    d = root.get("data") or root
    datasets = d.get("dataSets") or []
    if not datasets:
        return []
    series = datasets[0].get("series", {})
    structure = d["structures"][0]["dimensions"]
    dims = structure["series"]
    cp_pos = next((i for i, dim in enumerate(dims) if dim.get("id") == "COUNTERPART_COUNTRY"), None)
    if cp_pos is None:
        return []
    cp_values = dims[cp_pos]["values"]
    time_values = structure["observation"][0]["values"]
    out: list[tuple[str, float, int]] = []
    for key, ser in series.items():
        idxs = [int(x) for x in key.split(":")]
        partner = cp_values[idxs[cp_pos]]["id"]
        for tindex, ov in (ser.get("observations") or {}).items():
            if not ov or ov[0] is None:
                continue
            try:
                value = float(ov[0])
                year = int(time_values[int(tindex)]["value"])
            except (TypeError, ValueError, IndexError, KeyError):
                continue
            out.append((partner, value, year))
    return out


class ImfClient:
    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def inflation(self) -> dict[str, dict]:
        root = self._http.get_json(
            CPI_URL,
            {"lastNObservations": 1, "format": "sdmx-json", "dimensionAtObservation": "TIME_PERIOD"},
        )
        return parse_cpi(root)

    def exports(self, reporter_iso3: str) -> list[tuple[str, float, int]]:
        # lastNObservations=1 returns each partner-series' latest annual value (verified
        # to give correct magnitudes; a fixed startPeriod returned partial figures).
        url = f"{IMTS_BASE}/{reporter_iso3}.{EXPORTS_INDICATOR}.*.A"
        return parse_partners(self._http.get_json(url, {"lastNObservations": 1, "format": "jsondata"}))
