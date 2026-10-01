"""Export the committed JSON data as CSV files for spreadsheets / R / pandas.

Written to ``data/csv/`` (a pure function of snapshot.json + timeseries.json, so it needs
no network and is safe to re-run):

  indicators.csv         one row per metric: label, unit, domain, source, licence, coverage
  latest.csv             one row per country, one column per metric (most recent value)
  history/<metric>.csv   one row per country, one column per year (empty = no value)
"""

from __future__ import annotations

import csv
import shutil
from pathlib import Path

from ..jsonio import read_json
from ..paths import Paths


def _fmt(value) -> str:
    return "" if value is None else repr(value) if isinstance(value, float) else str(value)


def _write(path: Path, header: list[str], rows) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(header)
        writer.writerows(rows)


def history_rows(countries: list[dict], series: dict, metric_id: str, years: range) -> list[list]:
    """Wide rows ``[iso3, country, <value per year>]`` for countries with any value."""
    rows = []
    for c in sorted(countries, key=lambda c: c["iso3"]):
        by_year = series.get(c["iso3"], {}).get(metric_id)
        if not by_year:
            continue
        by_year = {int(y): v for y, v in by_year.items()}  # JSON keys are strings
        rows.append([c["iso3"], c["name"], *(_fmt(by_year.get(y)) for y in years)])
    return rows


def run(paths: Paths, args=()) -> int:
    snap = read_json(paths.snapshot)
    ts = read_json(paths.timeseries)
    countries, metrics = snap["countries"], snap["metrics"]
    years = range(ts["startYear"], ts["endYear"] + 1)
    series = ts["data"]

    out = paths.csv_dir
    history_dir = out / "history"
    if history_dir.exists():
        shutil.rmtree(history_dir)  # drop files of metrics that no longer exist

    written, coverage = 0, {}
    for m in metrics:
        rows = history_rows(countries, series, m["id"], years)
        if not rows:
            continue  # snapshot-only metric (e.g. policy_rate): no annual history
        _write(history_dir / f"{m['id']}.csv", ["iso3", "country", *map(str, years)], rows)
        observed = [y for r in rows for y, v in zip(years, r[2:]) if v != ""]
        coverage[m["id"]] = (min(observed), max(observed), len(rows)) if observed else ("", "", len(rows))
        written += 1

    _write(
        out / "indicators.csv",
        ["id", "label", "label_en", "domain", "unit", "unit_en", "source", "license", "indicator_code",
         "history_first_year", "history_last_year", "history_countries"],
        [
            [m["id"], m["label"], m.get("labelEn", ""), m["domain"], m["unit"], m.get("unitEn", ""),
             m["source"]["name"], m["source"]["license"], m["indicatorCode"], *coverage.get(m["id"], ("", "", ""))]
            for m in metrics
        ],
    )
    ids = [m["id"] for m in metrics]
    _write(
        out / "latest.csv",
        ["iso3", "country", "region", "income_group", *ids],
        [
            [c["iso3"], c["name"], c.get("region") or "", c.get("incomeGroup") or "",
             *(_fmt(c["metrics"].get(i, {}).get("value")) for i in ids)]
            for c in sorted(countries, key=lambda c: c["iso3"])
        ],
    )
    print(f"✓ {written} history CSVs + indicators.csv + latest.csv → {out}")
    return 0
