# Strategic map layers

The submarine cable, solar, and alliance layers are local visualizations. They add no API keys, subscriptions, runtime data endpoints, or paid services. Existing basemap tile loading is unchanged.

## Submarine cables

`src/map/cableFlow.ts` rounds schematic route corners in Mercator space and unwraps Pacific crossings. `cableGeometry.ts` prepares flat paths and cumulative distances once; `CableLayer.ts` draws the cyan core, halo and traveling packets in one shader over the static mesh. Animation updates only a time uniform at a maximum of 30 frames per second, without rebuilding paths or rendering React each frame. It stops when disabled, hidden, unmounted, or reduced motion is requested. Connection markers and route tooltips remain available. The legend identifies flow as illustrative, not measured traffic. See `docs/cable-activation.md` for the activation benchmark and its limits; the CPU `cablePulses` helper is retained as a test reference, not used for live rendering.

## Day and night

`src/lib/solar.ts` implements the [NOAA fractional-year equations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF) for solar declination and equation of time. UTC and leap-year length are used. The map shades solar altitudes below 0, -2, -4, -7, -11 and -18 degrees, giving a gradual twilight transition. One-degree longitude strips avoid dateline discontinuities; analytic latitude intervals account for polar day and night. This is a cartographic approximation, not a navigation or astronomical observation service.

`SolarCycle.tsx` updates from the device clock every 30 seconds. Its single timer is stopped while the tab is hidden and cleared on unmount. City lights fade in between solar altitude 0 and -8 degrees and appear only on the night side. The UTC badge updates with the same calculation.

The 3,301 city locations in `src/data/cities.json` come from [Natural Earth v5.1.2 populated places](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_10m_populated_places_simple.geojson), a [public-domain dataset](https://www.naturalearthdata.com/about/terms-of-use/). The bundle includes locations with population estimate at least 100,000 or cartographic scale rank at most 4. Historical population estimates only size the illustrative light halos; these are not satellite imagery or live electricity measurements. Rebuild with `python scripts/build-cities.py` (one download, no retries or scheduled requests).

## Geopolitical groups

`src/data/alliances.ts` stores ISO3 member lists, colors, descriptions, source links and review date. The UI supports simultaneous selections, uses a distinct color for countries in several selected groups, dims other countries, and filters the economic ranking to the selected union. Clearing the selection restores the economic color scale. The current selection and solar switch are shareable as URL hash parameters `a=nato,brics,eu` and `dn=1`.

Sources consulted on 2026-10-20:

- [NATO members](https://www.nato.int/cps/en/natohq/topics_52044.htm): 32 states, including Sweden and Finland.
- [Brazilian BRICS presidency](https://brics.br/en/news/brics-summit-will-be-held-in-rio-de-janeiro-on-july-6-7): 11 countries, including Saudi Arabia and Indonesia. Saudi status is attributed to that presidency in the UI because public descriptions have differed. Partner countries are excluded.
- [European Union countries](https://european-union.europa.eu/principles-countries-history/eu-countries_en): 27 states; excludes the UK and candidates.
- [Canada and the G7](https://www.international.gc.ca/world-monde/international_relations-relations_internationales/g7/index.aspx?lang=eng): seven national members. The EU participates separately; this does not make every EU state a national G7 member.
- [ASEAN Secretariat](https://asean.org/secretary-general-of-asean-holds-a-pull-aside-meeting-with-the-minister-of-transports-and-communication-of-timor-leste/): 11 states including Timor-Leste, admitted in October 2025.

Membership is bundled and dated, not automatically refreshed. These groups have different purposes; the UI does not portray all of them as military alliances. Existing country geometry may omit very small states at world-map scale.

## Checks and maintenance

`npm test` uses the installed Node 24 runtime's TypeScript support to run seven tests: solar timing and seasons, polar and equinox boundaries, polygon closure and dateline limits, member-list integrity and partner exclusions, all 32 selector combinations through MapLibre's expression compiler, city-coordinate validity, and cable packet movement.

`npm run lint` and `npm run build` check the app and self-contained HTML. Regional loading now stores country-tagged results and derives visible data from the requested country, preventing stale geography during switches without synchronous effect-driven resets. Unsupported regional hashes fall back to the world map after the coverage index loads. ESLint permits deliberately ignored `_`-prefixed compatibility arguments in the English-only label helpers. The build uses Rolldown's `codeSplitting: false` instead of its deprecated `inlineDynamicImports` option; the intentionally large single-file bundle still triggers the advisory chunk-size warning.
