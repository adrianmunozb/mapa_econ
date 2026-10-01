"""DOSE v2.11 reader: reported sub-national economic output, all years kept."""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path


def number(value: str | None) -> float | None:
    if value is None or not value.strip():
        return None
    try:
        result = float(value)
        return result if result == result and abs(result) != float("inf") else None
    except ValueError:
        return None


def load_regions(csv_path: Path) -> dict[str, dict[str, dict]]:
    """``{iso3: {region_id: {id, name, values: {year: metrics}}}}`` (every year preserved
    so region panels can show a real time series)."""
    regions_by_country: dict[str, dict[str, dict]] = defaultdict(dict)
    with csv_path.open("r", encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            iso3 = row["GID_0"].strip()
            region_id = row["GID_1"].strip()
            region_name = row["region"].strip()
            year = row["year"].strip()
            pop = number(row.get("pop"))
            pc_usd = number(row.get("grp_pc_usd"))
            pc_usd_2015 = number(row.get("grp_pc_usd_2015"))
            total_lcu = number(row.get("grp_lcu"))
            metrics = {
                "gdpPerCapitaUsd": pc_usd,
                "gdpPerCapitaUsd2015": pc_usd_2015,
                "gdpTotalLocalCurrency": total_lcu,
                "population": pop,
                "gdpTotalUsd": pc_usd * pop if pc_usd is not None and pop is not None else None,
            }
            metrics = {key: value for key, value in metrics.items() if value is not None}
            entry = regions_by_country[iso3].setdefault(
                region_id,
                {"id": region_id, "name": region_name, "values": {}},
            )
            if metrics:
                entry["values"][year] = metrics
    return regions_by_country
