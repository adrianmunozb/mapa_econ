"""On-disk layout of the yearly history, split per metric so the app loads only what it shows.

    timeseries/index.json        {startYear, endYear, source, sources: {metric: source}, metrics: [ids]}
    timeseries/<metric_id>.json  {iso3: {year: value}}   (sparse)
"""

from __future__ import annotations

import shutil
from dataclasses import dataclass, field

from .jsonio import read_json, write_json
from .paths import Paths

INDEX = "index.json"


@dataclass
class Timeseries:
    start_year: int
    end_year: int
    source: dict  # default/primary source (World Bank), kept for older readers
    sources: dict[str, dict] = field(default_factory=dict)  # per-metric provenance
    series: dict[str, dict[str, dict]] = field(default_factory=dict)  # metric_id -> iso3 -> year -> value

    @property
    def years(self) -> range:
        return range(self.start_year, self.end_year + 1)


def write(paths: Paths, ts: Timeseries) -> None:
    """Replace the whole timeseries directory (drops files of metrics that no longer exist)."""
    directory = paths.timeseries_dir
    if directory.exists():
        shutil.rmtree(directory)
    for metric_id, by_country in ts.series.items():
        write_json(directory / f"{metric_id}.json", by_country)
    write_json(directory / INDEX, {
        "startYear": ts.start_year,
        "endYear": ts.end_year,
        "source": ts.source,
        "sources": {m: ts.sources[m] for m in ts.series if m in ts.sources},
        "metrics": list(ts.series),
    })


def read(paths: Paths) -> Timeseries:
    directory = paths.timeseries_dir
    index = read_json(directory / INDEX)
    return Timeseries(
        start_year=index["startYear"],
        end_year=index["endYear"],
        source=index["source"],
        sources=index.get("sources", {}),
        series={m: read_json(directory / f"{m}.json") for m in index["metrics"]},
    )
