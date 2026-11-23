# Performance benchmarks

Run from `app` with Node 24 (native TypeScript stripping) and the project's existing dependencies:

```sh
npm run bench
npm run bench:check
npm run bench -- --reference --output benchmarks/baseline.json
npm run bench -- --check --compare benchmarks/baseline.json --output benchmarks/optimized.json
```

The runner makes no network requests. It loads the bundled country boundaries and submarine routes, plus deterministic equinox/solstice dates. The denser cable scenario subdivides the controls 16 times to stress longer paths; it is synthetic, not additional live traffic. Frozen implementations in `tests/fixtures/*-before.ts` preserve the pre-optimization reference and support equivalence tests. Keep them unchanged when optimizing production code.

Each case warms up 40 operations, calibrates a batch to at least 20 ms (at most 16,384 operations), and collects 21 batches. Reported median and p95 are the per-operation averages of those batches, not percentiles of individual browser frames. JSON includes runtime, CPU, platform, fixture sizes and iteration counts. Timing loops are finite and opt-in; nothing is added to production telemetry or timers. Run comparisons sequentially on the same machine, preferably idle and plugged in.

## Recorded results, 2026-10-20

Local Windows x64 / Node v24.19.0 results; exact reports and machine metadata are in `benchmarks/baseline.json` and `benchmarks/optimized.json`.

| Scenario | Reference median (ms) | Optimized median (ms) | Optimized p95 (ms) | p95 budget (ms) |
| --- | ---: | ---: | ---: | ---: |
| Cable animation, bundled routes | 0.182 | 0.034 | 0.361 | 0.5 |
| Cable animation, dense stress fixture | 1.454 | 0.071 | 0.136 | 2 |
| Solar polygons | 15.162 | 9.180 | 12.650 | 25 |
| Country bounding boxes + centroids (unchanged control) | 11.633 | 14.447 | 23.218 | 100 |
| All market statuses | 17.971 | 0.317 | 0.850 | 1 |

Cable interpolation now retains Mercator controls from preparation, finds endpoints with binary search, and visits only the vertices inside each pulse. This avoids repeated projections and full-route scans. It increases retained route memory by one projected coordinate pair per smoothed vertex.

Solar strips reuse the preceding right edge as the next left edge. Midpoint classification compares the existing solar dot product against the sine of the threshold, avoiding a repeated inverse sine and longitude/declination calculations. Geometry remains exactly equal in the reference tests.

Market and country clock calculations reuse `Intl.DateTimeFormat` objects in a cache bounded to 64 entries. Dates and status results are always recomputed, including seconds, market boundaries and DST. No timer cadence or network behavior changes.

The unchanged country-geometry control was about 24% slower in this pair of runs, illustrating host scheduling and garbage-collection noise. Do not attribute its change to an optimization or interpret the other ratios as exact universal speedups. The optimized cable/market workloads are substantially faster; local solar timings also improve. This suite does not measure total startup, GPU rendering, FPS, interaction latency, memory peaks or a mobile browser. Those remain separate profiling tasks. The single-file production artifact remains approximately 11.4 MB; this work targets execution cost rather than download size.

`bench:check` exits nonzero if a batch p95 exceeds its budget. These are initial local guardrails: cable generation receives a small fraction of the 33.3 ms animation interval, solar updates are infrequent, and geometry initialization has a larger one-time budget. Calibrate budgets explicitly for slower target hardware. A failed timing check should be investigated with repeated idle measurements rather than automatically loosening limits.

## Verification

The initial optimization passed `npm test` (14 tests), `npm run lint`, `npm run build`, and the saved optimized benchmark run with `--check`. The subsequent transition work below expands that verification. No new dependency, paid API, key, background request or retry loop was introduced.

## Smooth map updates (2026-10-20 follow-up)

For the subsequent cable activation benchmark and GPU renderer, see [Cable activation](cable-activation.md). Its browser check covers costs missing from the original CPU-only `cable-frame` benchmark.

`SmoothFill` crossfades two persistent fill layers over 220 ms. It changes opacity rather than relying on `fill-color-transition`: MapLibre's installed `src/style/properties.ts` explicitly snaps data-driven paint values. Both layers share one GeoJSON source, and the hidden slot receives the next expression. Reduced motion disables the fade. Rapid selections replace the target rather than queueing animations.

Regional geometry now contains all four indicator values and their years after loading. Changing indicators updates the paint expression and legend, without replacing the GeoJSON source. Region hover reads the active indicator, and changing indicators clears the previous tooltip. World geometry already followed the same static-data approach.

WorldMap, RegionMap, deck overlays, rankings, market ticker and the maritime explorer use stable props and memoization to avoid rebuilding heavy children on every tooltip move. Pointer updates are coalesced to one callback per animation frame; feature hover state changes only when entering a different shape. The country clock has its own component so its second-by-second updates do not rebuild the full indicator table and history chart. Number formatters are reused in a 32-entry cache. Cable animation retains elapsed time across layer changes, avoiding a visible restart. Both map views opt into the installed wrapper's `reuseMaps` support to retain the WebGL canvas across regional/world changes.

`tests/map-interaction.test.mjs` covers pointer bursts/cancellation, crossfade slot continuity and number-format equivalence. The full suite has 20 passing tests after the follow-up; lint and the standalone production build pass. One build encountered a transient Windows/OneDrive `ENOTEMPTY` while cleaning generated output; retrying the normal build succeeded. The standalone HTML is now approximately 11.5 MB, including concurrent project changes, so size differences should not all be attributed to this follow-up.

`scripts/check-map-transitions.mjs` is an optional browser integration check. It requires Playwright available via normal Node resolution or `NODE_PATH`; Playwright is not added as an application dependency. Start the dev server at port 5184, then run:

```sh
node scripts/check-map-transitions.mjs benchmarks/transitions-after.json
```

The check supplies an empty local basemap to avoid external tile requests, watches real `GeoJSONSource.setData` calls across metric changes, checks reduced motion, and navigates between map views to check canvas reuse. Its JSON includes console/page errors. Headless development-mode frame timings depend strongly on software rendering and host load; they are not evidence of a fixed FPS rate or a before/after speedup. Interactive GPU/mobile profiling remains a separate task.

