"""Make the committed data files bilingual without re-fetching from the APIs.

Adds English metric fields (labelEn, shortLabelEn, unitEn, descriptionEn) to
snapshot.json and English HS2 names (namesEn) to trade_products.json, using the
catalog as the source of truth. Idempotent.
"""

from __future__ import annotations

from ..catalog import HS2_NAMES_EN, INFLATION_ID, INFLATION_OVERRIDES, POLICY_RATE, WORLD_BANK_METRICS
from ..jsonio import read_json, write_json
from ..paths import Paths

EN_FIELDS = ("labelEn", "shortLabelEn", "unitEn", "descriptionEn")


def english_fields() -> dict[str, dict[str, str]]:
    """``{metric id: {labelEn, ...}}`` for every metric the pipeline can emit.

    Runtime-patched metrics (see steps/current) take precedence over the base catalog.
    """
    fields = {m.id: m.to_dict() for m in WORLD_BANK_METRICS}
    fields[POLICY_RATE.id] = POLICY_RATE.to_dict()
    fields.setdefault(INFLATION_ID, {})["descriptionEn"] = INFLATION_OVERRIDES["descriptionEn"]
    return {mid: {f: d[f] for f in EN_FIELDS if f in d} for mid, d in fields.items()}


def patch_snapshot(paths: Paths) -> int:
    snap = read_json(paths.snapshot)
    english = english_fields()
    n = 0
    for m in snap["metrics"]:
        for f in EN_FIELDS:
            val = english.get(m["id"], {}).get(f)
            if val and not m.get(f):
                m[f] = val
                n += 1
    write_json(paths.snapshot, snap, allow_nan=False)
    print(f"snapshot.json: {n} English fields added")
    return n


def patch_products(paths: Paths) -> int:
    data = read_json(paths.trade_products)
    if "namesEn" not in data:
        data["namesEn"] = HS2_NAMES_EN
        write_json(paths.trade_products, data)
        print("trade_products.json: namesEn added")
        return 1
    print("trade_products.json: already bilingual")
    return 0


def run(paths: Paths, args=()) -> int:
    patch_snapshot(paths)
    patch_products(paths)
    print("✓ data files are bilingual")
    return 0
