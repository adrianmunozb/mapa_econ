# News radar

Enable **Radar de noticias** under **Capas Estratégicas**. Circle size and a yellow-to-orange-to-red gradient show relative recent coverage: hotter locations are larger and redder, even while history is still being collected. Select a circle or ranking row to see events, their linked headlines, publisher counts and timestamps. This is attention within the chosen feeds, not verified events or severity.

## Events, sources and geography

Headlines are grouped conservatively using shared country mentions, topic, a 36-hour maximum from the first headline, and overlapping normalized terms. A small English/Spanish synonym dictionary supports cross-language grouping. Groups compare against their first headline to avoid chains that merge an entire topic. Explicit imported `eventId` overrides grouping. Group titles are original headlines, not generated summaries. Grouping can split one real event or merge related reports; source links remain inspectable.

Duplicate links and normalized titles from the same publisher are removed. Identical headlines from different publishers remain as coverage evidence. Publisher identity is determined by the article domain, with BBC domain aliases unified; changing an imported source label cannot create more publishers. Different domains do not prove editorial independence or truth. Within an event, one publisher contributes once regardless of how many articles it publishes. The event weight increases logarithmically with up to four publishers and decays with a 24-hour half-life; countries/locations share that contribution.

Five feeds are configured in `app/src/data/news-feeds.json`: BBC World, The Guardian World, DW Español, France 24 Español, and Al Jazeera. The source panel shows language, scope, update status and last success. Source/topic filters apply to map, events and historical view. Topics are heuristic: geopolitics, economy, energy, disasters and other.

**Países mencionados** maps country names in English/Spanish and curated aliases to existing country centroids. **Lugar del suceso** uses explicit imported `eventCountries` or conservative title patterns such as "in Iran" / "en Ginebra". Known cities use approximate city coordinates; inferred countries use country centroids. An unrecognized event location remains unmapped rather than defaulting to a participant. The event detail distinguishes mentioned country codes, explicit occurrence countries and inferred places. These are approximate reference points, not exact incident coordinates.

## Change detection and timeline

The server retains up to 14 days / 8,000 metadata records and 1,400 collection samples in ignored `app/.news-cache/history.json`. Each successful collection sample records which sources were received. A sample covers only its preceding 15 minutes. Overlapping samples count once and gaps/failures remain unknown.

An increase is compared against a real baseline only when every selected source has at least 80% sampled coverage in each of the preceding four 24-hour periods. The last 24 hours' event count is compared with the daily average of the prior three days. At least three recent events and two recent publishers are required for a signal; a zero historical baseline is labeled **Foco emergente** instead of an infinite percentage. Fewer observations display **Historial insuficiente**. Source outages, changes in the selected source cohort and sparse observations suppress misleading signals. Attention is an estimate dependent on feed availability and heuristic clustering, not a statistical causal claim.

Map circles have no visible numeric labels; counts remain available in tooltips, accessible labels and event details. The coverage gradient works immediately and does not imply an increase from history. A light border indicates a measured increase of at least 50% or an emerging focus. A brief halo (three two-second pulses, reduced-motion aware) marks newly received articles published within an hour and first seen within 15 minutes; old backfilled stories do not pulse.

The seven-day slider and daily bars explore the retained archive by publication date. Past views exclude later articles and collection samples; bars show raw headline counts, not events. Empty bars can mean no collection, not zero real-world news. This is a retrospective publication-date view, not a reconstruction of exactly what a publisher displayed at that instant. Retention covers a seven-day window ending up to seven days ago. Only collected stories are available; no historical archive was purchased or invented.

## Refresh, limits and cost

`npm run dev` exposes `/api/news-feed` as JSON. With the radar active, the browser requests it immediately and every 15 minutes. A single shared service deduplicates concurrent requests across clients, caches successes and failures for 15 minutes, and retains the last valid stories on partial/total failure. Cache state survives server restarts. No work runs until requested; there is no background cron, auto-retry loop or separate LLM/geocoding request per headline. Turning the layer off/unmounting aborts its pending request and clears its timer. Imports suspend automatic replacement until reset.

There are at most eight configured HTTPS feeds, each with one 15-second request per cache interval, 2 MB streaming limit and 500 parsed items. The current five-feed setup therefore makes at most five upstream requests per shared 15-minute refresh. Failed or invalid feeds get a visible warning and cannot discard the other publishers' data. Only titles, dates, links and attribution are stored from feeds; full articles are not fetched or redistributed. XML with DTD/entity declarations is rejected. A local archive write failure is reported and the data remains in memory.

No paid APIs, account keys, AI tokens or geocoding fees are involved. RSS publisher terms still apply, particularly for commercial redistribution; no commercial license has been acquired. Publisher references: [BBC feed information](https://support.bbc.co.uk/platform/feeds/NewsFeeds.htm), [BBC RSS terms](https://downloads.bbc.co.uk/usingthebbc/bbc_terms_of_use_31March2022english.pdf), [Guardian RSS help](https://www.theguardian.com/help/feeds), [DW feed](https://rss.dw.com/rdf/rss-sp-all), [France 24 feed](https://www.france24.com/es/rss), [Al Jazeera feed](https://www.aljazeera.com/xml/rss/all.xml).

The Node XML parser is `fast-xml-parser` (development dependency only); it does not add an API call or enter the client bundle. The Python updater uses only the standard library and the same feed catalog.

Production/single-file builds embed the dated `app/src/data/news-snapshot.json` and have no live production backend. Update that archive and rebuild:

```powershell
python pipeline/build_news.py
cd app
npm run build
```

The Python command merges the previous snapshot, preserves first-seen dates, stores source status and observations, prunes retention and atomically replaces output. Repeated `--feed` arguments can specify alternative HTTPS feeds (maximum eight). It preserves the prior file on total failure and returns nonzero. A hosted always-live cache or scheduled production rebuild has not been deployed.

## Import a sheet or feed

Expand **Importar una hoja o un feed**. Import CSV, JSON array / `{ "articles": [...] }`, or RSS/Atom XML. Maximum file size is 5 MB and maximum processed input rows is 5,000. Comma/semicolon CSV, escaped quotes and multiline quoted cells are supported. Invalid entries are discarded; wholly invalid imports show an error without replacing existing data. Imports stay in browser memory, are not uploaded or persisted, and do not supply verified collection observations for a trend baseline.

Required fields: `title`, HTTP(S) `url`, `publishedAt` (ISO timestamp with timezone recommended). Optional: `source`, `summary`, `countries` (mentioned ISO3 codes), `eventCountries` (occurrence ISO3 codes), `eventId` and `topic` (`geopolitics`, `economy`, `energy`, `disasters`, `other`). Country codes can be pipe-separated in CSV or arrays in JSON. Explicit geography overrides recognition.

```csv
title,url,publishedAt,source,countries,eventCountries,eventId,topic
"Example: negotiations in Geneva",https://example.org/story,2026-10-20T10:00:00Z,Example,IRN|USA,CHE,example-negotiations,geopolitics
```

This is a format example, not a news report. Only real fetched headlines are included in the default snapshot.

## Validation

`npm test` covers geography, event clustering, source identity, baseline coverage/gaps, time/source/topic filtering, future leakage, imports, unsafe links, bounded concurrent collection, failure caching, archive retention and restart persistence. `python -m unittest discover -s pipeline -p test_news.py` covers RSS, Atom, RDF/DC dates and rejected DTD declarations. Build and lint are checked. Browser verification covers actual source statuses, grouped source-linked headlines, energy filtering, occurrence geography, historical navigation and single-publisher/all-publisher selection. Grouping quality across arbitrary languages, exhaustive geography and long-running baseline collection remain limitations.
