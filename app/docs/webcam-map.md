# Camera map density and performance

The camera layer clusters by screen distance, rather than country boundaries. At
world scale, nearby cameras share a badge with an exact count. Clicking zooms in;
coincident coordinates or the map's maximum zoom open a paginated selection list.
Approximate camera coordinates remain unchanged. Cluster anchors use a member's
location and stay at least 72 CSS pixels apart after each completed interaction.
Badges are 52 by 44 pixels, so adjacent cells cannot produce overlapping badges.

Only cameras inside the viewport plus a 28px edge margin contribute markers.
Panning, zooming and resize refresh the groups; resize/moveend events coalesce
into one animation frame. While moving, MapLibre moves existing markers; the
catalog is regrouped when movement ends. React memoization prevents unrelated
hover and UI updates from projecting the entire catalog. Longitude projection
uses the world copy closest to the current center for antimeridian navigation.
Enabling cameras preserves the user's current view.

The country catalog mounts camera rows only for expanded countries, 40 at a time.
Search text is indexed once and includes country, city, area, provider and category.
Up to three matching countries expand automatically; broader searches retain the
country summaries. Coincident-camera selection also loads 40 rows at a time.
All cameras remain available via search and pagination, independent of viewport.
No video, thumbnail, player or camera API is requested by grouping or browsing.

## Camera video playback

Selecting a camera mounts one player on demand. Direct HLS feeds use hls.js and
YouTube feeds use an embedded player. Video frames are not analyzed and no
computer-vision model is loaded. Closing the camera removes the player.

Run `npm test` for count conservation, edge culling, adjacent-cell collisions,
coincident cameras, zoom separation, and a dense 10,000-point layout. Run
`npm run bench:webcams -- --output benchmarks/webcams.json` for the actual local
catalog and synthetic 10,000/50,000-camera workloads. The benchmark includes
Mercator projection and clustering, with 20 warmups and 51 measured passes.
These are local computation timings, not browser frame-rate guarantees. The
number of DOM markers is bounded by viewport area, rather than catalog length.
