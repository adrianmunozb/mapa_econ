import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { useWorldData } from './data/useWorldData';
import { WorldMap, type HoverInfo, type Arc } from './map/WorldMap';
import { RegionMap, type RegionHoverInfo, type RegionSelection } from './map/RegionMap';
import { MetricPicker } from './ui/MetricPicker';
import { Legend } from './ui/Legend';
import { CountryPanel, type TradeSummary } from './ui/CountryPanel';
import { Tooltip } from './ui/Tooltip';
import { RankingList } from './ui/RankingList';
import { SearchBox } from './ui/SearchBox';
import { CompareBar } from './ui/CompareBar';
import { CompareTable } from './ui/CompareTable';
import { RegionalPanel } from './ui/RegionalPanel';
import { buildColorScale, buildDivergingScale } from './lib/colors';
import { formatValueWithUnit, formatUsdCompact, formatCompact, formatChange } from './lib/format';
import { changeSince } from './lib/timeseries';
import { bboxOf, mergeBBox, largestPolygonCentroid, type BBox } from './lib/geo';
import { fmt, metricDescription, metricShortLabel, metricUnit, useLang } from './i18n';
import type { CountryData } from './types';
import {
  REGIONAL_METRICS,
  formatRegionalValue,
  latestRegionalValue,
  type RegionalMetricId,
  type RegionRecord,
} from './data/regions';

const MAX_COMPARE = 4;
const CHANGE_PERIODS = [2004, 2014]; // baked into the geojson for fast development-mode coloring

type ViewMode = 'current' | 'change';

/** Read shareable state from the URL hash. */
function readHash() {
  if (typeof location === 'undefined') return { m: null as string | null, c: null as string | null, t: false, v: null as string | null, fy: null as string | null, r: false, rm: null as string | null };
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  return { m: p.get('m'), c: p.get('c'), t: p.get('t') === '1', v: p.get('v'), fy: p.get('fy'), r: p.get('r') === '1', rm: p.get('rm') };
}

export default function App() {
  const { lang, setLang, t } = useLang();
  const initial = useMemo(() => readHash(), []);
  const [metricId, setMetricId] = useState(initial.m || 'gdp_per_capita');
  const [selectedIso, setSelectedIso] = useState<string | null>(initial.c);
  const [regionalIso, setRegionalIso] = useState<string | null>(initial.r ? initial.c : null);
  const [regionalMetricId, setRegionalMetricId] = useState<RegionalMetricId>(
    REGIONAL_METRICS.some((metric) => metric.id === initial.rm)
      ? (initial.rm as RegionalMetricId)
      : 'gdpPerCapitaUsd2015',
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionSelection | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [regionHover, setRegionHover] = useState<RegionHoverInfo | null>(null);
  const [focusBbox, setFocusBbox] = useState<BBox | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState(initial.t);
  const [viewMode, setViewMode] = useState<ViewMode>(initial.v === 'change' ? 'change' : 'current');
  const [changeFromYear, setChangeFromYear] = useState(initial.fy === '2014' ? 2014 : 2004);
  const {
    snapshot,
    geojson,
    trade,
    timeseries,
    products,
    regionalIndex,
    regionalGeometry,
    regionalCountryData,
    error,
  } = useWorldData(regionalIso);

  // Keep the URL hash in sync so the current view is shareable.
  useEffect(() => {
    const p = new URLSearchParams();
    p.set('m', metricId);
    if (selectedIso) p.set('c', selectedIso);
    if (regionalIso) p.set('r', '1');
    if (regionalMetricId !== 'gdpPerCapitaUsd2015') p.set('rm', regionalMetricId);
    if (tradeMode) p.set('t', '1');
    if (viewMode === 'change') {
      p.set('v', 'change');
      p.set('fy', String(changeFromYear));
    }
    const hash = `#${p.toString()}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }, [metricId, selectedIso, regionalIso, regionalMetricId, tradeMode, viewMode, changeFromYear]);

  const byIso = useMemo(() => {
    const map = new Map<string, CountryData>();
    snapshot?.countries.forEach((c) => map.set(c.iso3, c));
    return map;
  }, [snapshot]);

  const metric = useMemo(() => snapshot?.metrics.find((m) => m.id === metricId), [snapshot, metricId]);

  // Per-country bounding boxes → fly-to.
  const bboxes = useMemo(() => {
    const map = new Map<string, BBox>();
    if (!geojson) return map;
    for (const f of (geojson as { features: Array<{ geometry: unknown; properties: Record<string, unknown> | null }> }).features) {
      const iso3 = f.properties?.iso3 as string | undefined;
      if (!iso3) continue;
      const b = bboxOf(f.geometry);
      if (!b) continue;
      const existing = map.get(iso3);
      map.set(iso3, existing ? mergeBBox(existing, b) : b);
    }
    return map;
  }, [geojson]);

  // Trade-arc node per country: centroid of its largest landmass (not the whole-geometry
  // bbox center, which lands in the ocean for USA/France/Russia/Fiji and offsets arcs).
  const centroids = useMemo(() => {
    const map = new Map<string, [number, number]>();
    const areas = new Map<string, number>();
    if (!geojson) return map;
    for (const f of (geojson as { features: Array<{ geometry: unknown; properties: Record<string, unknown> | null }> }).features) {
      const iso3 = f.properties?.iso3 as string | undefined;
      if (!iso3) continue;
      const rp = largestPolygonCentroid(f.geometry);
      if (!rp) continue;
      if (!areas.has(iso3) || rp.area > (areas.get(iso3) as number)) {
        areas.set(iso3, rp.area);
        map.set(iso3, rp.point);
      }
    }
    return map;
  }, [geojson]);

  const centroid = useCallback(
    (iso3: string): [number, number] | null => {
      const c = centroids.get(iso3);
      if (c) return c;
      const b = bboxes.get(iso3);
      return b ? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] : null;
    },
    [centroids, bboxes],
  );

  // Bake raw values + change-over-period values into each feature once. Switching
  // metric / mode / period then only swaps the paint expression (no GeoJSON re-parse).
  const enriched = useMemo(() => {
    if (!snapshot || !geojson) return null;
    const fc = geojson as { features: Array<{ geometry: unknown; properties: Record<string, unknown> | null }> };
    const tdata = timeseries?.data;
    const features = fc.features.map((f) => {
      const iso3 = f.properties?.iso3 as string | undefined;
      const country = iso3 ? byIso.get(iso3) : undefined;
      const props: Record<string, unknown> = { iso3, name: f.properties?.name };
      if (country) {
        for (const m of snapshot.metrics) {
          const raw = country.metrics[m.id]?.value;
          if (typeof raw === 'number') props[m.id] = raw;
          const hist = iso3 ? tdata?.[iso3]?.[m.id] : undefined;
          if (hist) {
            for (const fy of CHANGE_PERIODS) {
              const ch = changeSince(hist, fy, m.format);
              if (ch != null) props[`${m.id}__chg${fy}`] = ch;
            }
          }
        }
      }
      return { type: 'Feature', geometry: f.geometry, properties: props };
    });
    return { type: 'FeatureCollection', features };
  }, [snapshot, geojson, byIso, timeseries]);

  // The value shown per country for the active metric + view mode.
  const display = useMemo(() => {
    const m = new Map<string, number>();
    if (!snapshot || !metric) return m;
    if (viewMode === 'current') {
      for (const c of snapshot.countries) {
        const v = c.metrics[metric.id]?.value;
        if (typeof v === 'number') m.set(c.iso3, v);
      }
    } else {
      const tdata = timeseries?.data;
      for (const c of snapshot.countries) {
        const ch = changeSince(tdata?.[c.iso3]?.[metric.id], changeFromYear, metric.format);
        if (ch != null) m.set(c.iso3, ch);
      }
    }
    return m;
  }, [viewMode, metric, changeFromYear, snapshot, timeseries]);

  const scale = useMemo(() => {
    if (!metric) return null;
    const vals = [...display.values()];
    return viewMode === 'current'
      ? buildColorScale(vals, metric.id)
      : buildDivergingScale(vals, `${metric.id}__chg${changeFromYear}`);
  }, [display, metric, viewMode, changeFromYear]);

  const formatValue = useCallback(
    (v: number) => {
      if (!metric) return String(v);
      return viewMode === 'current' ? formatValueWithUnit(v, metric, lang) : formatChange(v, metric, lang);
    },
    [viewMode, metric, lang],
  );

  // Trade arcs from the selected country to its top export partners.
  const arcs = useMemo<Arc[]>(() => {
    if (!tradeMode || !selectedIso || !trade) return [];
    const flow = trade.flows[selectedIso];
    const src = centroid(selectedIso);
    if (!flow || !src) return [];
    const reporterName = byIso.get(selectedIso)?.name ?? selectedIso;
    const maxV = Math.max(...flow.partners.map((p) => p.v), 1);
    const out: Arc[] = [];
    for (const p of flow.partners) {
      const tgt = centroid(p.p);
      if (!tgt) continue;
      const pname = byIso.get(p.p)?.name ?? p.p;
      const share = flow.total ? (p.v / flow.total) * 100 : 0;
      out.push({
        source: src,
        target: tgt,
        width: 1.5 + 7 * (p.v / maxV),
        label: `${reporterName} → ${pname}: ${formatUsdCompact(p.v, lang)}${share ? ` (${share.toFixed(1)} %)` : ''}`,
      });
    }
    return out;
  }, [tradeMode, selectedIso, trade, centroid, byIso, lang]);

  const tradeSummary = useMemo<TradeSummary | null>(() => {
    if (!trade || !selectedIso) return null;
    const flow = trade.flows[selectedIso];
    if (!flow) return null;
    return {
      year: flow.year,
      total: flow.total,
      partners: flow.partners.slice(0, 6).map((p) => ({
        iso3: p.p,
        name: byIso.get(p.p)?.name ?? p.p,
        iso2: byIso.get(p.p)?.iso2,
        value: p.v,
        share: flow.total ? (p.v / flow.total) * 100 : 0,
      })),
    };
  }, [trade, selectedIso, byIso]);

  const flyTo = useCallback(
    (iso3: string) => {
      setSelectedIso(iso3);
      let box = bboxes.get(iso3);
      const flow = tradeMode ? trade?.flows[iso3] : undefined;
      if (box && flow) {
        let b: BBox = [...box];
        for (const p of flow.partners) {
          const c = centroid(p.p);
          if (c) b = [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[0]), Math.max(b[3], c[1])];
        }
        box = b;
      }
      if (box) {
        setFocusBbox(box);
        setFocusNonce((n) => n + 1);
      }
    },
    [bboxes, tradeMode, trade, centroid],
  );

  const addCompare = useCallback((iso3: string) => {
    setCompare((prev) => (prev.includes(iso3) || prev.length >= MAX_COMPARE ? prev : [...prev, iso3]));
  }, []);
  const removeCompare = useCallback((iso3: string) => {
    setCompare((prev) => prev.filter((i) => i !== iso3));
  }, []);

  const compareCountries = useMemo(
    () => compare.map((iso) => byIso.get(iso)).filter((c): c is CountryData => !!c),
    [compare, byIso],
  );

  const regionsById = useMemo(() => {
    const map = new Map<string, RegionRecord>();
    regionalCountryData?.regions.forEach((region) => map.set(region.id, region));
    return map;
  }, [regionalCountryData]);

  const enrichedRegional = useMemo(() => {
    if (!regionalGeometry || !regionalCountryData) return null;
    const fc = regionalGeometry as {
      type: string;
      features: Array<{ type: string; geometry: unknown; properties: Record<string, unknown> | null }>;
    };
    return {
      type: fc.type,
      features: fc.features.map((feature) => {
        const properties: Record<string, unknown> = { ...(feature.properties ?? {}) };
        const regionId = typeof properties.regionId === 'string' ? properties.regionId : null;
        const value = latestRegionalValue(regionId ? regionsById.get(regionId) : undefined, regionalMetricId);
        if (value) {
          properties.metricValue = value.value;
          properties.metricYear = value.year;
        } else {
          delete properties.metricValue;
          delete properties.metricYear;
        }
        return { ...feature, properties };
      }),
    };
  }, [regionalGeometry, regionalCountryData, regionsById, regionalMetricId]);

  const regionalScale = useMemo(() => {
    const features = (enrichedRegional as { features: Array<{ properties: Record<string, unknown> }> } | null)?.features ?? [];
    const values = features
      .map((feature) => feature.properties.metricValue)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    return buildColorScale(values, 'metricValue');
  }, [enrichedRegional]);

  const regionalBbox = useMemo(() => {
    const bboxMap = { features: (regionalGeometry as { features?: Array<{ geometry: unknown }> } | null)?.features ?? [] };
    let bounds: BBox | null = null;
    for (const feature of bboxMap.features) {
      const next = bboxOf(feature.geometry);
      if (next) bounds = bounds ? mergeBBox(bounds, next) : next;
    }
    return bounds;
  }, [regionalGeometry]);

  const selectWorldCountry = useCallback((iso3: string | null) => {
    setSelectedIso(iso3);
    setHover(null);
    setRegionHover(null);
    setSelectedRegion(null);
    setRegionalIso(iso3 && regionalIndex?.countries[iso3] ? iso3 : null);
  }, [regionalIndex]);

  const openRegionalForSelected = useCallback(() => {
    if (!selectedIso || !regionalIndex?.countries[selectedIso]) return;
    setRegionalIso(selectedIso);
    setSelectedRegion(null);
    setRegionHover(null);
  }, [regionalIndex, selectedIso]);

  const closeCountryPanel = useCallback(() => {
    setSelectedIso(null);
    setRegionalIso(null);
    setSelectedRegion(null);
  }, []);

  const backToWorldMap = useCallback(() => {
    const iso3 = regionalIso;
    setRegionalIso(null);
    setSelectedRegion(null);
    setRegionHover(null);
    if (iso3) flyTo(iso3);
  }, [regionalIso, flyTo]);

  useEffect(() => {
    if (regionalIso && regionalIndex && !regionalIndex.countries[regionalIso]) {
      setRegionalIso(null);
    }
  }, [regionalIso, regionalIndex]);

  const ready = enriched && scale && metric;
  const hoverValue = hover ? display.get(hover.iso3) : undefined;

  return (
    <div className="app">
      <div className="map-root">
        {!regionalIso ? (
          ready ? (
            <WorldMap
              data={enriched}
              fillColor={scale.expression}
              selectedIso={selectedIso}
              focusBbox={focusBbox}
              focusNonce={focusNonce}
              arcs={arcs}
              onHover={setHover}
              onSelect={selectWorldCountry}
            />
          ) : (
            <div className="map-placeholder">
              <div className="spinner" />
              <p>{error ? fmt(t.loadError, { error }) : t.loading}</p>
            </div>
          )
        ) : enrichedRegional ? (
          <RegionMap
            key={regionalIso}
            data={enrichedRegional}
            fillColor={regionalScale.expression}
            selectedShapeId={selectedRegion?.shapeId ?? null}
            focusBbox={regionalBbox}
            countryName={byIso.get(regionalIso)?.name ?? regionalIso}
            onHover={setRegionHover}
            onSelect={setSelectedRegion}
          />
        ) : (
          <div className="map-placeholder">
            <div className="spinner" />
            <p>{error ? fmt(t.loadError, { error }) : t.loading}</p>
          </div>
        )}
      </div>

      <div className="hud lang-switch" role="group" aria-label={t.language}>
        <button
          type="button"
          className={`lang-btn${lang === 'en' ? ' lang-btn--on' : ''}`}
          onClick={() => setLang('en')}
        >
          EN
        </button>
        <button
          type="button"
          className={`lang-btn${lang === 'de' ? ' lang-btn--on' : ''}`}
          onClick={() => setLang('de')}
        >
          DE
        </button>
      </div>

      {!regionalIso && <header className="hud hud--top-left scroll-slim">
        <div className="brand">
          <span className="brand__globe">🌍</span>
          <div>
            <h1 className="brand__title">World Economic Map</h1>
            <p className="brand__sub">{t.brandSub}</p>
          </div>
        </div>

        {snapshot && metric && scale && (
          <div className="controls">
            <SearchBox countries={snapshot.countries} onPick={flyTo} />
            <MetricPicker metrics={snapshot.metrics} value={metricId} onChange={setMetricId} />
            <p className="metric-desc">{metricDescription(metric, lang)}</p>

            {timeseries && (
              <div className="segmented">
                <button
                  className={`seg${viewMode === 'current' ? ' seg--on' : ''}`}
                  onClick={() => setViewMode('current')}
                >
                  {t.viewCurrent}
                </button>
                <button
                  className={`seg${viewMode === 'change' ? ' seg--on' : ''}`}
                  onClick={() => setViewMode('change')}
                >
                  {t.viewChange}
                </button>
              </div>
            )}
            {viewMode === 'change' && (
              <label className="field">
                <span>{t.period}</span>
                <select
                  className="select"
                  value={changeFromYear}
                  onChange={(e) => setChangeFromYear(Number(e.target.value))}
                >
                  <option value={2004}>{t.since2004}</option>
                  <option value={2014}>{t.since2014}</option>
                </select>
              </label>
            )}

            <Legend
              unit={viewMode === 'current' ? metricUnit(metric, lang) : fmt(t.changeSince, { year: changeFromYear })}
              hint={viewMode === 'current' ? t.hintCurrent : t.hintChange}
              scale={scale}
              formatTick={(v) => (viewMode === 'current' ? formatCompact(v, metric, lang) : formatChange(v, metric, lang))}
            />

            <button
              className={`btn toggle${tradeMode ? ' toggle--on' : ''}`}
              onClick={() => setTradeMode((m) => !m)}
            >
              {tradeMode ? t.tradeFlowsOn : t.tradeFlowsOff}
            </button>
            {tradeMode && (
              <p className="hud__hint">
                {selectedIso && trade?.flows[selectedIso]
                  ? t.arcsHintSelected
                  : t.arcsHintNone}
              </p>
            )}

            <RankingList
              countries={snapshot.countries}
              getValue={(c) => display.get(c.iso3)}
              format={formatValue}
              ascending={viewMode === 'current' ? metric.higherIsBetter === false : false}
              label={viewMode === 'current' ? t.ranking : t.biggestChange}
              selectedIso={selectedIso}
              onPick={flyTo}
            />
          </div>
        )}
      </header>}

      {regionalIso && regionalIndex?.countries[regionalIso] && (
        <header className="hud hud--top-left regional-controls scroll-slim">
          <button className="btn" onClick={backToWorldMap}>{t.regionalBack}</button>
          <h2 className="regional-controls__title">{byIso.get(regionalIso)?.name ?? regionalIso}</h2>
          <p className="regional-controls__country">{t.regionalHint}</p>
          <label className="field">
            <span>{t.regionalMetricPicker}</span>
            <select
              className="select"
              value={regionalMetricId}
              onChange={(event) => setRegionalMetricId(event.target.value as RegionalMetricId)}
            >
              {REGIONAL_METRICS.map((regionalMetric) => (
                <option key={regionalMetric.id} value={regionalMetric.id}>{regionalMetric.label[lang]}</option>
              ))}
            </select>
          </label>
          <Legend
            unit={REGIONAL_METRICS.find((regionalMetric) => regionalMetric.id === regionalMetricId)?.unit[lang] ?? ''}
            hint={t.hintCurrent}
            scale={regionalScale}
            formatTick={(value) => {
              const active = REGIONAL_METRICS.find((regionalMetric) => regionalMetric.id === regionalMetricId) ?? REGIONAL_METRICS[0];
              return formatRegionalValue(value, active, lang, true);
            }}
          />
          {regionalIndex.countries[regionalIso].matched < regionalIndex.countries[regionalIso].regions && (
            <p className="regional-controls__hint">
              {fmt(t.regionalCoverage, {
                matched: regionalIndex.countries[regionalIso].matched,
                total: regionalIndex.countries[regionalIso].regions,
              })}
            </p>
          )}
        </header>
      )}

      {!regionalIso && hover && metric && (
        <Tooltip
          x={hover.x}
          y={hover.y}
          name={hover.name}
          metricLabel={`${viewMode === 'change' ? 'Δ ' : ''}${metricShortLabel(metric, lang)}`}
          value={typeof hoverValue === 'number' ? formatValue(hoverValue) : t.noData}
        />
      )}

      {regionalIso && regionHover && (
        <Tooltip
          x={regionHover.x}
          y={regionHover.y}
          name={regionHover.name}
          metricLabel={`${(REGIONAL_METRICS.find((regionalMetric) => regionalMetric.id === regionalMetricId) ?? REGIONAL_METRICS[0]).shortLabel[lang]}${regionHover.year ? ` · ${regionHover.year}` : ''}`}
          value={regionHover.value == null
            ? t.noData
            : formatRegionalValue(
                regionHover.value,
                REGIONAL_METRICS.find((regionalMetric) => regionalMetric.id === regionalMetricId) ?? REGIONAL_METRICS[0],
                lang,
                true,
              )}
        />
      )}

      {!regionalIso && selectedIso && snapshot && metric && (
        <CountryPanel
          country={byIso.get(selectedIso) ?? null}
          metrics={snapshot.metrics}
          activeMetricId={metricId}
          onClose={closeCountryPanel}
          onAddCompare={addCompare}
          inCompare={compare.includes(selectedIso)}
          compareFull={compare.length >= MAX_COMPARE}
          trade={tradeSummary}
          onPickPartner={flyTo}
          activeMetric={metric}
          history={timeseries?.data[selectedIso]?.[metricId] ?? null}
          products={products?.data[selectedIso] ?? null}
          productNames={lang === 'de' ? (products?.names ?? {}) : (products?.namesEn ?? products?.names ?? {})}
          regionalDataLoaded={regionalIndex !== null}
          regionalRegionCount={regionalIndex?.countries[selectedIso]?.regions}
          onExploreRegions={openRegionalForSelected}
        />
      )}

      {regionalIso && regionalIndex?.countries[regionalIso] && (
        <RegionalPanel
          countryName={byIso.get(regionalIso)?.name ?? regionalIso}
          regionName={selectedRegion?.name ?? null}
          region={selectedRegion?.regionId ? regionsById.get(selectedRegion.regionId) : undefined}
          coverage={regionalIndex.countries[regionalIso]}
          activeMetricId={regionalMetricId}
          onClose={() => setSelectedRegion(null)}
        />
      )}

      {!regionalIso && <CompareBar
        countries={compareCountries}
        onRemove={removeCompare}
        onClear={() => setCompare([])}
        onOpen={() => setCompareOpen(true)}
      />}

      {compareOpen && snapshot && compareCountries.length >= 2 && (
        <CompareTable
          countries={compareCountries}
          metrics={snapshot.metrics}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}
