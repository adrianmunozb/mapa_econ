# World Economic Map — Frontend

React 19 + TypeScript + Vite web application for the World Economic Map: an interactive,
zoomable heatmap world map of official economic, health and social data, plus
bilateral trade flow visualization.

## Development

```bash
npm install
npm run dev      # dev server → http://localhost:5173
npm run build    # production build → dist/index.html
npm run lint     # ESLint
```

## Data

Static data lives in `public/data/*.json`. The app loads it via `src/data/useWorldData.ts` without requiring external backend or API keys.


## Public live webcams (worldwide)

Enable **Cámaras en directo**. The fixed catalog contains 2,799 cameras across 81 country and territory codes: 779 in the USA, 30 in Spain, and 1,990 in other countries and territories. It includes small cities and towns. Search by camera title, locality, region, category or provider; camera markers cluster by screen position and zoom. When a cluster cannot separate, the side list shows its cameras without loading video. Selecting one row loads only that camera's player. The world view groups the full catalog by country; USA and Spain regional maps still show only their own cameras.

The first international batch added 792 entries from a one-time intersection of the public [Camlisted stream snapshot](https://camlisted.com/data/streams.json), generated 2026-10-19 20:43:59 UTC, and the [GeoDataViewer world-camera index](https://geodataviewer.com/datasets/live-cams/world-live-cams/), downloaded 2026-10-20. Each was marked live in both snapshots; Camlisted additionally marked it approved, listed and embeddable, and both indexes agreed on the country code. A refreshed Camlisted snapshot later marked one stream offline, so it was removed; 791 remain in that batch. Earlier playback checks decoded samples from Germany, Japan, Italy, the United Kingdom, Taiwan and Canada.

The 1,213 Famelack additions came from its [public webcam dataset](https://github.com/famelack/famelack-data/tree/main/webcams/raw/categories), which is MIT-licensed and says it checks uptime, live status and browser playback. For this static 2026-10-20 batch, Famelack's country code had to agree with GeoDataViewer's country code and its live flag; any matching Camlisted record also had to be approved, listed, live and embeddable. This produced 516 additional U.S. cameras and 697 cameras in 62 other country and territory codes. Small-town examples include Afton, Wyoming; Ashland, Oregon; Bemidji, Minnesota; and Staunton, Virginia. State labels use the app's USA region polygons where a point falls inside one; 35 added U.S. feeds have no state polygon match, so their area label stays United States. Pins indicate an approximate view area, not the exact camera installation.

Playback checks on 2026-10-20 loaded video frames from 22 of 23 sampled feeds: six U.S. feeds and 16 feeds across international countries. A Netherlands feed (`pa7g8EaPwt8`) was marked live in the directories but showed an inactive live stream in the player, so it was excluded. In a second check, all 11 sampled streams advanced playback time over three seconds. This spot check confirms the embed path and catches some stale records; it does not verify every feed. Famelack's source-data MIT notice is retained in `THIRD_PARTY_NOTICES.md`.

The international batch initially added 533 direct HLS streams from the [Live-Environment-Streams index](https://github.com/william-ricchiuti/Live-Environment-Streams) and its OpenCCTV feed group. The snapshot labels that source group `open_data`; only active direct HTTPS manifests without query strings, token refresh, country-centroid coordinates or U.S. country codes were considered. Every HLS host was probed in a browser: 24 representative streams advanced playback, while 14 failing or stalled host groups were excluded. A later on-demand audit of all 32 Balearic camera entries found four HLS manifests returning HTTP 404 twice (Cabrera, Mallorca Alcudia, Alfàbia and Cala Sant Vicenç); those entries were removed, leaving 529 HLS cameras across 12 country codes. The other 28 Balearic entries advanced playback in sequential browser checks. The catalog keeps the original HLS URL and links to each camera's approximate OpenCCTV map location.

The earlier 257 USA additions came from the [Camlisted U.S. live-camera index](https://camlisted.com/country/united-states.html), which marked them approved, listed, live and embeddable. Core USA and Spain sources remain in `src/data/webcams.ts`; international additions are in `src/data/internationalWebcams.ts` and `src/data/famelackWebcams.ts`. Country display names come from `Intl.DisplayNames`; provider controls and original stream links remain available.

The player uses standard [YouTube embeds](https://developers.google.com/youtube/player_parameters) and the open-source [hls.js](https://github.com/video-dev/hls.js) player for direct HLS feeds. There is no paid subscription, API key, YouTube Data API, server relay, runtime camera discovery or status polling. The app stores static catalog metadata and direct source links; camera video is streamed from the provider and is not downloaded or republished. It mounts one player only after a camera is selected and removes it on close. Keep provider controls and source attribution intact; do not replace live video with a recorded walkthrough or timelapse just because its title includes LIVE.

Camera playback does not analyze video frames or load a computer-vision model.

The modal labels the country, camera title, category, region where available and provider. Both player types start muted; YouTube keeps its live controls and fullscreen, and HLS uses native video controls. Streaming has normal transmission delay; open the original source if a feed is unavailable. Fatal HLS errors stop that player, and offline users see a connection message.

Existing USA providers include [Fremont Cam](https://www.fremontcam.com/), [See Jackson Hole](https://www.youtube.com/@SeeJH), [St. George Tower](https://www.youtube.com/@StGeorgeTower), [Boston and Maine Live](https://www.youtube.com/@BostonAndMaineLive), and [Center Theatre](https://www.centertheatre.org/). Directory terms: [Camlisted terms](https://camlisted.com/terms.html). Spanish sources: [Alcudiamar](https://www.alcudiamar.es/es/webcam), [WingCam](https://www.youtube.com/watch?v=Snb-CD0ubEA), and [Tenerife North](https://www.youtube.com/watch?v=yrx0fvj-4QI). WingCam's required attribution remains directly beside its player. The self-contained build's offline economic map remains usable.

## Geographic news radar

Radar de noticias groups headlines into events across BBC, The Guardian, DW Español, France 24 Español and Al Jazeera. Larger, redder points indicate more recent coverage; a separate border indicates a measured increase once sufficient comparable history exists. Filter by topic/publisher, switch between mentioned countries and inferred/explicit event locations, and explore the seven-day timeline. The development server shares a persistent 15-minute cache with a bounded 14-day archive; standalone builds embed the last snapshot. CSV/JSON/RSS imports remain local. See [news radar documentation](../docs/news-radar.md) for methodology, formats, source terms, cost controls and production limitations.

# Government bond yields

Select **Government bond yield** in the heatmap metric picker and use **Bond maturity** to filter the map and ranking. Click a country to open its yield curve, dated values, currency and official source. Coverage is 57 countries with 54 recent 10-year observations and 21 multi-tenor country curves. Use **Explore yield curves** to select a supported country. The maturity options are fixed; only provider-reported terms appear, and missing terms stay empty. Sources are saved snapshots, not live prices.

Refresh manually with `python pipeline/build_bonds.py` from the repository root, then rebuild. There are no runtime API calls or paid services for this feature. See [coverage, sources and update controls](../docs/bond-yields.md).
