# 🌍 World Economic Map

**Interactive global economy and macroeconomic data platform — official data, every indicator traceable to its source.**

Explore economic, health and social indicators for **every country on Earth** on an interactive, zoomable heatmap world map, with bilateral **trade flows** between nations visualized across the globe.

---

## ✨ Features

| | |
|---|---|
| 🗺️ | **Interactive heatmap world map** — zoom, pan and click every country (200+ countries & territories, detailed borders) |
| 📊 | **20+ official indicators** — GDP, GDP per capita (nominal & PPP), inflation, central bank policy rates, unemployment, extreme poverty, life expectancy, fertility, health & education spending, CO₂ per capita, internet access, electricity access and more |
| 🔄 | **Trend view** — map the 10- or 20-year development of any indicator directly on the map (red ↓ / blue ↑) |
| 🔗 | **Trade network visualization** — bilateral export flows drawn as animated arcs between countries (IMF data) |
| 📦 | **Top export goods per country** — HS2 product categories (UN Comtrade) |
| 📈 | **Time series charts** — country-by-country historical trends for every metric (2004–2024) |
| ⚖️ | **Country comparison** — side-by-side comparative table of up to 4 countries with best-value highlights |
| 🏆 | **Interactive rankings** — every indicator as a sortable ranking list |
| 🧭 | **Regional drill-down** — explore subnational first-level administrative regions for covered countries (regional GDP, GDP per capita and population) |
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
- **International Monetary Fund (IMF)**: Economic outlook, inflation rates, bilateral trade flows
- **Bank for International Settlements (BIS)**: Central bank policy rates
- **UN Comtrade**: Bilateral merchandise trade and exported product composition
- **Regional & National Statistical Offices (DOSE)**: Subnational regional macro series

---

## 🛠️ Architecture & Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Mapping & Graphics**: MapLibre GL, deck.gl (GPU-accelerated trade flow arcs)
- **Data processing**: Python pipeline for ingestion, normalization and validation
- **Deployment**: Zero-dependency static architecture, client-side rendering
