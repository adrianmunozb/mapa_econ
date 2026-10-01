# 🌍 World Economic Map

**The interactive world map of the global economy — official data, every number traceable to its source.**

Explore economic, health and social indicators for **every country on Earth** on a beautiful, zoomable heatmap world map — and see the **bilateral trade flows** between countries as arcs across the globe. Think "Our World in Data" meets "Google Earth for the economy".

> 💬 **English by default — German switchable** (top right corner)

---

## ✨ Features

| | |
|---|---|
| 🗺️ | **Interactive heatmap world map** — zoom, pan and click every country (200+ countries & territories, Natural Earth borders) |
| 📊 | **20+ official indicators** — GDP, GDP per capita (nominal & PPP), inflation, central bank policy rates, unemployment, extreme poverty, life expectancy, fertility, health & education spending, CO₂ per capita, internet access, electricity access and more |
| 🔄 | **Change view** — map the 10- or 20-year development of any indicator directly on the map (red ↓ / blue ↑) |
| 🔗 | **Trade network visualization** — bilateral export flows drawn as animated arcs between countries (IMF data) |
| 📦 | **Top export goods per country** — HS2 product categories (UN Comtrade) |
| 📈 | **Time series charts** — per-country history for every metric (2004–2024) |
| ⚖️ | **Country comparison** — side-by-side table of up to 4 countries, best value highlighted |
| 🏆 | **Interactive rankings** — every indicator as a sortable top/bottom list |
| 🧭 | **Regional drill-down** — click a supported country to map first-level regions, with regional GDP, GDP per capita and population |
| 🔎 | **Country search** — jump straight to any country |
| 💬 | **Bilingual** — English (default) and German UI |
| 🔗 | **Shareable URLs** — your current view (metric, country, trade mode, period) is encoded in the URL hash |
| 🧾 | **Full provenance** — every value shows its source, year and license |
| ⚡ | **Fast & offline-capable** — all data ships as static JSON, no API keys, no external calls |

## 🚀 Quick Start

**The easiest way — one single file, works offline:**

1. Go to [Releases](https://github.com/vrjo/WorldEconomicMap/releases)
2. Download **`WorldEconomicMap-v1.1.0.html`** (≈ 6 MB — the complete app, all data and the map in ONE file)
3. Double-click it — the map opens directly in your browser. **No installation, no server, no internet needed.** 🌍

*It works because the entire app — code, all 200+ countries of data, the map geometry and an offline map style — is embedded in that single HTML file.*

**Run from source (developers):**

```bash
cd app
npm install
npm run dev
# → http://localhost:5173
```

**One-click macOS launcher:** double-click `Start World Economic Map.command`.

**Production build:** `npm run build` → a self-contained `dist/index.html` (single-file build) that you can copy anywhere, host statically (GitHub Pages, Netlify, …) or attach to releases.

## 🗂️ Data Sources (all official & verified)

Every number shown in the app carries its **source, year and link** — so you can verify any value yourself.

| Source | Content | License |
|---|---|---|
| [World Bank Open Data](https://data.worldbank.org) | GDP, GDP/capita, population, life expectancy, Gini, health, poverty, education … | CC BY 4.0 |
| [IMF (WEO / CPI / IMTS)](https://data.imf.org) | Economic outlook, current inflation, bilateral trade flows | IMF Terms |
| [BIS](https://data.bis.org) | Central bank policy rates | BIS Terms |
| [UN Comtrade](https://comtradeplus.un.org) | Detailed bilateral merchandise trade, export products | UN Terms |
| [Natural Earth](https://www.naturalearthdata.com) | Country borders (geometry) | Public Domain |
| [DOSE v2.11](https://doi.org/10.5281/zenodo.16313760) | Reported GDP and population for about 1,660 regions in 83 countries, through 2020 | CC BY 4.0 |
| [geoBoundaries](https://www.geoboundaries.org/) | Simplified first-level administrative boundaries used for regional maps | CC BY 4.0 (attribution required) |

The current regional map covers 48 countries whose regions can be matched confidently to the reported series. Missing or unmatched regions remain gray; countries without regional coverage keep the country-level view. Values and years vary by region; DOSE contains data through 2020 and is not a live regional feed. GDP totals in US dollars are calculated from reported GDP per capita and population.

## 🛠️ Tech Stack

- **Frontend:** React 19 · TypeScript · Vite
- **Maps:** MapLibre GL + deck.gl (GPU-accelerated arcs)
- **Data pipeline:** Python (World Bank API, IMF SDMX, BIS CSV, UN Comtrade)
- **No backend, no API keys** — static JSON served to the browser

## 🧱 Architecture

```
WorldEconomicMap/
  app/        Frontend — Vite + React + TypeScript + MapLibre GL + deck.gl
  pipeline/   Python scripts: fetch official data, normalize, attach provenance
    geometry/   Declarative border adjustments (e.g. Morocco / Western Sahara split)
  data/       Generated snapshot (committed) + raw/ (local cache, gitignored)
```

## 🧑‍💻 Development

```bash
# Frontend
cd app
npm install
npm run dev            # dev server
npm run build          # production build → dist/
npm run lint           # ESLint

# Data pipeline (regenerates app/public/data/*.json — run in order)
cd pipeline
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python build_snapshot.py      # World Bank indicators + Natural Earth borders
python build_regions.py       # reported regional GDP/population + ADM1 boundaries
python build_timeseries.py    # 2004–2024 history
python build_current.py       # current inflation (IMF) + policy rates (BIS)
python build_trade.py         # bilateral trade flows (IMF IMTS)
python build_products.py      # export products (UN Comtrade)
python patch_i18n.py          # bilingual labels (EN default, DE)
python audit.py               # optional: data consistency checks
```

## 🔑 Keywords & Topics

World map · world economy · economic map · GDP heatmap · global trade map · trade flows visualization · World Bank data · IMF data · open data visualization · data journalism · country comparison · economic indicators · choropleth map · interactive map · data visualization · economics · geopolitics · public health data · CO₂ emissions map · inflation map

`#worldmap #economicmap #dataviz #datavisualization #opendata #economics #worldbank #trade #globaltrade #heatmap #interactivemap #datajournalism #geopolitics #opensource #react #typescript #maplibre #deckgl #gdp #visualization`

## 📜 License

**Code:** MIT — use it freely, build on it, remix it.

**Data:** belongs to the respective sources; attribution is shown inside the app.

---

⭐ If you find this useful, star the repo — it helps more people discover the project!
