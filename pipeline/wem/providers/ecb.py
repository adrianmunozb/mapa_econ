"""ECB Data Portal: key interest rates (used by ``wem verify`` only). No API key."""

from __future__ import annotations

import csv
import io

from ..http import HttpClient

URL = "https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.{rate}.LEV"
DEPOSIT_FACILITY = "DFR"


def parse_latest(text: str) -> tuple[str, float] | None:
    """``(date, value)`` of the last row of an ECB ``csvdata`` response."""
    rows = [r for r in csv.DictReader(io.StringIO(text)) if (r.get("OBS_VALUE") or "").strip()]
    if not rows:
        return None
    last = max(rows, key=lambda r: r["TIME_PERIOD"])
    return last["TIME_PERIOD"], float(last["OBS_VALUE"])


def fetch_latest(http: HttpClient, rate: str = DEPOSIT_FACILITY) -> tuple[str, float] | None:
    resp = http.get(URL.format(rate=rate), {"lastNObservations": 1, "format": "csvdata"})
    resp.raise_for_status()
    return parse_latest(resp.text)
