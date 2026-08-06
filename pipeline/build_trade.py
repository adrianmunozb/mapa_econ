#!/usr/bin/env python3
"""Fetch bilateral export flows from the IMF IMTS API → app/public/data/trade.json.

For each reporter country we pull goods exports (FOB, USD) to all partners for a
fixed year, keep the top partners, and store them for the trade-network view.

Source: IMF — International Trade in Goods by partner country (IMTS), SDMX 3.0.
No API key required. Country/partner codes are ISO3, so they join directly to our map.

Run:  python build_trade.py            # full run (≈217 reporters, a couple minutes)
      python build_trade.py --probe USA # inspect one reporter's parsed partners
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

IMF_BASE = "https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IMTS/1.0.0"
YEAR = 2024
TOP_N = 15
INDICATOR = "XG_FOB_USD"  # goods exports, FOB, USD

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "public" / "data"
SNAPSHOT = OUT / "snapshot.json"

IMF_SOURCE = {
    "name": "IMF – International Trade in Goods (IMTS)",
    "url": "https://data.imf.org/en/datasets/IMF.STA:IMTS",
    "license": "IMF Terms & Conditions",
}

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "WorldEconomicMap/0.1 (trade pipeline)"})


def get_json(url: str, params: dict | None = None, retries: int = 4):
    last: Exception | None = None
    for i in range(retries):
        try:
            r = SESSION.get(url, params=params, timeout=90)
            if r.status_code == 200:
                return r.json()
            last = RuntimeError(f"HTTP {r.status_code} for {r.url}")
        except requests.RequestException as exc:
            last = exc
        time.sleep(1.0 * (i + 1))
    raise RuntimeError(f"request failed: {url}") from last


def parse_partners(root: dict) -> list[tuple[str, float, int]]:
    """Extract (partner ISO3, value, year) triples from an IMTS SDMX-JSON response.

    Series are keyed by colon-joined dimension indices (e.g. "0:0:5:0"); the
    counterpart index maps through structures[].dimensions.series[].values, and the
    observation key indexes structures[].dimensions.observation[0].values for the year.
    """
    d = root.get("data") or root
    datasets = d.get("dataSets") or []
    if not datasets:
        return []
    series = datasets[0].get("series", {})
    structure = d["structures"][0]["dimensions"]
    dims = structure["series"]
    cp_pos = next((i for i, dim in enumerate(dims) if dim.get("id") == "COUNTERPART_COUNTRY"), None)
    if cp_pos is None:
        return []
    cp_values = dims[cp_pos]["values"]
    time_values = structure["observation"][0]["values"]
    out: list[tuple[str, float, int]] = []
    for key, ser in series.items():
        idxs = [int(x) for x in key.split(":")]
        partner = cp_values[idxs[cp_pos]]["id"]
        for tindex, ov in (ser.get("observations") or {}).items():
            if not ov or ov[0] is None:
                continue
            try:
                value = float(ov[0])
                year = int(time_values[int(tindex)]["value"])
            except (TypeError, ValueError, IndexError, KeyError):
                continue
            out.append((partner, value, year))
    return out


def fetch_reporter(iso3: str) -> list[tuple[str, float, int]]:
    # lastNObservations=1 returns each partner-series' latest annual value (verified
    # to give correct magnitudes; a fixed startPeriod returned partial figures).
    url = f"{IMF_BASE}/{iso3}.{INDICATOR}.*.A"
    root = get_json(url, {"lastNObservations": 1, "format": "jsondata"})
    return parse_partners(root)


def main() -> int:
    if len(sys.argv) > 2 and sys.argv[1] == "--probe":
        iso = sys.argv[2].upper()
        data = fetch_reporter(iso)
        data.sort(key=lambda x: -x[1])
        print(f"{iso}: {len(data)} Partner-Reihen")
        for p, v, y in data[:12]:
            print(f"  {p}: {v:,.0f} ({y})")
        return 0

    snap = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    valid = {c["iso3"] for c in snap["countries"]}
    reporters = sorted(valid)
    n = len(reporters)

    flows: dict[str, dict] = {}
    ok = 0
    for i, iso in enumerate(reporters, 1):
        try:
            partners = fetch_reporter(iso)
        except Exception as exc:  # keep going; one bad reporter shouldn't abort
            print(f"  [{i}/{n}] {iso} FEHLER: {exc}")
            time.sleep(0.4)
            continue

        total = next((v for p, v, y in partners if p == "G001"), None)  # World aggregate
        clean = [
            (p, v, y)
            for p, v, y in partners
            if len(p) == 3 and p.isalpha() and p in valid and p != iso and y >= 2022
        ]
        clean.sort(key=lambda x: -x[1])
        top = clean[:TOP_N]
        if top:
            flows[iso] = {
                "total": total if total is not None else sum(v for _, v, _ in clean),
                "year": max(y for _, _, y in top),
                "partners": [{"p": p, "v": v} for p, v, _ in top],
            }
            ok += 1
        if i % 25 == 0:
            print(f"  [{i}/{n}] … {ok} Länder mit Daten")
        time.sleep(0.4)  # ~2.5 req/s, within IMF guidance (~10 / 5 s)

    result = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "year": YEAR,
        "source": IMF_SOURCE,
        "flows": flows,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "trade.json").write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    kb = (OUT / "trade.json").stat().st_size / 1024
    print(f"✓ {ok}/{n} Länder mit Handelsdaten · trade.json ({kb:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
