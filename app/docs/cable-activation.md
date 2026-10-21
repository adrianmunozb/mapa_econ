# Cable activation benchmark and GPU animation

The original CPU pulse benchmark measured an interpolation helper, excluding layer construction, tessellation, driver compilation and GPU work. It could pass while the first cable activation still stalled. The dedicated browser benchmark measures a real toggle through the application's deck.gl overlay, including a benchmark-only `gl.finish()` fence when the animated layer first renders. The fence is never used in production.

## Local results, 2026-10-20

Headless Chromium, development build, 1280 × 800, empty local basemap; same local Windows computer. Saved reports: `benchmarks/cable-activation-before.json` and `benchmarks/cable-activation-after.json`.

| Activation | Previous animated frame, GPU complete | New animated frame, GPU complete |
| --- | ---: | ---: |
| First activation | 3,635.4 ms | 138.5 ms |
| Reactivation 1 | 188.0 ms | 41.5 ms |
| Reactivation 2 | 148.5 ms | 25.4 ms |

The first complete animated frame is approximately 96.2% faster in this local pair of runs. The original thin static lines were submitted after 71.7 ms, versus 138.3 ms with the combined renderer: the substantial improvement concerns the complete animated network, not the first static-line submission. Repeated activations also improve. Three samples are diagnostic evidence, not a statistical latency distribution or a guarantee across hardware and driver caches.

## What changed

`CableLayer` renders the cable halo, core and traveling packets in a single path mesh instead of four PathLayers for static paths and changing pulse paths. Mercator distances and stagger phases become fixed per-segment attributes. The shader uses the same four-degree packet length, five degrees/second speed and 26-degree repeat spacing. Each animation frame changes only the time/animation uniforms. Geometry, tessellation and vertex buffers remain fixed. Existing route coordinates, schematic smoothing, landing markers and tooltip provenance remain available.

Flat XY paths are explicitly normalized by the application before selecting the installed PathLayer's open-path fast path. Continuous longitude coordinates preserve Pacific routes. Reduced motion renders the static cable network; disabling the layer, hiding the document or unmounting cancels animation. There is no extra warming phase at application startup, new service, external request, dependency or subscription.

The browser check observed **zero geometry rebuilds during an animated interval** and the **same GPU model** across uniform updates. A local screenshot was visually inspected to confirm that cables, bright packets and landing markers actually render. Shader/console errors cause the benchmark to fail, preventing an invisible failed layer from appearing to be fast.

## Repeat the measurement

Start the existing Vite dev server from `app`:

```sh
npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
```

In another terminal, make an existing Playwright installation available through normal module resolution or `NODE_PATH`. In this desktop environment the bundled package can be selected in PowerShell without installing anything:

```powershell
$env:NODE_PATH = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
npm run bench:cables:check -- benchmarks/cable-activation-after.json
```

`npm run bench:cables` records measurements without timing gates. `--screenshot` also saves a preview in the OS temporary directory. Runs are finite: one first activation and two reactivations, then browser cleanup. The check uses initial local limits of 500 ms for the first complete frame and 150 ms per reactivation, plus hard checks for errors and geometry/model churn. Calibrate timing budgets explicitly on other target hardware. Playwright remains an optional development tool, not an application dependency.

The recorded optimized run passed all limits, with no console/page errors. The full suite passes 22 tests, including flat-path/dateline integrity and GPU packet phase equivalence to the previous CPU reference. TypeScript, lint and the standalone production build pass. General map-transition integration checks also pass: no GeoJSON reload on indicator changes, reduced-motion support and canvas reuse in both navigation directions. See `docs/performance.md` and `benchmarks/transitions-after.json`. Headless general-map frame timings remain unsuitable for claiming a fixed interactive FPS rate.
