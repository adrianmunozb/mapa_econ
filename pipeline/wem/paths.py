"""Filesystem layout, injectable so steps can run against a temporary directory."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Paths:
    root: Path

    @classmethod
    def default(cls) -> "Paths":
        return cls(Path(__file__).resolve().parents[2])

    @property
    def out_dir(self) -> Path:
        """Static data served by the frontend."""
        return self.root / "app" / "public" / "data"

    @property
    def raw_dir(self) -> Path:
        """Local download cache (gitignored)."""
        return self.root / "data" / "raw"

    @property
    def csv_dir(self) -> Path:
        """Committed CSV exports (one history file per indicator)."""
        return self.root / "data" / "csv"

    @property
    def snapshot(self) -> Path:
        return self.out_dir / "snapshot.json"

    @property
    def countries_geojson(self) -> Path:
        return self.out_dir / "countries.geojson"

    @property
    def timeseries(self) -> Path:
        return self.out_dir / "timeseries.json"

    @property
    def trade(self) -> Path:
        return self.out_dir / "trade.json"

    @property
    def trade_products(self) -> Path:
        return self.out_dir / "trade_products.json"
