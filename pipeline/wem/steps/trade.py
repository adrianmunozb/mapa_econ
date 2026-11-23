"""Bilateral export flows from the IMF IMTS API → trade.json.

For each reporter country we pull goods exports (FOB, USD) to all partners for the
latest year, keep the top partners, and store them for the trade-network view.

Usage:  python -m wem trade             full run (≈217 reporters, a couple minutes)
        python -m wem trade --probe USA inspect one reporter's parsed partners
"""

from __future__ import annotations

import time
from datetime import datetime, timezone

from ..catalog import sources
from ..http import HttpClient
from ..jsonio import file_kb, read_json, write_json
from ..paths import Paths
from ..providers.imf import ImfClient

YEAR = 2024
TOP_N = 15
MIN_YEAR = 2022
WORLD_AGGREGATE = "G001"
REQUEST_DELAY = 0.4  # ~2.5 req/s, within IMF guidance (~10 / 5 s)


def top_partners(iso: str, partners: list[tuple[str, float, int]], valid: set[str]) -> dict | None:
    """Flow record for one reporter, or None when no usable partner remains."""
    total = next((v for p, v, y in partners if p == WORLD_AGGREGATE), None)
    clean = [
        (p, v, y)
        for p, v, y in partners
        if len(p) == 3 and p.isalpha() and p in valid and p != iso and y >= MIN_YEAR
    ]
    clean.sort(key=lambda x: -x[1])
    top = clean[:TOP_N]
    if not top:
        return None
    return {
        "total": total if total is not None else sum(v for _, v, _ in clean),
        "year": max(y for _, _, y in top),
        "partners": [{"p": p, "v": v} for p, v, _ in top],
    }


def run(paths: Paths, args=()) -> int:
    imf = ImfClient(HttpClient("WorldEconomicMap/0.1 (trade pipeline)", backoff=1.0))

    if len(args) >= 2 and args[0] == "--probe":
        iso = args[1].upper()
        data = imf.exports(iso)
        data.sort(key=lambda x: -x[1])
        print(f"{iso}: {len(data)} Partner-Reihen")
        for p, v, y in data[:12]:
            print(f"  {p}: {v:,.0f} ({y})")
        return 0

    valid = {c["iso3"] for c in read_json(paths.snapshot)["countries"]}
    reporters = sorted(valid)
    n = len(reporters)

    flows: dict[str, dict] = {}
    for i, iso in enumerate(reporters, 1):
        try:
            partners = imf.exports(iso)
        except Exception as exc:  # keep going; one bad reporter shouldn't abort
            print(f"  [{i}/{n}] {iso} FEHLER: {exc}")
            time.sleep(REQUEST_DELAY)
            continue
        flow = top_partners(iso, partners, valid)
        if flow:
            flows[iso] = flow
        if i % 25 == 0:
            print(f"  [{i}/{n}] … {len(flows)} Länder mit Daten")
        time.sleep(REQUEST_DELAY)

    write_json(paths.trade, {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "year": YEAR,
        "source": sources.IMF_TRADE.to_dict(),
        "flows": flows,
    })
    print(f"✓ {len(flows)}/{n} Länder mit Handelsdaten · trade.json ({file_kb(paths.trade):.0f} KB)")
    return 0
