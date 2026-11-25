"""Eurostat 10-year government bond yields (``irt_lt_mcby_m``, EMU convergence criterion).

One source, one method and one month for every euro-area member: the only basis on which
a sovereign spread versus the German Bund is comparable across countries. No API key.
"""

from __future__ import annotations

import math

from ..http import HttpClient

URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/irt_lt_mcby_m"
BENCHMARK = "DEU"

# Eurostat geo codes are ISO alpha-2 except Greece ("EL").
EUROSTAT_GEO = {
    "AUT": "AT", "BEL": "BE", "BGR": "BG", "CYP": "CY", "DEU": "DE", "EST": "EE", "ESP": "ES",
    "FIN": "FI", "FRA": "FR", "GRC": "EL", "HRV": "HR", "IRL": "IE", "ITA": "IT", "LTU": "LT",
    "LUX": "LU", "LVA": "LV", "MLT": "MT", "NLD": "NL", "PRT": "PT", "SVK": "SK", "SVN": "SI",
}
ISO3_BY_GEO = {geo: iso3 for iso3, geo in EUROSTAT_GEO.items()}


def parse_yields(root: dict) -> dict[str, dict[str, float]]:
    """JSON-stat 2.0 → ``{iso3: {"YYYY-MM": yield %}}`` (gaps and non-finite values dropped)."""
    dims = root["dimension"]
    # Row-major flat index over ``id``; the query fixes every other dimension to size 1.
    strides, step = {}, 1
    for dim, size in reversed(list(zip(root["id"], root["size"]))):
        strides[dim] = step
        step *= size
    values = root.get("value") or {}
    if isinstance(values, list):  # JSON-stat allows a dense array as well as a sparse object
        values = dict(enumerate(values))
    values = {str(k): v for k, v in values.items()}
    out: dict[str, dict[str, float]] = {}
    for geo, gi in dims["geo"]["category"]["index"].items():
        iso3 = ISO3_BY_GEO.get(geo)
        if not iso3:
            continue
        for period, ti in dims["time"]["category"]["index"].items():
            raw = values.get(str(gi * strides["geo"] + ti * strides["time"]))
            if isinstance(raw, (int, float)) and math.isfinite(raw):
                out.setdefault(iso3, {})[period] = float(raw)
    return out


def spreads_vs_bund(yields: dict[str, dict[str, float]]) -> dict[str, dict]:
    """Spread in basis points against the Bund, for the latest month both countries report."""
    bund = yields.get(BENCHMARK, {})
    out: dict[str, dict] = {}
    for iso3, series in yields.items():
        common = sorted(set(series) & set(bund))
        if not common:
            continue  # never subtract different months
        month = common[-1]
        out[iso3] = {
            "value": round((series[month] - bund[month]) * 100, 1),
            "year": int(month[:4]),
            "period": month,
        }
    return out


def fetch_yields(http: HttpClient, since: str) -> dict[str, dict[str, float]]:
    params = [("format", "JSON"), ("lang", "EN"), ("sinceTimePeriod", since)]
    params += [("geo", geo) for geo in EUROSTAT_GEO.values()]
    resp = http.get(URL, params)
    resp.raise_for_status()
    return parse_yields(resp.json())
