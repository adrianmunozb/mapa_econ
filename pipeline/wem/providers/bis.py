"""BIS central-bank policy rates (WS_CBPOL, daily). No API key."""

from __future__ import annotations

import csv
import io
import math

from ..http import HttpClient
from ..periods import bis_period

URL = "https://stats.bis.org/api/v1/data/WS_CBPOL/D.."

# Euro-area members get the ECB rate (BIS area "XM"); their historical pre-euro
# alpha-2 series are frozen and must be ignored.
EURO_AREA_ISO3 = [
    "AUT", "BEL", "CYP", "DEU", "EST", "ESP", "FIN", "FRA", "GRC", "HRV",
    "IRL", "ITA", "LTU", "LUX", "LVA", "MLT", "NLD", "PRT", "SVK", "SVN",
]
EURO_AREA_FROZEN_A2 = {"AT", "BE", "DE", "ES", "FR", "GR", "HR", "IT", "NL", "PT"}
# BIS areas missing from the World Bank iso2 table.
EXTRA_ISO2 = {"HK": "HKG", "GB": "GBR"}


def parse_policy_rates(text: str, iso2_to_iso3: dict[str, str]) -> dict[str, dict]:
    """``{iso3: {value, year, period}}`` from a BIS CSV (latest observation per area)."""
    out: dict[str, dict] = {}
    euro: dict | None = None
    for row in csv.DictReader(io.StringIO(text)):
        area = (row.get("REF_AREA") or "").strip()
        raw = (row.get("OBS_VALUE") or "").strip()
        period = (row.get("TIME_PERIOD") or "").strip()
        if not area or not raw:
            continue
        try:
            value = float(raw)
        except ValueError:
            continue
        if not math.isfinite(value):
            continue
        label, year = bis_period(period)
        if area == "XM":
            euro = {"value": value, "year": year, "period": label}
            continue
        if area in EURO_AREA_FROZEN_A2:
            continue  # frozen pre-euro series
        iso3 = iso2_to_iso3.get(area) or EXTRA_ISO2.get(area)
        if iso3:
            out[iso3] = {"value": value, "year": year, "period": label}
    if euro:
        for iso3 in EURO_AREA_ISO3:
            out[iso3] = dict(euro)
    return out


def fetch_policy_rates(http: HttpClient, iso2_to_iso3: dict[str, str]) -> dict[str, dict]:
    resp = http.get(URL, {"lastNObservations": 1, "format": "csv"})
    resp.raise_for_status()
    return parse_policy_rates(resp.text, iso2_to_iso3)
