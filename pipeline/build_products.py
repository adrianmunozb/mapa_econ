#!/usr/bin/env python3
"""Fetch each country's export product composition (top HS2 chapters) from UN Comtrade
→ app/public/data/trade_products.json.

Comtrade preview is keyless but returns only codes + values (descriptive text is null),
so we map HS2 chapter codes to German names locally. Aggregate params collapse the
response to one clean row per chapter. Resumable: re-run to fill countries that were
rate-limited or had no recent data.

Run (after build_snapshot):  python build_products.py
"""

from __future__ import annotations

import json
import time

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from build_snapshot import OUT_DIR

PREVIEW = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"
REPORTERS_REF = "https://comtradeapi.un.org/files/v1/app/reference/Reporters.json"
YEARS = [2024, 2023, 2022, 2021]
TOP_N = 8

COMTRADE_SOURCE = {
    "name": "UN Comtrade",
    "url": "https://comtradeplus.un.org",
    "license": "UN Comtrade Terms (Quellenangabe erforderlich)",
}

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "WorldEconomicMap/0.1 (products pipeline)"})
# Transport-level retries absorb transient 429/5xx AND connection errors (e.g. ephemeral
# port exhaustion); the backoff also gives sockets time to recover. Small pool keeps the
# number of simultaneous connections low.
_retry = Retry(total=5, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504], allowed_methods=["GET"])
SESSION.mount("https://", HTTPAdapter(max_retries=_retry, pool_connections=4, pool_maxsize=4))

# HS 2-digit chapters → short German names.
HS2_NAMES = {
    "01": "Lebende Tiere", "02": "Fleisch", "03": "Fisch & Meeresfrüchte",
    "04": "Milch, Eier, Honig", "05": "Tierische Erzeugnisse", "06": "Pflanzen & Blumen",
    "07": "Gemüse", "08": "Früchte & Nüsse", "09": "Kaffee, Tee, Gewürze",
    "10": "Getreide", "11": "Mehl & Malz", "12": "Ölsaaten",
    "13": "Gummen & Harze", "14": "Pflanzl. Flechtstoffe", "15": "Fette & Öle",
    "16": "Fleisch-/Fischwaren", "17": "Zucker & Süßwaren", "18": "Kakao & Schokolade",
    "19": "Backwaren", "20": "Gemüse-/Obstwaren", "21": "Lebensmittelzubereitungen",
    "22": "Getränke & Spirituosen", "23": "Futtermittel", "24": "Tabak",
    "25": "Salz, Steine, Gips", "26": "Erze & Schlacken", "27": "Mineralöl, Gas & Brennstoffe",
    "28": "Anorgan. Chemikalien", "29": "Organ. Chemikalien", "30": "Pharmazeutika",
    "31": "Düngemittel", "32": "Farb- & Gerbstoffe", "33": "Kosmetik & Parfüm",
    "34": "Seifen & Waschmittel", "35": "Eiweiße & Klebstoffe", "36": "Sprengstoffe",
    "37": "Fotochemie", "38": "Sonstige Chemie", "39": "Kunststoffe",
    "40": "Kautschuk & Gummi", "41": "Häute & Leder", "42": "Lederwaren & Taschen",
    "43": "Pelze", "44": "Holz & Holzwaren", "45": "Kork",
    "46": "Flecht- & Korbwaren", "47": "Zellstoff", "48": "Papier & Pappe",
    "49": "Bücher & Drucke", "50": "Seide", "51": "Wolle",
    "52": "Baumwolle", "53": "Pflanzl. Spinnstoffe", "54": "Synthetikfasern (Filament)",
    "55": "Synthetikfasern (Spinn)", "56": "Watte, Filz, Vliese", "57": "Teppiche",
    "58": "Spezialgewebe", "59": "Technische Textilien", "60": "Gewirke & Gestricke",
    "61": "Bekleidung (gewirkt)", "62": "Bekleidung (gewebt)", "63": "Heimtextilien",
    "64": "Schuhe", "65": "Kopfbedeckungen", "66": "Schirme",
    "67": "Federn & Kunstblumen", "68": "Steinwaren & Zement", "69": "Keramik",
    "70": "Glas & Glaswaren", "71": "Edelsteine & Schmuck", "72": "Eisen & Stahl",
    "73": "Eisen-/Stahlwaren", "74": "Kupfer", "75": "Nickel",
    "76": "Aluminium", "78": "Blei", "79": "Zink",
    "80": "Zinn", "81": "Andere unedle Metalle", "82": "Werkzeuge & Besteck",
    "83": "Metallwaren", "84": "Maschinen & Geräte", "85": "Elektrotechnik & Elektronik",
    "86": "Schienenfahrzeuge", "87": "Fahrzeuge (Kfz)", "88": "Luftfahrzeuge",
    "89": "Schiffe & Boote", "90": "Optik & Messtechnik", "91": "Uhren",
    "92": "Musikinstrumente", "93": "Waffen & Munition", "94": "Möbel & Beleuchtung",
    "95": "Spielzeug & Sport", "96": "Diverse Waren", "97": "Kunst & Antiquitäten",
    "99": "Sonstiges / k.A.",
}

# HS 2-digit chapters → short English names (the app's default language).
HS2_NAMES_EN = {
    "01": "Live animals", "02": "Meat", "03": "Fish & seafood",
    "04": "Dairy, eggs, honey", "05": "Animal products", "06": "Plants & flowers",
    "07": "Vegetables", "08": "Fruit & nuts", "09": "Coffee, tea, spices",
    "10": "Cereals", "11": "Flour & malt", "12": "Oil seeds",
    "13": "Gums & resins", "14": "Vegetable plaiting materials", "15": "Fats & oils",
    "16": "Prepared meat/fish", "17": "Sugar & confectionery", "18": "Cocoa & chocolate",
    "19": "Bakery products", "20": "Prepared vegetables/fruit", "21": "Food preparations",
    "22": "Beverages & spirits", "23": "Animal feed", "24": "Tobacco",
    "25": "Salt, stone, plaster", "26": "Ores & slag", "27": "Mineral fuels, gas & oils",
    "28": "Inorganic chemicals", "29": "Organic chemicals", "30": "Pharmaceuticals",
    "31": "Fertilizers", "32": "Dyes & pigments", "33": "Cosmetics & perfume",
    "34": "Soaps & detergents", "35": "Proteins & adhesives", "36": "Explosives",
    "37": "Photo chemicals", "38": "Other chemicals", "39": "Plastics",
    "40": "Rubber", "41": "Hides & leather", "42": "Leather goods & bags",
    "43": "Fur", "44": "Wood & wood products", "45": "Cork",
    "46": "Basketry & wickerwork", "47": "Pulp", "48": "Paper & cardboard",
    "49": "Books & printed matter", "50": "Silk", "51": "Wool",
    "52": "Cotton", "53": "Vegetable textile fibers", "54": "Synthetic filaments",
    "55": "Synthetic staple fibers", "56": "Wadding, felt, nonwovens", "57": "Carpets",
    "58": "Special woven fabrics", "59": "Technical textiles", "60": "Knitted fabrics",
    "61": "Knitted apparel", "62": "Woven apparel", "63": "Home textiles",
    "64": "Footwear", "65": "Headgear", "66": "Umbrellas",
    "67": "Feathers & artificial flowers", "68": "Stone & cement", "69": "Ceramics",
    "70": "Glass & glassware", "71": "Gems & jewelry", "72": "Iron & steel",
    "73": "Iron/steel articles", "74": "Copper", "75": "Nickel",
    "76": "Aluminum", "78": "Lead", "79": "Zinc",
    "80": "Tin", "81": "Other base metals", "82": "Tools & cutlery",
    "83": "Metal articles", "84": "Machinery & appliances", "85": "Electronics & electrical",
    "86": "Rail vehicles", "87": "Motor vehicles", "88": "Aircraft",
    "89": "Ships & boats", "90": "Optics & measuring", "91": "Watches",
    "92": "Musical instruments", "93": "Arms & ammunition", "94": "Furniture & lighting",
    "95": "Toys & sport", "96": "Miscellaneous goods", "97": "Art & antiques",
    "99": "Other / n/a",
}


class RateLimited(Exception):
    """Raised when the request keeps failing after transport-level retries."""


def fetch_products(m49: int):
    """Return (year, [(cmdCode, value), ...]) for a reporter, trying recent years.

    Raises RateLimited if even the retrying adapter can't get through (so the caller
    can stop gracefully and checkpoint instead of losing progress).
    """
    for year in YEARS:
        params = {
            "reporterCode": m49, "period": year, "partnerCode": 0,
            "partner2Code": 0, "customsCode": "C00", "motCode": 0,
            "cmdCode": "AG2", "flowCode": "X",
        }
        try:
            resp = SESSION.get(PREVIEW, params=params, timeout=90)
        except requests.RequestException as exc:
            raise RateLimited(str(exc)) from exc
        if resp.status_code != 200:
            continue
        rows = (resp.json() or {}).get("data") or []
        items = [
            (r["cmdCode"], float(r["primaryValue"]))
            for r in rows
            if r.get("cmdCode") not in ("TOTAL", "ALL")
            and r.get("primaryValue") not in (None, 0)
        ]
        if items:
            return year, items
    return None, []


def main() -> int:
    snap = json.loads((OUT_DIR / "snapshot.json").read_text(encoding="utf-8"))
    valid_iso3 = {c["iso3"] for c in snap["countries"]}

    print("→ Lade Comtrade-Reporter-Referenz …")
    ref = SESSION.get(REPORTERS_REF, timeout=60).json()
    rows = ref["results"] if isinstance(ref, dict) and "results" in ref else ref
    iso3_to_m49: dict[str, int] = {}
    for row in rows:
        if row.get("isGroup"):
            continue
        iso3 = row.get("reporterCodeIsoAlpha3")
        if iso3 and iso3 in valid_iso3:
            iso3_to_m49[iso3] = int(row["reporterCode"])
    print(f"  {len(iso3_to_m49)} Länder mit Comtrade-Reporter-Code")

    out_path = OUT_DIR / "trade_products.json"
    existing = {}
    if out_path.exists():
        try:
            existing = json.loads(out_path.read_text(encoding="utf-8")).get("data", {})
        except Exception:
            existing = {}

    data = dict(existing)
    todo = [iso3 for iso3 in sorted(iso3_to_m49) if iso3 not in data]
    print(f"→ {len(todo)} Länder zu laden ({len(data)} bereits vorhanden)")

    def save():
        out_path.write_text(
            json.dumps(
                {"source": COMTRADE_SOURCE, "names": HS2_NAMES, "namesEn": HS2_NAMES_EN, "data": data},
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

    stopped = False
    for i, iso3 in enumerate(todo, 1):
        try:
            year, items = fetch_products(iso3_to_m49[iso3])
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
        if i % 10 == 0:
            print(f"  [{i}/{len(todo)}] {len(data)} Länder gesamt", flush=True)
            save()  # checkpoint
        time.sleep(1.1)

    save()
    kb = out_path.stat().st_size / 1024
    status = "Teil-Lauf" if stopped else "fertig"
    print(f"✓ {status}: {len(data)} Länder mit Exportgütern · trade_products.json ({kb:.0f} KB)", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
