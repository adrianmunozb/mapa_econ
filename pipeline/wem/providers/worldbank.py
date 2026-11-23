"""World Bank Open Data (indicators API v2)."""

from __future__ import annotations

from ..catalog import sources
from ..http import HttpClient

BASE = "https://api.worldbank.org/v2"


def parse_countries(rows: list[dict]) -> dict[str, dict]:
    """Real countries keyed by ISO3; aggregates (region id "NA") are dropped."""
    countries: dict[str, dict] = {}
    for row in rows:
        if row.get("region", {}).get("id") == "NA":
            continue
        iso3 = row["id"]
        countries[iso3] = {
            "iso3": iso3,
            "iso2": row.get("iso2Code"),
            "name": row["name"],
            "region": row.get("region", {}).get("value"),
            "incomeGroup": row.get("incomeLevel", {}).get("value"),
            "metrics": {},
        }
    return countries


def parse_latest(rows: list[dict]) -> dict[str, dict]:
    """Most recent non-null ``{value, year}`` per country."""
    best: dict[str, tuple[int, float]] = {}
    for row in rows:
        iso3, value = row.get("countryiso3code"), row.get("value")
        if not iso3 or value is None:
            continue
        year = int(row["date"])
        if iso3 not in best or year > best[iso3][0]:
            best[iso3] = (year, value)
    return {iso3: {"value": val, "year": yr} for iso3, (yr, val) in best.items()}


def parse_history(rows: list[dict]) -> dict[str, dict[int, float]]:
    """Sparse ``{iso3: {year: value}}``."""
    out: dict[str, dict[int, float]] = {}
    for row in rows:
        iso3, value = row.get("countryiso3code"), row.get("value")
        if not iso3 or value is None:
            continue
        out.setdefault(iso3, {})[int(row["date"])] = value
    return out


class WorldBankClient:
    source = sources.WORLD_BANK

    def __init__(self, http: HttpClient) -> None:
        self._http = http

    def countries(self) -> dict[str, dict]:
        data = self._http.get_json(f"{BASE}/country", {"format": "json", "per_page": 400})
        return parse_countries(data[1] or [])

    def latest(self, code: str) -> dict[str, dict]:
        """Last 10 years (mrv=10), newest non-null value per country — robust to gaps."""
        data = self._http.get_json(
            f"{BASE}/country/all/indicator/{code}",
            {"format": "json", "mrv": 10, "per_page": 20000},
        )
        return parse_latest(data[1] or [])

    def history(self, code: str, start: int, end: int) -> dict[str, dict[int, float]]:
        data = self._http.get_json(
            f"{BASE}/country/all/indicator/{code}",
            {"format": "json", "date": f"{start}:{end}", "per_page": 20000},
        )
        return parse_history(data[1] or [])
