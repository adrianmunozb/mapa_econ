"""UN Comtrade public preview API: export composition by HS2 chapter. No API key."""

from __future__ import annotations

import requests
from urllib3.util.retry import Retry

from ..http import HttpClient

PREVIEW = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"
REPORTERS_REF = "https://comtradeapi.un.org/files/v1/app/reference/Reporters.json"
YEARS = (2024, 2023, 2022, 2021)


class RateLimited(Exception):
    """The request kept failing after transport-level retries."""


def make_http() -> HttpClient:
    """Transport-level retries absorb transient 429/5xx AND connection errors (e.g.
    ephemeral port exhaustion); a small pool keeps simultaneous connections low."""
    retry = Retry(total=5, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504], allowed_methods=["GET"])
    return HttpClient("WorldEconomicMap/0.1 (products pipeline)", transport_retry=retry, pool_size=4)


def parse_products(rows: list[dict]) -> list[tuple[str, float]]:
    return [
        (r["cmdCode"], float(r["primaryValue"]))
        for r in rows
        if r.get("cmdCode") not in ("TOTAL", "ALL") and r.get("primaryValue") not in (None, 0)
    ]


def parse_reporters(ref, valid_iso3: set[str]) -> dict[str, int]:
    """``{iso3: M49 reporter code}`` for non-group reporters we map."""
    rows = ref["results"] if isinstance(ref, dict) and "results" in ref else ref
    out: dict[str, int] = {}
    for row in rows:
        if row.get("isGroup"):
            continue
        iso3 = row.get("reporterCodeIsoAlpha3")
        if iso3 and iso3 in valid_iso3:
            out[iso3] = int(row["reporterCode"])
    return out


class ComtradeClient:
    def __init__(self, http: HttpClient | None = None) -> None:
        self._http = http or make_http()

    def reporters(self, valid_iso3: set[str]) -> dict[str, int]:
        return parse_reporters(self._http.get(REPORTERS_REF, timeout=60).json(), valid_iso3)

    def products(self, m49: int) -> tuple[int | None, list[tuple[str, float]]]:
        """``(year, [(HS2, value), ...])`` for the most recent year with data.

        Raises ``RateLimited`` if even the retrying adapter can't get through, so the
        caller can stop gracefully and checkpoint instead of losing progress.
        """
        for year in YEARS:
            params = {
                "reporterCode": m49, "period": year, "partnerCode": 0,
                "partner2Code": 0, "customsCode": "C00", "motCode": 0,
                "cmdCode": "AG2", "flowCode": "X",
            }
            try:
                resp = self._http.get(PREVIEW, params)
            except requests.RequestException as exc:
                raise RateLimited(str(exc)) from exc
            if resp.status_code != 200:
                continue
            items = parse_products((resp.json() or {}).get("data") or [])
            if items:
                return year, items
        return None, []
