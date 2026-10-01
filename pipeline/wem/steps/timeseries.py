"""Fetch 2004–2024 history for every metric → timeseries.json.

One request per metric (all countries × all years) keeps this fast. Output is sparse:
only years that have a value are stored.
"""

from __future__ import annotations

from ..catalog import ALL_METRICS, sources
from ..http import HttpClient
from ..jsonio import file_kb, read_json, write_json
from ..paths import Paths
from ..providers.registry import ProviderPool

START_YEAR = 2004
END_YEAR = 2024


def run(paths: Paths, args=()) -> int:
    pool = ProviderPool(HttpClient("WorldEconomicMap/0.1 (data pipeline)"))
    snap = read_json(paths.snapshot)
    valid = {c["iso3"] for c in snap["countries"]}
    in_snapshot = {m["id"] for m in snap["metrics"]}  # optional metrics skipped there stay skipped

    data: dict[str, dict[str, dict[int, float]]] = {}
    for metric in (m for m in ALL_METRICS if m.id in in_snapshot):
        print(f"→ {metric.label} ({metric.indicator_code}) …")
        try:
            history = pool.get(metric.provider).history(metric.indicator_code, START_YEAR, END_YEAR)
        except Exception as exc:
            if not metric.optional:
                raise
            print(f"  ⚠ übersprungen ({metric.id}): {exc}")
            continue
        hits = 0
        for iso3, years in history.items():
            if iso3 not in valid:
                continue
            data.setdefault(iso3, {})[metric.id] = years
            hits += 1
        print(f"  {hits} Länder mit Historie")

    write_json(paths.timeseries, {
        "startYear": START_YEAR,
        "endYear": END_YEAR,
        "source": sources.WORLD_BANK.to_dict(),
        "sources": {m.id: pool.get(m.provider).source.to_dict() for m in ALL_METRICS if m.id in in_snapshot},
        "data": data,
    })
    print(f"✓ timeseries.json ({file_kb(paths.timeseries):.0f} KB, {len(data)} Länder)")
    return 0
