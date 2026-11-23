"""Fetch 2004–2024 history for every metric → timeseries/<metric>.json + index.json.

One request per metric (all countries × all years) keeps this fast. Output is sparse:
only years that have a value are stored; metrics without any history get no file.
"""

from __future__ import annotations

from ..catalog import ALL_METRICS, sources
from ..http import HttpClient
from .. import timeseries_store as store
from ..jsonio import read_json
from ..paths import Paths
from ..providers.registry import ProviderPool

START_YEAR = 2004
END_YEAR = 2024


def run(paths: Paths, args=()) -> int:
    pool = ProviderPool(HttpClient("WorldEconomicMap/0.1 (data pipeline)"))
    snap = read_json(paths.snapshot)
    valid = {c["iso3"] for c in snap["countries"]}
    in_snapshot = {m["id"] for m in snap["metrics"]}  # optional metrics skipped there stay skipped

    series: dict[str, dict[str, dict[int, float]]] = {}  # metric_id -> iso3 -> year -> value
    for metric in (m for m in ALL_METRICS if m.id in in_snapshot):
        print(f"→ {metric.label} ({metric.indicator_code}) …")
        try:
            history = pool.get(metric.provider).history(metric.indicator_code, START_YEAR, END_YEAR)
        except Exception as exc:
            if not metric.optional:
                raise
            print(f"  ⚠ übersprungen ({metric.id}): {exc}")
            continue
        by_country = {iso3: years for iso3, years in history.items() if iso3 in valid}
        if by_country:
            series[metric.id] = by_country
        print(f"  {len(by_country)} Länder mit Historie")

    store.write(paths, store.Timeseries(
        start_year=START_YEAR,
        end_year=END_YEAR,
        source=sources.WORLD_BANK.to_dict(),
        sources={m.id: pool.get(m.provider).source.to_dict() for m in ALL_METRICS if m.id in series},
        series=series,
    ))
    countries = {iso3 for by_country in series.values() for iso3 in by_country}
    print(f"✓ timeseries/ ({len(series)} Metriken, {len(countries)} Länder)")
    return 0
