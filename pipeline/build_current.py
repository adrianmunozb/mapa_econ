#!/usr/bin/env python3
"""Patch app/public/data/snapshot.json with CURRENT (monthly) values that are too
fast-moving for annual World Bank data:

  • Inflation — IMF CPI dataflow (SDMX 3.0), latest monthly YoY %, data to ~2026-M05.
  • Leitzins (policy rate) — BIS WS_CBPOL, latest central-bank policy rate, daily.

Both are keyless and use ISO codes. Each patched value carries a precise `period`
(e.g. "Mai 2026") so the UI shows how fresh it is. Idempotent — safe to re-run to
refresh just these two indicators without rebuilding the whole snapshot.

Run:  python build_snapshot.py && python build_current.py
"""

from __future__ import annotations

import csv
import io
import json
import math

from build_snapshot import OUT_DIR, SESSION, get_json

IMF_CPI_URL = "https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/CPI/+/*.CPI._T.YOY_PCH_PA_PT.M"
BIS_CBPOL_URL = "https://stats.bis.org/api/v1/data/WS_CBPOL/D.."

IMF_SOURCE = {
    "name": "IMF – Consumer Price Index (CPI)",
    "url": "https://data.imf.org",
    "license": "IMF Terms (Quellenangabe erforderlich)",
}
BIS_SOURCE = {
    "name": "BIS – Central bank policy rates",
    "url": "https://data.bis.org/topics/CBPOL",
    "license": "BIS Terms (Quellenangabe erforderlich)",
}

DE_MONTHS = ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]

# Euro-area members get the ECB rate (BIS area "XM"); their historical pre-euro
# alpha-2 series are frozen and must be ignored.
EA_MEMBERS_ISO3 = [
    "AUT", "BEL", "CYP", "DEU", "EST", "ESP", "FIN", "FRA", "GRC", "HRV",
    "IRL", "ITA", "LTU", "LUX", "LVA", "MLT", "NLD", "PRT", "SVK", "SVN",
]
EA_HISTORIC_A2 = {"AT", "BE", "DE", "ES", "FR", "GR", "HR", "IT", "NL", "PT"}

# IMF uses UVK for Kosovo; the World Bank (our join key) uses XKX.
IMF_ISO_FIX = {"UVK": "XKX"}


def imf_period(p: str) -> tuple[str, int]:
    """'2026-M05' -> ('Mai 2026', 2026)."""
    year, month = p.split("-M")
    return f"{DE_MONTHS[int(month)]} {year}", int(year)


def bis_period(p: str) -> tuple[str, int]:
    """'2026-06-16' -> ('Jun 2026', 2026)."""
    parts = p.split("-")
    year, month = int(parts[0]), int(parts[1])
    return f"{DE_MONTHS[month]} {year}", year


def fetch_imf_inflation() -> dict[str, dict]:
    """{iso3: {value, year, period}} latest monthly YoY CPI inflation."""
    root = get_json(
        IMF_CPI_URL,
        {"lastNObservations": 1, "format": "sdmx-json", "dimensionAtObservation": "TIME_PERIOD"},
    )
    d = root.get("data") or root
    series = d["dataSets"][0]["series"]
    dims = d["structures"][0]["dimensions"]["series"]
    country_pos = next(i for i, dim in enumerate(dims) if dim.get("id") == "COUNTRY")
    country_values = dims[country_pos]["values"]
    time_values = d["structures"][0]["dimensions"]["observation"][0]["values"]

    out: dict[str, dict] = {}
    for key, ser in series.items():
        idxs = [int(x) for x in key.split(":")]
        iso = country_values[idxs[country_pos]]["id"]
        iso = IMF_ISO_FIX.get(iso, iso)
        for tindex, ov in (ser.get("observations") or {}).items():
            if not ov or ov[0] is None:
                continue
            value = float(ov[0])
            if not math.isfinite(value):
                continue
            label, year = imf_period(time_values[int(tindex)]["value"])
            out[iso] = {"value": value, "year": year, "period": label}
    return out


def fetch_bis_rates(iso2_to_iso3: dict[str, str]) -> dict[str, dict]:
    """{iso3: {value, year, period}} latest central-bank policy rate."""
    resp = SESSION.get(BIS_CBPOL_URL, params={"lastNObservations": 1, "format": "csv"}, timeout=90)
    resp.raise_for_status()
    reader = csv.DictReader(io.StringIO(resp.text))

    out: dict[str, dict] = {}
    euro: dict | None = None
    for row in reader:
        area = (row.get("REF_AREA") or "").strip()
        raw = (row.get("OBS_VALUE") or "").strip()
        period = (row.get("TIME_PERIOD") or "").strip()
        if not area or not raw:
            continue
        try:
            value = float(raw)
        except ValueError:
            continue
        if not math.isfinite(value):
            continue
        label, year = bis_period(period)
        if area == "XM":
            euro = {"value": value, "year": year, "period": label}
            continue
        if area in EA_HISTORIC_A2:
            continue  # frozen pre-euro series
        iso3 = iso2_to_iso3.get(area) or {"HK": "HKG", "GB": "GBR"}.get(area)
        if iso3:
            out[iso3] = {"value": value, "year": year, "period": label}
    if euro:
        for iso3 in EA_MEMBERS_ISO3:
            out[iso3] = dict(euro)
    return out


def main() -> int:
    snap_path = OUT_DIR / "snapshot.json"
    snap = json.loads(snap_path.read_text(encoding="utf-8"))
    countries = {c["iso3"]: c for c in snap["countries"]}
    iso2_to_iso3 = {c["iso2"]: c["iso3"] for c in snap["countries"] if c.get("iso2")}

    print("→ Lade aktuelle Inflation (IMF CPI, monatlich) …")
    inflation = fetch_imf_inflation()
    n_inf = 0
    for iso3, mv in inflation.items():
        c = countries.get(iso3)
        if c:
            c["metrics"]["inflation"] = mv
            n_inf += 1
    print(f"  {n_inf} Länder aktualisiert (neuester Monat im Datensatz)")

    print("→ Lade Leitzinsen (BIS WS_CBPOL, täglich) …")
    rates = fetch_bis_rates(iso2_to_iso3)
    n_rate = 0
    for iso3, mv in rates.items():
        c = countries.get(iso3)
        if c:
            c["metrics"]["policy_rate"] = mv
            n_rate += 1
    print(f"  {n_rate} Länder mit Leitzins")

    # Update the inflation metric meta (now IMF-sourced) and add the policy-rate metric.
    metrics = snap["metrics"]
    for m in metrics:
        if m["id"] == "inflation":
            m["source"] = IMF_SOURCE
            m["description"] = "Verbraucherpreisinflation (Jahresrate) des aktuellsten verfügbaren Monats."
            m["descriptionEn"] = "Consumer price inflation (year-over-year rate) of the most recent available month."
            m["indicatorCode"] = "CPI:YOY_PCH_PA_PT"

    if not any(m["id"] == "policy_rate" for m in metrics):
        # Insert right after inflation for a natural ordering.
        idx = next((i for i, m in enumerate(metrics) if m["id"] == "inflation"), len(metrics) - 1)
        metrics.insert(idx + 1, {
            "id": "policy_rate",
            "label": "Leitzins",
            "labelEn": "Central bank policy rate",
            "shortLabel": "Leitzins",
            "shortLabelEn": "Policy rate",
            "unit": "%",
            "unitEn": "%",
            "description": "Leitzins der Zentralbank — aktueller Stand (BIS).",
            "descriptionEn": "Central bank policy rate — latest level (BIS).",
            "domain": "economy",
            "format": "percent",
            "higherIsBetter": None,
            "source": BIS_SOURCE,
            "indicatorCode": "WS_CBPOL",
        })

    # Register the new sources.
    have = {s["name"] for s in snap["sources"]}
    for src in (IMF_SOURCE, BIS_SOURCE):
        if src["name"] not in have:
            snap["sources"].append(src)

    # Drop any non-finite metric values (NaN/Inf is invalid JSON for the browser
    # and also cleans anything left by an earlier run).
    dropped = 0
    for c in snap["countries"]:
        clean = {}
        for k, v in c["metrics"].items():
            val = v.get("value")
            if isinstance(val, (int, float)) and math.isfinite(val):
                clean[k] = v
            else:
                dropped += 1
        c["metrics"] = clean
    if dropped:
        print(f"  {dropped} nicht-endliche Werte bereinigt")

    # allow_nan=False makes the dump fail loudly if any NaN/Inf slipped through.
    snap_path.write_text(json.dumps(snap, ensure_ascii=False, allow_nan=False), encoding="utf-8")
    print("✓ snapshot.json gepatcht (Inflation aktuell, Leitzins ergänzt)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
