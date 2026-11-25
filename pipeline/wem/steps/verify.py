"""Read-only check of the published data against primary sources → ``docs/verificacion.md``.

Re-downloads, from the institution that produces each figure, a sample of what the app
shows (euro-area policy rate, spread vs Bund, 10Y yields, inflation) and reports value in
the app, value at the source, difference and verdict. Nothing in ``app/`` is modified.
"""

from __future__ import annotations

from datetime import date

import requests

from ..http import HttpClient
from ..jsonio import read_json
from ..paths import Paths
from ..providers import ecb, eurostat

SAMPLE = ["DEU", "ESP", "ITA", "FRA", "GRC", "PRT", "NLD", "BGR"]
SPREAD_TOLERANCE_BP = 0.5
YIELD_TOLERANCE_BP = 10.0   # daily observation vs monthly average of the same month
INFLATION_TOLERANCE_PP = 0.5  # national CPI (IMF) vs harmonised HICP (Eurostat)


def _metric(snap: dict, iso3: str, metric_id: str) -> dict | None:
    country = next((c for c in snap["countries"] if c["iso3"] == iso3), None)
    return (country or {}).get("metrics", {}).get(metric_id)


def _months_between(earlier: str, later: str) -> int:
    (y0, m0), (y1, m1) = (map(int, earlier[:7].split("-")), map(int, later[:7].split("-")))
    return (y1 - y0) * 12 + (m1 - m0)


def _fmt(value: float | None, digits: int = 2) -> str:
    return "—" if value is None else f"{value:.{digits}f}"


def build_report(snap: dict, bonds: dict, yields: dict | None, hicp: dict | None,
                 dfr: tuple[str, float] | None, today: date) -> tuple[str, int]:
    """Markdown report and the number of rows that need attention."""
    issues = 0
    out = [
        "# Verificación contra fuente primaria",
        "",
        f"Generado con `python -m wem verify` el {today.isoformat()}. Compara lo que publica la app",
        "con la institución que produce cada dato. Muestra: " + ", ".join(SAMPLE) + ".",
        "",
        "## 1. Tipo oficial de la zona euro (BIS en la app) frente al BCE",
        "",
        "Fuente primaria: [ECB Data Portal, facilidad de depósito (DFR)](https://data.ecb.europa.eu/data/datasets/FM/FM.B.U2.EUR.4F.KR.DFR.LEV).",
        "",
        "| País | App | Periodo app | BCE (DFR) | Fecha BCE | Veredicto |",
        "|---|---:|---|---:|---|---|",
    ]
    for iso3 in ("DEU", "ESP", "BGR"):
        app = _metric(snap, iso3, "policy_rate")
        if dfr is None:
            verdict = "fuente no disponible"
        elif app is None:
            verdict, issues = "FALTA en la app", issues + 1
        elif abs(app["value"] - dfr[1]) < 1e-9:
            verdict = "OK"
        else:
            verdict, issues = "DISTINTO", issues + 1
        out.append(f"| {iso3} | {_fmt(app and app['value'])} | {app and app.get('period') or '—'} | "
                   f"{_fmt(dfr and dfr[1])} | {dfr[0] if dfr else '—'} | {verdict} |")

    out += [
        "",
        "## 2. Prima de riesgo frente al Bund (pb)",
        "",
        "Fuente primaria: [Eurostat `irt_lt_mcby_m`](https://ec.europa.eu/eurostat/databrowser/view/irt_lt_mcby_m/default/table),",
        "recalculada aquí con el mismo mes para el país y para Alemania. Se excluyen las series",
        "con el mismo valor tres meses seguidos (no son precios de mercado).",
        "",
        "| País | App (pb) | Mes app | Eurostat hoy (pb) | Mes Eurostat | Veredicto |",
        "|---|---:|---|---:|---|---|",
    ]
    fresh = eurostat.spreads_vs_bund(yields) if yields else {}
    for iso3 in SAMPLE:
        app, src = _metric(snap, iso3, "euro_spread_bund"), fresh.get(iso3)
        if yields is None:
            verdict = "fuente no disponible"
        elif app is None and src is None and eurostat.is_frozen(yields.get(iso3, {})):
            verdict = "excluido: serie sin variación"
        elif app is None or src is None:
            verdict, issues = "FALTA", issues + 1
        elif app["period"] != src["period"]:
            verdict, issues = "DESACTUALIZADO", issues + 1
        elif abs(app["value"] - src["value"]) <= SPREAD_TOLERANCE_BP:
            verdict = "OK"
        else:
            verdict, issues = "DISTINTO", issues + 1
        out.append(f"| {iso3} | {_fmt(app and app['value'], 1)} | {app and app['period'] or '—'} | "
                   f"{_fmt(src and src['value'], 1)} | {src and src['period'] or '—'} | {verdict} |")

    out += [
        "",
        "## 3. Capa de bonos (rentabilidad a 10 años) frente a Eurostat",
        "",
        "La capa de bonos toma la fuente más reciente de cada país. Esta tabla mide si el valor",
        "coincide con Eurostat para el mismo mes y cuántos meses va por detrás del último dato.",
        "Por eso el diferencial se calcula aparte (sección 2) y no restando valores de esta capa.",
        "",
        "| País | App 10A (%) | Fecha app | Fuente app | Eurostat mismo mes (%) | Dif. (pb) | Eurostat último (%) | Desfase (meses) | Veredicto |",
        "|---|---:|---|---|---:|---:|---:|---:|---|",
    ]
    for iso3 in SAMPLE:
        curve = bonds.get("countries", {}).get(iso3)
        point = next((p for p in (curve or {}).get("points", []) if p["months"] == 120), None)
        series = (yields or {}).get(iso3, {})
        if not curve or point is None or not series:
            out.append(f"| {iso3} | — | — | — | — | — | — | — | sin dato |")
            continue
        month = curve["date"][:7]
        same, latest_month = series.get(month), max(series)
        diff = None if same is None else (point["yield"] - same) * 100
        lag = _months_between(month, latest_month)
        if diff is not None and abs(diff) > YIELD_TOLERANCE_BP:
            verdict, issues = "DISTINTO", issues + 1
        elif lag >= 2:
            verdict, issues = f"DESFASADO {lag} meses", issues + 1
        else:
            verdict = "OK"
        out.append(f"| {iso3} | {_fmt(point['yield'], 3)} | {curve['date']} | {curve['source']['name']} | "
                   f"{_fmt(same, 3)} | {_fmt(diff, 1)} | {_fmt(series[latest_month], 3)} ({latest_month}) | {lag} | {verdict} |")

    out += [
        "",
        "## 4. Inflación (FMI en la app) frente al IPCA de Eurostat",
        "",
        "Fuente primaria: [Eurostat `prc_hicp_minr`](https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_minr/default/table)",
        "(tasa anual, total). La app usa el IPC nacional del FMI y Eurostat el IPC armonizado: son",
        f"conceptos distintos, así que se tolera hasta {INFLATION_TOLERANCE_PP} pp.",
        "",
        "| País | App (%) | Mes app | IPCA mismo mes (%) | Dif. (pp) | Veredicto |",
        "|---|---:|---|---:|---:|---|",
    ]
    for iso3 in SAMPLE:
        app = _metric(snap, iso3, "inflation")
        period = (app or {}).get("period", "")
        src = (hicp or {}).get(iso3, {}).get(period[:7]) if len(period) >= 7 else None
        diff = None if app is None or src is None else app["value"] - src
        if hicp is None:
            verdict = "fuente no disponible"
        elif diff is None:
            verdict = "sin mes común"
        elif abs(diff) <= INFLATION_TOLERANCE_PP:
            verdict = "OK"
        else:
            verdict, issues = "REVISAR", issues + 1
        out.append(f"| {iso3} | {_fmt(app and app['value'])} | {period or '—'} | {_fmt(src)} | {_fmt(diff)} | {verdict} |")

    out += ["", f"**Filas que requieren atención: {issues}.**", ""]
    return "\n".join(out), issues


def _try(label: str, fetch):
    try:
        return fetch()
    except (requests.RequestException, KeyError, ValueError) as exc:
        print(f"  WARNING: {label} unavailable ({exc})")
        return None


def run(paths: Paths, args=()) -> int:
    http = HttpClient("WorldEconomicMap/0.1 (verification)")
    today = date.today()
    since = f"{today.year - 1}-01"
    snap = read_json(paths.snapshot)
    bonds = read_json(paths.root / "app" / "src" / "data" / "bonds-snapshot.json")
    print("-> Re-downloading primary sources (ECB, Eurostat) ...")
    dfr = _try("ECB DFR", lambda: ecb.fetch_latest(http))
    yields = _try("Eurostat yields", lambda: eurostat.fetch_yields(http, since))
    hicp = _try("Eurostat HICP", lambda: eurostat.fetch_hicp(http, since))
    report, issues = build_report(snap, bonds, yields, hicp, dfr, today)
    target = paths.root / "docs" / "verificacion.md"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(report, encoding="utf-8")
    print(f"OK: {target.relative_to(paths.root)} written; {issues} rows need attention")
    return 0
