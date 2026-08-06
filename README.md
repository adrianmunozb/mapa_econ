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
| 🔎 | **Country search** — jump straight to any country |
| 💬 | **Bilingual** — English (default) and German UI |
| 🔗 | **Shareable URLs** — your current view (metric, country, trade mode, period) is encoded in the URL hash |
| 🧾 | **Full provenance** — every value shows its source, year and license |
| ⚡ | **Fast & offline-capable** — all data ships as static JSON, no API keys, no external calls |

## 🚀 Quick Start

```bash
# The whole app runs on a static web server — no build step needed for users:
cd app
npm install
npm run dev
# → http://localhost:5173
```

**One-click macOS launcher:** double-click `Start World Economic Map.command`.

**Production build & download:** [Releases](https://github.com/vrjo/WorldEconomicMap/releases) → download the **v1.0.0 web bundle**, unzip and serve the folder with any static server (e.g. `npx serve dist` or `npm run preview`).

## 🗂️ Data Sources (all official & verified)

Every number shown in the app carries its **source, year and link** — so you can verify any value yourself.

| Source | Content | License |
|---|---|---|
| [World Bank Open Data](https://data.worldbank.org) | GDP, GDP/capita, population, life expectancy, Gini, health, poverty, education … | CC BY 4.0 |
| [IMF (WEO / CPI / IMTS)](https://data.imf.org) | Economic outlook, current inflation, bilateral trade flows | IMF Terms |
| [BIS](https://data.bis.org) | Central bank policy rates | BIS Terms |
| [UN Comtrade](https://comtradeplus.un.org) | Detailed bilateral merchandise trade, export products | UN Terms |
| [Natural Earth](https://www.naturalearthdata.com) | Country borders (geometry) | Public Domain |

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
