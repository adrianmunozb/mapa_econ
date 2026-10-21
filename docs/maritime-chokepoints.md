# Maritime passages

Open **Explorar pasos marítimos** under strategic layers, or select a map marker.
The explorer has summaries, daily traffic and a **Buscar pasos** tab for finding any of nine passages. Its search view has a neutral title, explicit result count and cards showing why a result matches (for example `Amenaza: Sequía` on Panama). **Ver ficha y mapa** selects the passage, opens its summary, resets the card scroll position, focuses its heading and frames its corridors on the map. Search filters survive returning to the search tab; **Limpiar filtros** restores all passages. Traffic numbers are secondary, inside each result's **Tráfico observado** disclosure.

The search suggests existing passage names, goods and threats while typing (for example, `petr` → `Petróleo`, `sequi` → `Sequía`). Matching ignores accents, case and surrounding whitespace. Suggestions are deduplicated, prioritize complete/prefix matches, are limited to six and respect the passage-type filter. Click/tap or use arrow keys and Enter; Escape dismisses suggestions before closing the explorer. All search and completion runs locally without API calls.

## Evidence and interpretation

- `app/src/data/chokepoints.ts`: typed, manually reviewed metrics with units, scope, period, source and estimate labels. EIA energy figures refer to 1H2025; Suez uses calendar-year 2025 transits and Panama uses fiscal-year 2025. Suez is not assigned the combined Suez/SUMED oil figure. The Turkish oil metric refers to Dardanelles, while the daily traffic series measures Bosporus. Taiwan value/exposure estimates are attributed to CSIS.
- Structural importance is an editorial category based on concentration and substitution constraints. Amber means very high importance, blue means high importance and teal identifies the Cape alternative route. These colors do not indicate a live disruption probability. Operational status is explicitly unverified.
- Corridors are hand-drawn, illustrative waypoints. They are separate from bilateral great-circle trade arcs, not AIS tracks or navigation instructions. Alternative availability depends on vessel and itinerary. Exposure descriptions distinguish sourced estimates from qualitative geographic relationships.
- Traffic counts and shares across passages must not be summed: a vessel/cargo can cross several passages. Vessel counts do not establish the value or tonnage of cargo. AIS observations can be incomplete and revised.

## Static traffic snapshot and costs

`app/src/data/chokepoint-traffic.json` is imported into the application, including the standalone build. It contains 90 calendar days for the nine passages from the public IMF PortWatch/UN Global Platform ArcGIS service. Its metadata retains source, methodology, terms, retrieval time and observation window. The initial snapshot ends on **2026-10-11**, retrieved **2026-10-20 Europe/Madrid**. The UI exposes these dates rather than calling this live data.

The public query service requires no key or account. No paid subscription, browser polling, scheduler, LLM or per-user API request is added. Review source terms before republishing data under different commercial conditions; attribution and a terms link are included. Public-source uptime and future availability are outside this app's control.

From the project root:

```powershell
python pipeline/build_chokepoints.py
python pipeline/build_chokepoints.py --refresh
```

The first command reuses an existing snapshot without network requests. An explicit refresh makes at most **two GET requests**, each with a 30-second timeout, no pagination, retries or recurring execution. It fetches the latest available date followed by a bounded 90-day window (810 observations, below the 1,000-record service limit). Errors, duplicate/out-of-window records, missing calendar rows and truncated responses fail before replacing the previous file. Source null observations remain null; zeros remain zeros.

Traffic statistics compare the latest 30 complete calendar days with the preceding 30. Any missing/null observation disables the affected mean; a zero previous mean has no percentage change. Graphs break at missing days and use an explicit per-passage scale starting at zero. Snapshot updates require a rebuild to reach the standalone output.

## Validation

```powershell
node --test app/tests/maritime.test.mjs
python -m unittest discover -s pipeline -p test_chokepoints.py
npm --prefix app run lint
npm --prefix app run build
```

Node 24 supports the TypeScript test imports without an extra test dependency. Tests cover non-overlapping comparison windows, null/zero handling, graph gaps, snapshot completeness, provenance, route coordinates and rejected invalid downloads.
