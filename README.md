# Meridiano

**Riesgo soberano y economía mundial en un mapa.** Web: https://mapaecon.vercel.app

*(Based on WorldEconomicMap; see credits below.)*

**Interactive global economy and macroeconomic data platform — official data, every indicator traceable to its source.**

Explore economic, health and social indicators for **every country on Earth** on an interactive, zoomable heatmap world map, with bilateral **trade flows** between nations visualized across the globe.

---

## 🇪🇸 Proyecto "Carril abierto" (Comillas ICADE)

**Autores:** Adrián López Lamata y Adrián Muñoz Borbón. Proyecto de nivel 2 · CONSTRUIR.

**Web:** https://mapaecon.vercel.app

**Qué es.** Un mapa mundial de datos macro-financieros oficiales en el que cada cifra enlaza
con la institución que la produce y se puede volver a comprobar contra ella.

**Ancla financiera.** La parte del sistema que toca es la de **tipos de interés y riesgo
soberano**:

- tipo oficial de 57 bancos centrales (BIS), con el BCE para los 21 países del euro;
- tipo real ex post (tipo oficial − inflación);
- curvas de deuda pública por plazo, de fuentes oficiales de cada país;
- **prima de riesgo frente al Bund** de la zona euro, calculada con una sola fuente
  (Eurostat), el mismo mes para cada par de países y solo dentro de la misma moneda.

**Control sobre la IA.** `python -m wem verify` vuelve a descargar de la fuente primaria
(BCE, Eurostat) una muestra de lo que publica la app y deja el resultado en
[`docs/verificacion.md`](docs/verificacion.md).

**Documentación del proceso:**

- [`IA.md`](IA.md): qué herramientas de IA usamos y para qué, y dónde está el rastro.
- [`specs/`](specs/): especificación, plan y tareas de cada cambio, escritos antes del código.

**Créditos.** El proyecto parte de [vrjo/WorldEconomicMap](https://github.com/vrjo/WorldEconomicMap)
(versiones 1.0 y 1.1, agosto de 2026), copiado sin fork. Todo lo posterior al commit
`0acde16` es trabajo nuestro hecho con IA; el historial de git muestra quién hizo cada cosa.
Los datos de terceros y sus licencias se listan en
[`app/THIRD_PARTY_NOTICES.md`](app/THIRD_PARTY_NOTICES.md).

---

## ✨ Features

| | |
|---|---|
| 🗺️ | **Interactive heatmap world map** — zoom, pan and click every country (200+ countries & territories, detailed borders) |
| 📊 | **20+ official indicators** — GDP, GDP per capita (nominal & PPP), inflation, central bank policy rates, unemployment, extreme poverty, life expectancy, fertility, health & education spending, CO₂ per capita, internet access, electricity access and more |
| 💶 | **Sovereign risk** — euro-area 10-year spread vs the German Bund (Eurostat, same month, single source), real policy rate (policy rate − inflation) and government bond yield curves by maturity |
| 🔄 | **Trend view** — map the 10- or 20-year development of any indicator directly on the map (red ↓ / blue ↑) |
| 🔗 | **Trade network visualization** — bilateral export flows drawn as animated arcs between countries (IMF data) |
| 📦 | **Top export goods per country** — HS2 product categories (UN Comtrade) |
| 📈 | **Time series charts** — country-by-country historical trends for every metric (2004–2024) |
| ⚖️ | **Country comparison** — side-by-side comparative table of up to 4 countries with best-value highlights |
| 🏆 | **Interactive rankings** — every indicator as a sortable ranking list |
| 🧭 | **Regional drill-down** — explore subnational first-level administrative regions for covered countries (regional GDP, GDP per capita and population) |
| 📄 | **CSV history per indicator** — `data/csv/history/<indicator>.csv` (country × year), plus `indicators.csv` and `latest.csv` |
| 🔎 | **Country search** — instant search and fly-to navigation |
| 🔗 | **Shareable views** — current view state (metric, country, trade mode, period) is encoded in the URL hash |
| 🧾 | **Full provenance** — every value displays its verified data source and year |
| ⚡ | **Fast & offline-capable** — all data is bundled statically, zero external API keys required |

---

## 🚀 Quick Start

**Running locally:**

```bash
cd app
npm install
npm run dev
# → http://localhost:5173
```

**Single-file standalone build:**

```bash
cd app
npm run build
# → generates self-contained dist/index.html with all data embedded
```

---

## 🗂️ Data Sources

All indicators are sourced from recognized official international institutions:

- **World Bank**: GDP, GDP/capita, population, life expectancy, Gini index, health, poverty, education, infrastructure
- **International Monetary Fund (IMF)**: Economic outlook (DataMapper: debt, fiscal and external balances), inflation rates, bilateral trade flows
- **Bank for International Settlements (BIS)**: Central bank policy rates
- **Eurostat**: 10-year government bond yields (EMU convergence criterion) for the euro-area spread vs Bund; HICP for verification
- **European Central Bank (ECB)**: deposit facility rate, used to verify the euro-area policy rate
- **UN Comtrade**: Bilateral merchandise trade and exported product composition
- **Regional & National Statistical Offices (DOSE)**: Subnational regional macro series

---

## 🔄 Data pipeline

```bash
cd pipeline
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m wem all             # every step below, in order
python -m wem list            # list the steps

python -m wem snapshot        # World Bank/IMF indicators + Natural Earth borders
python -m wem regions         # reported regional GDP/population + ADM1 boundaries
python -m wem timeseries      # 2004–2024 history → timeseries/<indicator>.json (loaded on demand)
python -m wem current         # current inflation (IMF), policy rates (BIS), real rate, euro spread vs Bund (Eurostat) — run after snapshot
python -m wem trade           # bilateral trade flows (IMF IMTS)
python -m wem products        # export products (UN Comtrade)
python -m wem i18n            # bilingual labels
python -m wem export          # CSV history per indicator → data/csv/ (offline)
python -m wem audit           # optional: data consistency checks
python -m wem verify          # optional: compare published values with primary sources → docs/verificacion.md

python -m unittest discover -s tests -t .   # offline tests (no network needed)
```

The old `python build_snapshot.py` style scripts still work as shims. Note that `snapshot`
rewrites `snapshot.json`; run `current` afterwards to restore the monthly inflation and
policy rates (`python -m wem all` does this).

---

## 🛠️ Architecture & Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Mapping & Graphics**: MapLibre GL, deck.gl (GPU-accelerated trade flow arcs)
- **Data processing**: Python package `pipeline/wem` for ingestion, normalization and validation

```
pipeline/wem/
  catalog/     static knowledge: metric catalog, data sources, HS2 names
  providers/   one module per remote API (World Bank, IMF, BIS, Comtrade, …)
  steps/       one runnable stage per output file (snapshot, trade, …)
  geometry/    declarative border adjustments (e.g. Morocco / Western Sahara)
  regions/     regional (ADM1) matching + simplification
pipeline/tests/  unit tests + offline end-to-end run on a fake network
```
- **Deployment**: Zero-dependency static architecture, client-side rendering
