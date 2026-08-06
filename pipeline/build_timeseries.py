#!/usr/bin/env python3
"""Fetch 2004–2024 history for every metric → app/public/data/timeseries.json.

Reuses the metric catalog + HTTP helper from build_snapshot. One request per metric
(all countries × all years) keeps this fast. Output is sparse: only years that have
a value are stored.

Run:  python build_timeseries.py
"""

from __future__ import annotations

import json
from pathlib import Path

from build_snapshot import METRICS, WB_BASE, WB_SOURCE, OUT_DIR, get_json

START_YEAR = 2004
END_YEAR = 2024


def fetch_history(code: str) -> dict[str, dict[int, float]]:
    """Return {iso3: {year: value}} for one indicator across the window."""
    data = get_json(
        f"{WB_BASE}/country/all/indicator/{code}",
        {"format": "json", "date": f"{START_YEAR}:{END_YEAR}", "per_page": 20000},
    )
    out: dict[str, dict[int, float]] = {}
    for row in (data[1] or []):
        iso3 = row.get("countryiso3code")
        value = row.get("value")
        if not iso3 or value is None:
            continue
        out.setdefault(iso3, {})[int(row["date"])] = value
    return out


def main() -> int:
    snap = json.loads((OUT_DIR / "snapshot.json").read_text(encoding="utf-8"))
    valid = {c["iso3"] for c in snap["countries"]}

    data: dict[str, dict[str, dict[int, float]]] = {}
    for metric in METRICS:
        print(f"→ {metric['label']} ({metric['indicatorCode']}) …")
        history = fetch_history(metric["indicatorCode"])
        hits = 0
        for iso3, years in history.items():
            if iso3 not in valid:
                continue
            data.setdefault(iso3, {})[metric["id"]] = years
            hits += 1
        print(f"  {hits} Länder mit Historie")

    result = {
        "startYear": START_YEAR,
        "endYear": END_YEAR,
        "source": WB_SOURCE,
        "data": data,
    }
    (OUT_DIR / "timeseries.json").write_text(
        json.dumps(result, ensure_ascii=False), encoding="utf-8"
    )
    kb = (OUT_DIR / "timeseries.json").stat().st_size / 1024
    print(f"✓ timeseries.json ({kb:.0f} KB, {len(data)} Länder)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
