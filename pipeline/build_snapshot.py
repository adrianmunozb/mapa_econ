#!/usr/bin/env python3
"""Build the World Economic Map data snapshot from official sources.

Outputs (committed, served by the frontend at /data/...):
  app/public/data/snapshot.json      normalized metric values, one entry per country
  app/public/data/countries.geojson  Natural Earth borders keyed by canonical ISO3

Every number comes from the World Bank Open Data API (CC BY 4.0). Country borders
come from Natural Earth (public domain). Each metric carries its source + year, so
the frontend can show provenance for every value it displays.

Run:  python build_snapshot.py
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

from geometry import DEFAULT_ADJUSTMENTS, apply_adjustments

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

WB_BASE = "https://api.worldbank.org/v2"

# Natural Earth admin-0 at 1:50m — includes small but economically important
# states (Singapore, Luxembourg, Malta, Bahrain ...) that the 110m file drops.
NE_GEOJSON_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_50m_admin_0_countries.geojson"
)

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "app" / "public" / "data"

WB_SOURCE = {
    "name": "World Bank Open Data",
    "url": "https://data.worldbank.org",
    "license": "CC BY 4.0",
}
NE_SOURCE = {
    "name": "Natural Earth",
    "url": "https://www.naturalearthdata.com",
    "license": "Public Domain",
}

# Metric catalog. `indicatorCode` is the World Bank series; all verified live.
# higherIsBetter drives the color scale direction (None = neutral).
METRICS = [
    {
        "id": "gdp_per_capita",
        "label": "BIP pro Kopf",
        "labelEn": "GDP per capita",
        "shortLabel": "BIP/Kopf",
        "shortLabelEn": "GDP/capita",
        "unit": "US$",
        "unitEn": "US$",
        "description": "BIP pro Einwohner, nominal in aktuellen US-Dollar (ohne Preisniveau-Ausgleich).",
        "descriptionEn": "GDP per capita, nominal in current US dollars (no price-level adjustment).",
        "domain": "economy",
        "format": "currency",
        "higherIsBetter": True,
        "indicatorCode": "NY.GDP.PCAP.CD",
    },
    {
        "id": "gdp_per_capita_ppp",
        "label": "BIP pro Kopf (KKP)",
        "labelEn": "GDP per capita (PPP)",
        "shortLabel": "BIP/Kopf KKP",
        "shortLabelEn": "GDP/capita PPP",
        "unit": "Int$",
        "unitEn": "Int$",
        "description": "BIP pro Kopf zu Kaufkraftparität — gleicht das lokale Preisniveau aus, daher in ärmeren Ländern oft ein Vielfaches des nominalen Werts.",
        "descriptionEn": "GDP per capita at purchasing power parity — evens out local price levels, so often a multiple of the nominal figure in poorer countries.",
        "domain": "economy",
        "format": "currency",
        "higherIsBetter": True,
        "indicatorCode": "NY.GDP.PCAP.PP.CD",
    },
    {
        "id": "gdp_total",
        "label": "BIP gesamt",
        "labelEn": "Total GDP",
        "shortLabel": "BIP",
        "shortLabelEn": "GDP",
        "unit": "US$",
        "unitEn": "US$",
        "description": "Bruttoinlandsprodukt insgesamt, aktuelle US-Dollar.",
        "descriptionEn": "Gross domestic product, current US dollars.",
        "domain": "economy",
        "format": "currency",
        "higherIsBetter": True,
        "indicatorCode": "NY.GDP.MKTP.CD",
    },
    {
        "id": "population",
        "label": "Bevölkerung",
        "labelEn": "Population",
        "shortLabel": "Bevölkerung",
        "shortLabelEn": "Population",
        "unit": "Menschen",
        "unitEn": "people",
        "description": "Gesamtbevölkerung (Mitte des Jahres).",
        "descriptionEn": "Total population (mid-year estimate).",
        "domain": "demographics",
        "format": "number",
        "higherIsBetter": None,
        "indicatorCode": "SP.POP.TOTL",
    },
    {
        "id": "life_expectancy",
        "label": "Lebenserwartung",
        "labelEn": "Life expectancy",
        "shortLabel": "Lebenserwartung",
        "shortLabelEn": "Life expectancy",
        "unit": "Jahre",
        "unitEn": "years",
        "description": "Lebenserwartung bei Geburt, gesamt.",
        "descriptionEn": "Life expectancy at birth, all sexes.",
        "domain": "health",
        "format": "years",
        "higherIsBetter": True,
        "indicatorCode": "SP.DYN.LE00.IN",
    },
    {
        "id": "gini",
        "label": "Gini-Index (Ungleichheit)",
        "labelEn": "Gini index (inequality)",
        "shortLabel": "Gini",
        "shortLabelEn": "Gini",
        "unit": "Index 0–100",
        "unitEn": "Index 0–100",
        "description": "Einkommensungleichheit; 0 = perfekt gleich, 100 = maximal ungleich.",
        "descriptionEn": "Income inequality; 0 = perfectly equal, 100 = maximally unequal.",
        "domain": "social",
        "format": "index",
        "higherIsBetter": False,
        "indicatorCode": "SI.POV.GINI",
    },
    {
        "id": "health_expenditure_gdp",
        "label": "Gesundheitsausgaben",
        "labelEn": "Health expenditure",
        "shortLabel": "Gesundheit",
        "shortLabelEn": "Health",
        "unit": "% des BIP",
        "unitEn": "% of GDP",
        "description": "Laufende Gesundheitsausgaben als Anteil am BIP.",
        "descriptionEn": "Current health expenditure as a share of GDP.",
        "domain": "health",
        "format": "percent",
        "higherIsBetter": None,
        "indicatorCode": "SH.XPD.CHEX.GD.ZS",
    },
    {
        "id": "unemployment",
        "label": "Arbeitslosenquote",
        "labelEn": "Unemployment rate",
        "shortLabel": "Arbeitslosigkeit",
        "shortLabelEn": "Unemployment",
        "unit": "% der Erwerbspersonen",
        "unitEn": "% of labor force",
        "description": "Arbeitslosigkeit als Anteil der Erwerbsbevölkerung (ILO-Schätzung).",
        "descriptionEn": "Unemployment as a share of the labor force (ILO estimate).",
        "domain": "economy",
        "format": "percent",
        "higherIsBetter": False,
        "indicatorCode": "SL.UEM.TOTL.ZS",
    },
    {
        "id": "inflation",
        "label": "Inflation",
        "labelEn": "Inflation",
        "shortLabel": "Inflation",
        "shortLabelEn": "Inflation",
        "unit": "% pro Jahr",
        "unitEn": "% per year",
        "description": "Verbraucherpreisinflation, jährliche Veränderung.",
        "descriptionEn": "Consumer price inflation, annual change.",
        "domain": "economy",
        "format": "percent",
        "higherIsBetter": None,
        "indicatorCode": "FP.CPI.TOTL.ZG",
    },
    {
        "id": "gdp_growth",
        "label": "BIP-Wachstum",
        "labelEn": "GDP growth",
        "shortLabel": "Wachstum",
        "shortLabelEn": "Growth",
        "unit": "% pro Jahr",
        "unitEn": "% per year",
        "description": "Reales jährliches Wachstum des Bruttoinlandsprodukts.",
        "descriptionEn": "Real annual growth of gross domestic product.",
        "domain": "economy",
        "format": "percent",
        "higherIsBetter": True,
        "indicatorCode": "NY.GDP.MKTP.KD.ZG",
    },
    {
        "id": "exports_gdp",
        "label": "Exporte (Anteil am BIP)",
        "labelEn": "Exports (% of GDP)",
        "shortLabel": "Exporte",
        "shortLabelEn": "Exports",
        "unit": "% des BIP",
        "unitEn": "% of GDP",
        "description": "Exporte von Waren und Dienstleistungen als Anteil am BIP.",
        "descriptionEn": "Exports of goods and services as a share of GDP.",
        "domain": "economy",
        "format": "percent",
        "higherIsBetter": None,
        "indicatorCode": "NE.EXP.GNFS.ZS",
    },
    {
        "id": "poverty",
        "label": "Extreme Armut",
        "labelEn": "Extreme poverty",
        "shortLabel": "Armut",
        "shortLabelEn": "Poverty",
        "unit": "% der Bevölkerung",
        "unitEn": "% of population",
        "description": "Anteil der Bevölkerung unter 2,15 $/Tag (KKP 2017).",
        "descriptionEn": "Share of the population living below 2.15 US$ per day (2017 PPP).",
        "domain": "social",
        "format": "percent",
        "higherIsBetter": False,
        "indicatorCode": "SI.POV.DDAY",
    },
    {
        "id": "education_expenditure",
        "label": "Bildungsausgaben",
        "labelEn": "Education expenditure",
        "shortLabel": "Bildung",
        "shortLabelEn": "Education",
        "unit": "% des BIP",
        "unitEn": "% of GDP",
        "description": "Staatliche Bildungsausgaben als Anteil am BIP.",
        "descriptionEn": "Government education expenditure as a share of GDP.",
        "domain": "social",
        "format": "percent",
        "higherIsBetter": None,
        "indicatorCode": "SE.XPD.TOTL.GD.ZS",
    },
    {
        "id": "fertility",
        "label": "Geburtenrate",
        "labelEn": "Fertility rate",
        "shortLabel": "Geburtenrate",
        "shortLabelEn": "Fertility",
        "unit": "Kinder/Frau",
        "unitEn": "children/woman",
        "description": "Zusammengefasste Geburtenziffer (Kinder pro Frau).",
        "descriptionEn": "Total fertility rate (children per woman).",
        "domain": "health",
        "format": "number",
        "higherIsBetter": None,
        "indicatorCode": "SP.DYN.TFRT.IN",
    },
    {
        "id": "urban_population",
        "label": "Stadtbevölkerung",
        "labelEn": "Urban population",
        "shortLabel": "Urbanisierung",
        "shortLabelEn": "Urbanization",
        "unit": "% der Bevölkerung",
        "unitEn": "% of population",
        "description": "Anteil der Bevölkerung, der in Städten lebt.",
        "descriptionEn": "Share of the population living in cities.",
        "domain": "demographics",
        "format": "percent",
        "higherIsBetter": None,
        "indicatorCode": "SP.URB.TOTL.IN.ZS",
    },
    {
        "id": "co2_per_capita",
        "label": "CO₂ pro Kopf",
        "labelEn": "Urban population",
        "shortLabel": "CO₂/Kopf",
        "shortLabelEn": "Urbanization",
        "unit": "t pro Jahr",
        "unitEn": "% of population",
        "description": "Energiebedingte CO₂-Emissionen pro Kopf (ohne Landnutzung).",
        "descriptionEn": "Share of the population living in cities.",
        "domain": "environment",
        "format": "number",
        "higherIsBetter": False,
        "indicatorCode": "EN.GHG.CO2.PC.CE.AR5",
    },
    {
        "id": "internet_users",
        "label": "Internetnutzer",
        "labelEn": "Internet users",
        "shortLabel": "Internet",
        "shortLabelEn": "Internet",
        "unit": "% der Bevölkerung",
        "unitEn": "% of population",
        "description": "Anteil der Bevölkerung mit Internetzugang.",
        "descriptionEn": "Share of the population with internet access.",
        "domain": "infrastructure",
        "format": "percent",
        "higherIsBetter": True,
        "indicatorCode": "IT.NET.USER.ZS",
    },
    {
        "id": "electricity_access",
        "label": "Stromzugang",
        "labelEn": "Electricity access",
        "shortLabel": "Strom",
        "shortLabelEn": "Electricity",
        "unit": "% der Bevölkerung",
        "unitEn": "% of population",
        "description": "Anteil der Bevölkerung mit Zugang zu Elektrizität.",
        "descriptionEn": "Share of the population with access to electricity.",
        "domain": "infrastructure",
        "format": "percent",
        "higherIsBetter": True,
        "indicatorCode": "EG.ELC.ACCS.ZS",
    },
    {
        "id": "mobile_subscriptions",
        "label": "Mobilfunkverträge",
        "labelEn": "Mobile subscriptions",
        "shortLabel": "Mobilfunk",
        "shortLabelEn": "Mobile",
        "unit": "pro 100 Einw.",
        "unitEn": "per 100 people",
        "description": "Mobilfunkverträge je 100 Einwohner.",
        "descriptionEn": "Mobile cellular subscriptions per 100 inhabitants.",
        "domain": "infrastructure",
        "format": "number",
        "higherIsBetter": None,
        "indicatorCode": "IT.CEL.SETS.P2",
    },
]

# ISO reconciliation: Natural Earth uses proprietary codes for entities ISO has
# not coded. The ISO_A3 -> ISO_A3_EH -> ADM0_A3 ladder (see ne_iso3) resolves all
# fully-recognized countries automatically (France, Norway ...). Only this single
# override remains, so Kosovo's NE polygon (KOS) joins World Bank data (XKX).
NE_OVERRIDE = {
    "KOS": "XKX",  # Kosovo: Natural Earth ADM0_A3 -> World Bank id
}

# --------------------------------------------------------------------------- #
# HTTP helper
# --------------------------------------------------------------------------- #

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "WorldEconomicMap/0.1 (data pipeline)"})


def get_json(url: str, params: dict | None = None, *, retries: int = 4):
    """GET with simple linear backoff; raises on persistent failure."""
    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            resp = SESSION.get(url, params=params, timeout=90)
            if resp.status_code == 200:
                return resp.json()
            last_exc = RuntimeError(f"HTTP {resp.status_code} for {resp.url}")
        except requests.RequestException as exc:  # network hiccup
            last_exc = exc
        time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Request failed after {retries} tries: {url}") from last_exc


# --------------------------------------------------------------------------- #
# World Bank fetch
# --------------------------------------------------------------------------- #


def fetch_countries() -> dict[str, dict]:
    """Return real countries keyed by ISO3 (aggregates filtered out)."""
    data = get_json(f"{WB_BASE}/country", {"format": "json", "per_page": 400})
    rows = data[1] or []
    countries: dict[str, dict] = {}
    for row in rows:
        # Aggregates (World, EU, income groups, regions) have region.id == "NA".
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


def fetch_indicator(code: str) -> dict[str, dict]:
    """Latest non-null value per country for one indicator.

    Pulls the last 10 years (mrv=10) and picks the most recent year that
    actually has a value — robust against gaps in the latest year.
    """
    data = get_json(
        f"{WB_BASE}/country/all/indicator/{code}",
        {"format": "json", "mrv": 10, "per_page": 20000},
    )
    best: dict[str, tuple[int, float]] = {}
    for row in (data[1] or []):
        iso3 = row.get("countryiso3code")
        value = row.get("value")
        if not iso3 or value is None:
            continue
        year = int(row["date"])
        if iso3 not in best or year > best[iso3][0]:
            best[iso3] = (year, value)
    return {iso3: {"value": val, "year": yr} for iso3, (yr, val) in best.items()}


# --------------------------------------------------------------------------- #
# Natural Earth geometry
# --------------------------------------------------------------------------- #


def ne_iso3(props: dict) -> str | None:
    """Resolve a feature's canonical ISO3 via the NE fallback ladder + override."""
    for key in ("ISO_A3", "ISO_A3_EH", "ADM0_A3"):
        val = props.get(key)
        if val and val != "-99":
            return NE_OVERRIDE.get(val, val)
    return None


def build_geojson() -> tuple[dict, set[str]]:
    """Download NE borders, slim properties to {iso3, name}, return (geojson, iso3 set)."""
    gj = get_json(NE_GEOJSON_URL)
    present: set[str] = set()
    for feat in gj.get("features", []):
        props = feat.get("properties", {})
        iso3 = ne_iso3(props)
        name = props.get("NAME") or props.get("ADMIN") or props.get("NAME_LONG")
        feat["properties"] = {"iso3": iso3, "name": name}
        if iso3:
            present.add(iso3)
    apply_adjustments(gj, DEFAULT_ADJUSTMENTS)
    return gj, present


# --------------------------------------------------------------------------- #
# Assemble + write
# --------------------------------------------------------------------------- #


def main() -> int:
    print("→ Lade Länder-Metadaten (World Bank) …")
    countries = fetch_countries()
    print(f"  {len(countries)} echte Länder (Aggregate gefiltert)")

    metrics_meta = []
    for metric in METRICS:
        print(f"→ Lade {metric['label']} ({metric['indicatorCode']}) …")
        values = fetch_indicator(metric["indicatorCode"])
        hits = 0
        for iso3, mv in values.items():
            if iso3 in countries:
                countries[iso3]["metrics"][metric["id"]] = mv
                hits += 1
        print(f"  {hits} Länder mit Wert")
        metrics_meta.append({**metric, "source": WB_SOURCE})

    print("→ Lade Ländergrenzen (Natural Earth 50m) …")
    geojson, geo_iso3 = build_geojson()
    data_iso3 = set(countries.keys())

    # Coverage diagnostics
    no_geometry = sorted(data_iso3 - geo_iso3)
    no_data = sorted(c for c in geo_iso3 if c and c not in data_iso3)
    print(f"  {len(geojson['features'])} Polygone, {len(geo_iso3)} mit ISO3")
    if no_geometry:
        print(f"  ⚠ {len(no_geometry)} Länder mit Daten ohne Polygon: {', '.join(no_geometry)}")
    if no_data:
        preview = ", ".join(no_data[:12]) + (" …" if len(no_data) > 12 else "")
        print(f"  ⚠ {len(no_data)} Polygone ohne World-Bank-Daten (z.B. Taiwan TWN): {preview}")

    snapshot = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sources": [WB_SOURCE, NE_SOURCE],
        "metrics": metrics_meta,
        "countries": sorted(countries.values(), key=lambda c: c["name"]),
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "snapshot.json").write_text(
        json.dumps(snapshot, ensure_ascii=False), encoding="utf-8"
    )
    (OUT_DIR / "countries.geojson").write_text(
        json.dumps(geojson), encoding="utf-8"
    )

    snap_kb = (OUT_DIR / "snapshot.json").stat().st_size / 1024
    geo_kb = (OUT_DIR / "countries.geojson").stat().st_size / 1024
    print(
        f"✓ Geschrieben: snapshot.json ({snap_kb:.0f} KB), "
        f"countries.geojson ({geo_kb:.0f} KB) → {OUT_DIR}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())