#!/usr/bin/env python3
"""One-off: make the already-committed data files bilingual so the app can default
to English without re-fetching from the APIs.

Adds English metric fields (labelEn, shortLabelEn, unitEn, descriptionEn) to
snapshot.json and English HS2 names (namesEn) to trade_products.json, using the
same source-of-truth catalog from the build scripts.

Run:  python patch_i18n.py   (idempotent)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_snapshot import METRICS, OUT_DIR  # noqa: E402
from build_products import HS2_NAMES_EN  # noqa: E402

EN_FIELDS = ("labelEn", "shortLabelEn", "unitEn", "descriptionEn")

# Metrics added at runtime by build_current.py (not in the build_snapshot catalog).
EXTRA_EN = {
    "policy_rate": {
        "labelEn": "Central bank policy rate",
        "shortLabelEn": "Policy rate",
        "unitEn": "%",
        "descriptionEn": "Central bank policy rate — latest level (BIS).",
    },
    "inflation": {
        "descriptionEn": "Consumer price inflation (year-over-year rate) of the most recent available month.",
    },
}


def patch_snapshot() -> int:
    path = OUT_DIR / "snapshot.json"
    snap = json.loads(path.read_text(encoding="utf-8"))
    by_id = {m["id"]: m for m in METRICS}
    n = 0
    for m in snap["metrics"]:
        en = by_id.get(m["id"], {})
        for f in EN_FIELDS:
            val = EXTRA_EN.get(m["id"], {}).get(f) or en.get(f)
            if val and not m.get(f):
                m[f] = val
                n += 1
    path.write_text(json.dumps(snap, ensure_ascii=False, allow_nan=False), encoding="utf-8")
    print(f"snapshot.json: {n} English fields added")
    return n


def patch_products() -> int:
    path = OUT_DIR / "trade_products.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if "namesEn" not in data:
        data["namesEn"] = HS2_NAMES_EN
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        print("trade_products.json: namesEn added")
        return 1
    print("trade_products.json: already bilingual")
    return 0


if __name__ == "__main__":
    patch_snapshot()
    patch_products()
    print("✓ data files are bilingual")
