"""Patch snapshot.json with CURRENT (monthly/daily) values too fast-moving for annual
World Bank data:

  • Inflation — IMF CPI dataflow (SDMX 3.0), latest monthly YoY %.
  • Policy rate — BIS WS_CBPOL, latest central-bank policy rate, daily.

Both are keyless and use ISO codes. Each patched value carries a precise ``period``
(e.g. "Mai 2026") so the UI shows how fresh it is. Idempotent — safe to re-run.
Requires the ``snapshot`` step to have run first.
"""

from __future__ import annotations

import math

from ..catalog import INFLATION_ID, INFLATION_OVERRIDES, POLICY_RATE, POLICY_RATE_SOURCE, sources
from ..http import HttpClient
from ..jsonio import read_json, write_json
from ..paths import Paths
from ..providers import bis
from ..providers.imf import ImfClient


def _patch_values(countries: dict[str, dict], metric_id: str, values: dict[str, dict]) -> int:
    n = 0
    for iso3, mv in values.items():
        country = countries.get(iso3)
        if country:
            country["metrics"][metric_id] = mv
            n += 1
    return n


def _patch_metric_meta(snap: dict) -> None:
    metrics = snap["metrics"]
    for m in metrics:
        if m["id"] == INFLATION_ID:
            m.update(INFLATION_OVERRIDES)
    if not any(m["id"] == POLICY_RATE.id for m in metrics):
        # Insert right after inflation for a natural ordering.
        idx = next((i for i, m in enumerate(metrics) if m["id"] == INFLATION_ID), len(metrics) - 1)
        metrics.insert(idx + 1, POLICY_RATE.to_dict(POLICY_RATE_SOURCE))
    have = {s["name"] for s in snap["sources"]}
    for src in (sources.IMF_CPI, sources.BIS):
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

    print("→ Lade aktuelle Inflation (IMF CPI, monatlich) …")
    n_inf = _patch_values(countries, INFLATION_ID, ImfClient(http).inflation())
    print(f"  {n_inf} Länder aktualisiert (neuester Monat im Datensatz)")

    print("→ Lade Leitzinsen (BIS WS_CBPOL, täglich) …")
    n_rate = _patch_values(countries, POLICY_RATE.id, bis.fetch_policy_rates(http, iso2_to_iso3))
    print(f"  {n_rate} Länder mit Leitzins")

    _patch_metric_meta(snap)
    dropped = _drop_non_finite(snap)
    if dropped:
        print(f"  {dropped} nicht-endliche Werte bereinigt")

    # allow_nan=False makes the dump fail loudly if any NaN/Inf slipped through.
    write_json(paths.snapshot, snap, allow_nan=False)
    print("✓ snapshot.json gepatcht (Inflation aktuell, Leitzins ergänzt)")
    return 0
