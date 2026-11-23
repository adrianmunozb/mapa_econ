"""Each country's export composition (top HS2 chapters) from UN Comtrade →
trade_products.json.

Comtrade preview is keyless but returns only codes + values (descriptive text is null),
so HS2 chapter codes are mapped to names locally. Resumable: re-run to fill countries
that were rate-limited or had no recent data. Requires the ``snapshot`` step first.
"""

from __future__ import annotations

import time

from ..catalog import HS2_NAMES_DE, HS2_NAMES_EN, sources
from ..jsonio import file_kb, read_json, write_json
from ..paths import Paths
from ..providers.comtrade import ComtradeClient, RateLimited

TOP_N = 8
CHECKPOINT_EVERY = 10
REQUEST_DELAY = 1.1


def _load_existing(path) -> dict:
    if not path.exists():
        return {}
    try:
        return read_json(path).get("data", {})
    except Exception:
        return {}


def run(paths: Paths, args=()) -> int:
    comtrade = ComtradeClient()
    valid_iso3 = {c["iso3"] for c in read_json(paths.snapshot)["countries"]}

    print("→ Lade Comtrade-Reporter-Referenz …")
    iso3_to_m49 = comtrade.reporters(valid_iso3)
    print(f"  {len(iso3_to_m49)} Länder mit Comtrade-Reporter-Code")

    out_path = paths.trade_products
    data = dict(_load_existing(out_path))
    todo = [iso3 for iso3 in sorted(iso3_to_m49) if iso3 not in data]
    print(f"→ {len(todo)} Länder zu laden ({len(data)} bereits vorhanden)")

    def save() -> None:
        write_json(out_path, {
            "source": sources.COMTRADE.to_dict(),
            "names": HS2_NAMES_DE,
            "namesEn": HS2_NAMES_EN,
            "data": data,
        })

    stopped = False
    for i, iso3 in enumerate(todo, 1):
        try:
            year, items = comtrade.products(iso3_to_m49[iso3])
        except RateLimited as exc:
            print(f"  ⚠ abgebrochen bei {iso3} ({exc}). Fortschritt gespeichert — Skript erneut ausführen, um weiterzumachen.", flush=True)
            stopped = True
            break
        if items:
            items.sort(key=lambda x: -x[1])
            data[iso3] = {
                "year": year,
                "total": sum(v for _, v in items),
                "products": [{"c": c, "v": v} for c, v in items[:TOP_N]],
            }
        if i % CHECKPOINT_EVERY == 0:
            print(f"  [{i}/{len(todo)}] {len(data)} Länder gesamt", flush=True)
            save()  # checkpoint
        time.sleep(REQUEST_DELAY)

    save()
    status = "Teil-Lauf" if stopped else "fertig"
    print(f"✓ {status}: {len(data)} Länder mit Exportgütern · trade_products.json ({file_kb(out_path):.0f} KB)", flush=True)
    return 0
