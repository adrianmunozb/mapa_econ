"""Patch snapshot.json with CURRENT (monthly/daily) values too fast-moving for annual
World Bank data:

  • Inflation — IMF CPI dataflow (SDMX 3.0), latest monthly YoY %.
  • Policy rate — BIS WS_CBPOL, latest central-bank policy rate, daily.
  • Real policy rate — policy rate minus that latest inflation (derived, ex post).
  • Euro-area spread vs Bund — Eurostat 10Y convergence yields, one source, same month.

Both are keyless and use ISO codes. Each patched value carries a precise ``period``
(ISO, e.g. "2026-05") so the UI shows how fresh it is. Idempotent — safe to re-run.
Requires the ``snapshot`` step to have run first.
"""

from __future__ import annotations

import math
from datetime import date

import requests

from ..catalog import (
    EURO_SPREAD, EURO_SPREAD_SOURCE, INFLATION_ID, INFLATION_OVERRIDES, POLICY_RATE, POLICY_RATE_SOURCE,
    REAL_POLICY_RATE, REAL_POLICY_RATE_SOURCE, sources,
)
from ..http import HttpClient
from ..jsonio import read_json, write_json
from ..paths import Paths
from ..providers import bis, eurostat
from ..providers.imf import ImfClient
from .. import timeseries_store


def _patch_values(countries: dict[str, dict], metric_id: str, values: dict[str, dict]) -> int:
    n = 0
    for iso3, mv in values.items():
        country = countries.get(iso3)
        if country:
            country["metrics"][metric_id] = mv
            n += 1
    return n


MAX_REAL_RATE_GAP_MONTHS = 3
MAX_INFLATION_AGE_YEARS = 3    # "current" inflation older than this is not current
MAX_POLICY_RATE_AGE_MONTHS = 6  # a rate not updated in 6 months is a discontinued series


def freshest_inflation(imf: dict[str, dict], annual: dict[str, dict], today: date,
                       existing: dict[str, dict] | None = None) -> dict[str, dict]:
    """Per country, the most recent of IMF monthly CPI, the value already in the snapshot
    (World Bank latest year, which can be newer than the history window) and the World
    Bank annual history.

    The IMF CPI "latest observation" can be years old (Nauru 2013, Yemen 2015, Syria
    2019); it must not override a newer annual figure, and nothing older than
    ``MAX_INFLATION_AGE_YEARS`` is shown as current inflation.
    """
    existing = existing or {}
    out = {}
    for iso3 in set(imf) | set(annual) | set(existing):
        candidates = []
        for source in (imf, existing):
            if iso3 in source:
                v = source[iso3]
                candidates.append((v["year"], 1 if v.get("period") else 0, v))  # same year: monthly wins
        years = {int(y): v for y, v in annual.get(iso3, {}).items() if v is not None}
        if years:
            y = max(years)
            candidates.append((y, 0, {"value": years[y], "year": y}))
        year, _, best = max(candidates, key=lambda c: (c[0], c[1]))
        if today.year - year <= MAX_INFLATION_AGE_YEARS:
            out[iso3] = best
    return out


def recent_policy_rates(rates: dict[str, dict], today: date) -> dict[str, dict]:
    """Drop policy rates whose last observation is older than ``MAX_POLICY_RATE_AGE_MONTHS``
    (e.g. Argentina: the BCRA stopped publishing a reference rate in July 2025)."""
    now = today.year * 12 + today.month
    return {iso3: r for iso3, r in rates.items()
            if (m := _month_index(r.get("period"))) is not None and now - m <= MAX_POLICY_RATE_AGE_MONTHS}


def _month_index(period: str | None) -> int | None:
    """``"2026-09"`` -> months since year 0; ``None`` for annual or missing periods."""
    if not period or len(period) < 7 or period[4] != "-":
        return None
    return int(period[:4]) * 12 + int(period[5:7])


def real_policy_rates(countries: dict[str, dict]) -> dict[str, dict]:
    """Policy rate minus the latest inflation, only when both are monthly and close in time.

    A rate frozen in 2025 minus 2026 inflation is not a real rate (e.g. Argentina's BCRA
    stopped publishing a policy rate in July 2025), so wide gaps are left out.
    """
    out = {}
    for iso3, country in countries.items():
        rate, infl = country["metrics"].get(POLICY_RATE.id), country["metrics"].get(INFLATION_ID)
        if not rate or not infl:
            continue
        months = _month_index(rate.get("period")), _month_index(infl.get("period"))
        if None in months or abs(months[0] - months[1]) > MAX_REAL_RATE_GAP_MONTHS:
            continue
        out[iso3] = {
            "value": round(rate["value"] - infl["value"], 2),
            "year": rate["year"],
            "period": f"{rate.get('period', rate['year'])} · CPI {infl.get('period', infl['year'])}",
        }
    return out


def _patch_metric_meta(snap: dict, extra: list[tuple]) -> None:
    metrics = snap["metrics"]
    for m in metrics:
        if m["id"] == INFLATION_ID:
            m.update(INFLATION_OVERRIDES)
    # Insert right after inflation (policy rate first) for a natural ordering.
    anchor = INFLATION_ID
    for metric, source in [(POLICY_RATE, POLICY_RATE_SOURCE), *extra]:
        if not any(m["id"] == metric.id for m in metrics):
            idx = next((i for i, m in enumerate(metrics) if m["id"] == anchor), len(metrics) - 1)
            metrics.insert(idx + 1, metric.to_dict(source))
        anchor = metric.id
    have = {s["name"] for s in snap["sources"]}
    for src in (sources.IMF_CPI, sources.BIS, *(source for _, source in extra)):
        if src.name not in have:
            snap["sources"].append(src.to_dict())


def _drop_non_finite(snap: dict) -> int:
    """NaN/Inf is invalid JSON for the browser; also cleans leftovers of earlier runs."""
    dropped = 0
    for c in snap["countries"]:
        clean = {}
        for k, v in c["metrics"].items():
            val = v.get("value")
            if isinstance(val, (int, float)) and math.isfinite(val):
                clean[k] = v
            else:
                dropped += 1
        c["metrics"] = clean
    return dropped


def run(paths: Paths, args=()) -> int:
    http = HttpClient("WorldEconomicMap/0.1 (data pipeline)")
    snap = read_json(paths.snapshot)
    countries = {c["iso3"]: c for c in snap["countries"]}
    iso2_to_iso3 = {c["iso2"]: c["iso3"] for c in snap["countries"] if c.get("iso2")}

    today = date.today()
    print("-> Current inflation (IMF CPI monthly, World Bank annual if newer) ...")
    annual = timeseries_store.read(paths).series.get(INFLATION_ID, {})
    existing = {iso3: c["metrics"][INFLATION_ID] for iso3, c in countries.items() if INFLATION_ID in c["metrics"]}
    inflation = freshest_inflation(ImfClient(http).inflation(), annual, today, existing)
    for country in countries.values():
        country["metrics"].pop(INFLATION_ID, None)
    n_inf = _patch_values(countries, INFLATION_ID, inflation)
    print(f"  {n_inf} countries with inflation from the last {MAX_INFLATION_AGE_YEARS} years")

    print("-> Policy rates (BIS WS_CBPOL, daily) ...")
    rates = recent_policy_rates(bis.fetch_policy_rates(http, iso2_to_iso3), today)
    for country in countries.values():
        country["metrics"].pop(POLICY_RATE.id, None)
        country["metrics"].pop(REAL_POLICY_RATE.id, None)
    n_rate = _patch_values(countries, POLICY_RATE.id, rates)
    print(f"  {n_rate} countries with a policy rate updated in the last {MAX_POLICY_RATE_AGE_MONTHS} months")

    n_real = _patch_values(countries, REAL_POLICY_RATE.id, real_policy_rates(countries))
    print(f"  {n_real} countries with a real policy rate")
    extra = [(REAL_POLICY_RATE, REAL_POLICY_RATE_SOURCE)]

    print("-> Euro-area 10Y yields (Eurostat irt_lt_mcby_m) ...")
    try:
        since = f"{date.today().year - 1}-01"
        spreads = eurostat.spreads_vs_bund(eurostat.fetch_yields(http, since))
    except (requests.RequestException, KeyError, ValueError) as exc:
        # Keep the committed values rather than publishing a half-built spread.
        print(f"  WARNING: Eurostat unavailable ({exc}); spread left unchanged")
        spreads = {}
    if spreads:
        for country in countries.values():  # a series can drop out (e.g. it froze)
            country["metrics"].pop(EURO_SPREAD.id, None)
        n_spread = _patch_values(countries, EURO_SPREAD.id, spreads)
        print(f"  {n_spread} euro-area countries with a spread vs Bund")
    if spreads or any(m["id"] == EURO_SPREAD.id for m in snap["metrics"]):
        extra.append((EURO_SPREAD, EURO_SPREAD_SOURCE))

    _patch_metric_meta(snap, extra)
    dropped = _drop_non_finite(snap)
    if dropped:
        print(f"  {dropped} nicht-endliche Werte bereinigt")

    # allow_nan=False makes the dump fail loudly if any NaN/Inf slipped through.
    write_json(paths.snapshot, snap, allow_nan=False)
    print("✓ snapshot.json gepatcht (Inflation aktuell, Leitzins ergänzt)")
    return 0
