"""Build the data snapshot from official sources.

Outputs (committed, served by the frontend at /data/...):
  snapshot.json      normalized metric values, one entry per country
  countries.geojson  Natural Earth borders keyed by canonical ISO3

Every number comes from the World Bank Open Data API (CC BY 4.0). Country borders
come from Natural Earth (public domain). Each metric carries its source + year, so the
frontend can show provenance for every value it displays.
"""

from __future__ import annotations

from datetime import datetime, timezone

from ..catalog import ALL_METRICS, sources
from ..geometry import DEFAULT_ADJUSTMENTS, apply_adjustments
from ..http import HttpClient
from ..jsonio import file_kb, write_json
from ..paths import Paths
from ..providers import natural_earth
from ..providers.worldbank import WorldBankClient
from ..providers.registry import ProviderPool


def _sources(metrics_meta: list[dict]) -> list[dict]:
    """World Bank + Natural Earth first, then any other provider actually used."""
    out = [sources.WORLD_BANK.to_dict(), sources.NATURAL_EARTH.to_dict()]
    for m in metrics_meta:
        if m["source"] not in out:
            out.append(m["source"])
    return out


def run(paths: Paths, args=()) -> int:
    http = HttpClient("WorldEconomicMap/0.1 (data pipeline)")
    pool = ProviderPool(http)

    print("→ Lade Länder-Metadaten (World Bank) …")
    countries = WorldBankClient(http).countries()
    print(f"  {len(countries)} echte Länder (Aggregate gefiltert)")

    metrics_meta = []
    skipped: list[str] = []
    for metric in ALL_METRICS:
        provider = pool.get(metric.provider)
        print(f"→ Lade {metric.label} ({metric.provider}:{metric.indicator_code}) …")
        try:
            values = provider.latest(metric.indicator_code)
        except Exception as exc:
            if not metric.optional:
                raise
            print(f"  ⚠ übersprungen ({metric.id}): {exc}")
            skipped.append(metric.id)
            continue
        hits = 0
        for iso3, mv in values.items():
            if iso3 in countries:
                countries[iso3]["metrics"][metric.id] = mv
                hits += 1
        print(f"  {hits} Länder mit Wert")
        if hits == 0 and metric.optional:
            print(f"  ⚠ keine Daten — {metric.id} wird nicht aufgenommen")
            skipped.append(metric.id)
            continue
        metrics_meta.append(metric.to_dict(provider.source))
    if skipped:
        print(f"  ⚠ {len(skipped)} optionale Metriken ohne Daten: {', '.join(skipped)}")

    print("→ Lade Ländergrenzen (Natural Earth 50m) …")
    geojson = natural_earth.fetch_borders(http)
    geo_iso3 = natural_earth.slim_features(geojson)
    apply_adjustments(geojson, DEFAULT_ADJUSTMENTS)
    data_iso3 = set(countries)

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
        "sources": _sources(metrics_meta),
        "metrics": metrics_meta,
        "countries": sorted(countries.values(), key=lambda c: c["name"]),
    }
    write_json(paths.snapshot, snapshot)
    write_json(paths.countries_geojson, geojson, ensure_ascii=True)

    print(
        f"✓ Geschrieben: snapshot.json ({file_kb(paths.snapshot):.0f} KB), "
        f"countries.geojson ({file_kb(paths.countries_geojson):.0f} KB) → {paths.out_dir}"
    )
    return 0
