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
import { useMetricHistories } from './data/useMetricHistories';
import { bboxOf, mergeBBox, largestPolygonCentroid, type BBox } from './lib/geo';
import { displayDomain, fmt, metricDescription, metricShortLabel, metricUnit, useLang } from './i18n';
import type { CountryData } from './types';
import {
  REGIONAL_METRICS,
  formatRegionalValue,
  latestRegionalValue,
  type RegionalMetricId,
  type RegionRecord,
} from './data/regions';
import { MarketBar } from './ui/MarketBar';
import { ChokepointModal } from './ui/ChokepointModal';
import { SUBMARINE_CABLES, CHOKEPOINTS, type MaritimeChokepoint } from './data/maritime';
import { MAJOR_MARKETS } from './data/markets';
import { ALLIANCES, allianceColors, countryAlliances } from './data/alliances';
import { AlliancePicker } from './ui/AlliancePicker';
import { Section } from './ui/Section';

import { regionalWebcamCountry, type Webcam } from './data/webcams';
import { WebcamControls } from './ui/WebcamControls';
import { WebcamModal } from './ui/WebcamModal';
import newsSeed from './data/news-snapshot.json';
import { cleanArticles, countryMatcher, newsHotspots, type NewsSnapshot, type NewsTopic, type NewsGeography } from './data/news';
import { NewsControls } from './ui/NewsControls';
import bondsSeed from './data/bonds-snapshot.json';
import { withSpanishNames } from './data/countryNames';
import { DownloadCsv } from './ui/DownloadCsv';
import { Landing } from './ui/Landing';
import { Logo } from './ui/Logo';
import { VerificationPage } from './ui/VerificationPage';
import { VERIFICATION, verificationDate } from './data/verification';
import { MAP_THEME } from './theme';
import './ui/landing.css';
import { SECTIONS, SECTION_BY_ID, isSectionId, sectionForLink, shows, type SectionId } from './sections';
import { tenorLabelEs } from './data/metricsEs';
import { BOND_TENORS, availableBondCountries, bondMetricId, bondSnapshotTime, bondMonths, isBondMetric, withBondMetrics, type BondSnapshot } from './data/bonds';

const BONDS = bondsSeed as BondSnapshot;
/** Sections without a metric legend (country explorer, news) draw countries neutral. */
const NEUTRAL_FILL = MAP_THEME.neutral;
/** "Vista mundial": the whole inhabited world. */
const WORLD_VIEW: BBox = [-170, -56, 180, 78];
const BOND_AS_OF = bondSnapshotTime(BONDS);

const MAX_COMPARE = 4;
const CHANGE_PERIODS = [2004, 2014]; // baked into the geojson for fast development-mode coloring

type ViewMode = 'current' | 'change';

/** Read shareable state from the URL hash. */
function readHash() {
  if (typeof location === 'undefined') return { s: null as string | null, m: null as string | null, c: null as string | null, t: false, v: null as string | null, fy: null as string | null, r: false, rm: null as string | null, a: null as string | null, dn: false };
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  return { s: p.get('s'), m: p.get('m'), c: p.get('c'), t: p.get('t') === '1', v: p.get('v'), fy: p.get('fy'), r: p.get('r') === '1', rm: p.get('rm'), a: p.get('a'), dn: p.get('dn') === '1' };
}

export default function App() {
  const { lang, t } = useLang();
  const initial = useMemo(() => readHash(), []);
  // null = landing page. A shared link opens its section directly (old links are mapped).
  const [sectionId, setSectionId] = useState<SectionId | null>(() => isSectionId(initial.s)
    ? initial.s
    : initial.m || initial.c
      ? sectionForLink(initial.m, initial.t, (id) => displayDomain({ id, domain: 'economy' }) === 'finance')
      : null);
  const section = SECTION_BY_ID.get(sectionId ?? 'riesgo')!;
  // The "how we verify" page sits over everything; #p=verificacion makes it linkable.
  const [showVerification, setShowVerification] = useState(() =>
    typeof location !== 'undefined' && new URLSearchParams(location.hash.slice(1)).get('p') === 'verificacion');
  const [metricId, setMetricId] = useState(initial.m || section.defaultMetric);
  const [selectedIso, setSelectedIso] = useState<string | null>(initial.c);
  const [requestedRegionalIso, setRegionalIso] = useState<string | null>(initial.r ? initial.c : null);
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
  const [tradeMode, setTradeMode] = useState(initial.t || section.layers.trade);
  const [requestedViewMode, setViewMode] = useState<ViewMode>(initial.v === 'change' && !isBondMetric(initial.m ?? '') ? 'change' : 'current');
  const [changeFromYear, setChangeFromYear] = useState(initial.fy === '2014' ? 2014 : 2004);
  const [showDayNight, setShowDayNight] = useState(initial.dn || section.layers.dayNight);
  const [selectedAlliances, setSelectedAlliances] = useState<string[]>(() =>
    ALLIANCES.filter((alliance) => initial.a?.split(',').includes(alliance.id)).map((alliance) => alliance.id),
  );
  const allianceFill = useMemo(() => allianceColors(selectedAlliances), [selectedAlliances]);
  const allianceMembers = useMemo(() => selectedAlliances.length
    ? new Set(ALLIANCES.filter((a) => selectedAlliances.includes(a.id)).flatMap((a) => a.members))
    : null, [selectedAlliances]);
  const [showWebcams, setShowWebcams] = useState(section.layers.webcams);
  const [showNews, setShowNews] = useState(section.layers.news);
  const [newsSnapshot, setNewsSnapshot] = useState<NewsSnapshot>(newsSeed as NewsSnapshot);
  const [newsHours, setNewsHours] = useState(72);
  const [selectedNewsIso, setSelectedNewsIso] = useState<string | null>(null);
  const [newsNow, setNewsNow] = useState(() => Date.now());
  const [newsImported, setNewsImported] = useState(false);
  const [newsTopic, setNewsTopic] = useState<NewsTopic | 'all'>('all');
  const [newsSources, setNewsSources] = useState<string[]>([]);
  const [newsGeography, setNewsGeography] = useState<NewsGeography>('mentioned');
  const [newsOffset, setNewsOffset] = useState(0);
  /** True once /api/news-feed answered (dev middleware or the Vercel function). */
  const [newsLive, setNewsLive] = useState(false);
  useEffect(() => {
    // Live RSS via /api/news-feed; offline or on file:// the bundled snapshot stays.
    if (!showNews || newsImported || location.protocol === 'file:') return;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch('/api/news-feed', { signal: controller.signal });
        if (!response.ok) throw new Error('RSS unavailable');
        const data = await response.json() as NewsSnapshot;
        if (!Array.isArray(data.articles)) throw new Error('Invalid feed');
        const articles = cleanArticles(data.articles);
        if (controller.signal.aborted) return;
        setNewsSnapshot({ ...data, articles });
        setNewsLive(true);
        setNewsNow(Date.now());
      } catch {
        if (!controller.signal.aborted) setNewsSnapshot(current => ({ ...current, warnings: ['No se pudo actualizar RSS; se conserva la última carga.'] }));
      }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 15 * 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [showNews, newsImported]);
  useEffect(() => {
    if (!showNews) return;
    const timer = window.setInterval(() => setNewsNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [showNews]);
  const [selectedWebcam, setSelectedWebcam] = useState<Webcam | null>(null);
  const [selectedWebcamCluster, setSelectedWebcamCluster] = useState<Webcam[] | null>(null);
  const toggleWebcams = () => {
    setShowWebcams((value) => !value);
    setSelectedWebcam(null);
    setSelectedWebcamCluster(null);
  };
  const openWebcam = useCallback((camera: Webcam) => {
    setHover(null);
    setRegionHover(null);
    setSelectedWebcam(camera);
  }, [setSelectedWebcam]);
  const openWebcamFromMapOrCatalog = useCallback((camera: Webcam) => {
    setSelectedWebcamCluster(null);
    openWebcam(camera);
  }, [openWebcam]);
  const openWebcamCluster = useCallback((cameras: Webcam[]) => {
    setSelectedWebcam(null);
    setSelectedWebcamCluster(cameras);
  }, [setSelectedWebcam]);
  const clearWebcamCluster = useCallback(() => setSelectedWebcamCluster(null), []);
  const [showCables, setShowCables] = useState(section.layers.cables);
  const [showChokepoints, setShowChokepoints] = useState(section.layers.chokepoints);
  const [showMaritimeRoutes, setShowMaritimeRoutes] = useState(section.layers.routes);
  const [showMarkets, setShowMarkets] = useState(section.layers.markets);
  const [selectedChokepoint, setSelectedChokepoint] = useState<MaritimeChokepoint | null>(null);
  const closeChokepoint = useCallback(() => setSelectedChokepoint(null), [setSelectedChokepoint]);
  const toggleMaritimeRoutes = useCallback(() => setShowMaritimeRoutes(value => !value), []);

  const flyToCoord = useCallback((coord: [number, number]) => {
    const delta = 1.6;
    setFocusBbox([coord[0] - delta, coord[1] - delta, coord[0] + delta, coord[1] + delta]);
    setFocusNonce((n) => n + 1);
  }, []);
  const {
    snapshot: rawSnapshot,
    geojson,
    trade,
    timeseriesIndex,
    products,
    regionalIndex,
    regionalGeometry,
    regionalCountryData,
    error,
  } = useWorldData(requestedRegionalIso);
  const snapshot = useMemo(() => rawSnapshot ? withSpanishNames(withBondMetrics(rawSnapshot, BONDS)) : null, [rawSnapshot]);
  const curveCountries = useMemo(() => availableBondCountries(snapshot?.countries ?? [], BONDS), [snapshot]);
  const selectMetric = useCallback((id: string) => {
    setMetricId(id);
    if (isBondMetric(id)) setViewMode('current');
  }, []);
  const selectBondMaturity = useCallback((months: number) => selectMetric(bondMetricId(months)), [selectMetric]);
  const panelMetrics = useMemo(() => snapshot?.metrics.filter(m => !isBondMetric(m.id)
    || m.id === (isBondMetric(metricId) ? metricId : bondMetricId(120))) ?? [], [snapshot, metricId]);
  const regionalIso = requestedRegionalIso && (!regionalIndex || regionalIndex.countries[requestedRegionalIso])
    ? requestedRegionalIso : null;

  // Keep the URL hash in sync so the current view is shareable.
  useEffect(() => {
    if (showVerification) {
      if (location.hash !== '#p=verificacion') history.replaceState(null, '', '#p=verificacion');
      return;
    }
    if (!sectionId) {
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      return;
    }
    const p = new URLSearchParams();
    p.set('s', sectionId);
    p.set('m', metricId);
    if (selectedAlliances.length) p.set('a', selectedAlliances.join(','));
    if (showDayNight) p.set('dn', '1');
    if (selectedIso) p.set('c', selectedIso);
    if (regionalIso) p.set('r', '1');
    if (regionalMetricId !== 'gdpPerCapitaUsd2015') p.set('rm', regionalMetricId);
    if (tradeMode) p.set('t', '1');
    if (requestedViewMode === 'change') {
      p.set('v', 'change');
      p.set('fy', String(changeFromYear));
    }
    const hash = `#${p.toString()}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }, [showVerification, sectionId, metricId, selectedIso, regionalIso, regionalMetricId, tradeMode, requestedViewMode, changeFromYear, selectedAlliances, showDayNight]);

  const byIso = useMemo(() => {
    const map = new Map<string, CountryData>();
    snapshot?.countries.forEach((c) => map.set(c.iso3, c));
    return map;
  }, [snapshot]);

  const metric = useMemo(() => snapshot?.metrics.find((m) => m.id === metricId), [snapshot, metricId]);

  // Yearly history is loaded per metric, on demand. The "Trend" view only exists for
  // metrics that have a history file.
  const histories = useMetricHistories(metric?.id, timeseriesIndex);
  const hasHistory = !!metric && !!timeseriesIndex?.metrics.includes(metric.id);
  const viewMode: ViewMode = hasHistory && shows(section, 'trend') ? requestedViewMode : 'current';

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

  const matchNewsCountry = useMemo(() => countryMatcher(snapshot?.countries ?? []), [snapshot]);
  const newsReference = newsNow - newsOffset * 3_600_000;
  const newsActivity = useMemo(() => newsHotspots(newsSnapshot.articles, matchNewsCountry, snapshot?.countries ?? [], centroids, newsHours, newsReference,
    { topic: newsTopic, sources: newsSources, baselineSources: newsSnapshot.sources?.map(source => source.id), geography: newsGeography, observations: newsSnapshot.observations }),
    [newsSnapshot, matchNewsCountry, snapshot, centroids, newsHours, newsReference, newsTopic, newsSources, newsGeography]);
  const selectNews = useCallback((id: string | null) => {
    setSelectedNewsIso(id);
    setHover(null);
    if (!id) return;
    const spot = newsActivity.hotspots.find(spot => spot.id === id);
    if (!spot) return;
    const [longitude, latitude] = spot.coordinates;
    const box = newsGeography === 'occurrence' && id.includes(':') && !id.endsWith(spot.iso3.toLowerCase())
      ? [longitude - 2, latitude - 2, longitude + 2, latitude + 2] as BBox : bboxes.get(spot.iso3);
    if (box) { setFocusBbox(box); setFocusNonce(value => value + 1); }
  }, [bboxes, newsActivity.hotspots, newsGeography]);

  // Bake raw values + change-over-period values into each feature once. Switching
  // metric / mode / period then only swaps the paint expression (no GeoJSON re-parse).
  const enriched = useMemo(() => {
    if (!snapshot || !geojson) return null;
    const fc = geojson as { features: Array<{ geometry: unknown; properties: Record<string, unknown> | null }> };
    const features = fc.features.map((f) => {
      const iso3 = f.properties?.iso3 as string | undefined;
      const country = iso3 ? byIso.get(iso3) : undefined;
      const props: Record<string, unknown> = { iso3, name: f.properties?.name };
      if (country) {
        for (const m of snapshot.metrics) {
          const raw = country.metrics[m.id]?.value;
          if (typeof raw === 'number') props[m.id] = raw;
          const hist = iso3 ? histories[m.id]?.[iso3] : undefined;
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
  }, [snapshot, geojson, byIso, histories]);

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
      const history = histories[metric.id];
      for (const c of snapshot.countries) {
        const ch = changeSince(history?.[c.iso3], changeFromYear, metric.format);
        if (ch != null) m.set(c.iso3, ch);
      }
    }
    return m;
  }, [viewMode, metric, changeFromYear, snapshot, histories]);

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

  // Trade arcs: selected-country exports and partner-reported imports, or top global export corridors.
  const arcs = useMemo<Arc[]>(() => {
    if (!tradeMode || !trade) return [];

    // Case 1: Specific country selected
    if (selectedIso) {
      const flow = trade.flows[selectedIso];
      const selectedPoint = centroid(selectedIso);
      if (!selectedPoint) return [];
      const selectedName = byIso.get(selectedIso)?.name ?? selectedIso;
      const out: Arc[] = [];

      if (flow) {
        const maxExport = Math.max(...flow.partners.map((p) => p.v), 1);
        for (const partner of flow.partners) {
          const target = centroid(partner.p);
          if (!target) continue;
          const partnerName = byIso.get(partner.p)?.name ?? partner.p;
          const share = flow.total ? (partner.v / flow.total) * 100 : 0;
          out.push({
            source: selectedPoint,
            target,
            width: 2 + 6 * (partner.v / maxExport),
            flowType: 'export',
            label: `${selectedName} → ${partnerName} (exportación): ${formatUsdCompact(partner.v, lang)}${share ? ` (${share.toFixed(1)} %)` : ''}`,
          });
        }
      }

      // IMF data contains reporter exports, not a separate import series. Treat another
      // country's reported exports to this country as a partner-reported import flow.
      const inbound = Object.entries(trade.flows)
        .flatMap(([reporter, reporterFlow]) => reporter === selectedIso
          ? []
          : reporterFlow.partners
            .filter((partner) => partner.p === selectedIso)
            .map((partner) => ({ reporter, value: partner.v })))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
      const maxImport = Math.max(...inbound.map((item) => item.value), 1);

      for (const item of inbound) {
        const source = centroid(item.reporter);
        if (!source) continue;
        const reporterName = byIso.get(item.reporter)?.name ?? item.reporter;
        out.push({
          source,
          target: selectedPoint,
          width: 2 + 6 * (item.value / maxImport),
          flowType: 'import',
          label: `${reporterName} → ${selectedName} (partner-reported import): ${formatUsdCompact(item.value, lang)}`,
        });
      }
      return out;
    }

    // Case 2: No country selected -> Show the Top 35 largest trade corridors on the planet
    const allPartners: Array<{ from: string; to: string; v: number }> = [];
    for (const [fromIso, flow] of Object.entries(trade.flows)) {
      for (const partner of flow.partners) {
        allPartners.push({ from: fromIso, to: partner.p, v: partner.v });
      }
    }
    allPartners.sort((a, b) => b.v - a.v);
    const topCorridors = allPartners.slice(0, 35);
    const maxGlobalV = topCorridors[0]?.v || 1;

    const globalArcs: Arc[] = [];
    for (const item of topCorridors) {
      const src = centroid(item.from);
      const tgt = centroid(item.to);
      if (!src || !tgt) continue;
      const fromName = byIso.get(item.from)?.name ?? item.from;
      const toName = byIso.get(item.to)?.name ?? item.to;
      globalArcs.push({
        source: src,
        target: tgt,
        width: 2 + 7 * (item.v / maxGlobalV),
        flowType: 'export',
        label: `Exportación global: ${fromName} → ${toName}: ${formatUsdCompact(item.v, lang)}`,
      });
    }
    return globalArcs;
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
        for (const metric of REGIONAL_METRICS) {
          const value = latestRegionalValue(regionId ? regionsById.get(regionId) : undefined, metric.id);
          if (value) {
            properties[metric.id] = value.value;
            properties[`${metric.id}Year`] = value.year;
          }
        }
        return { ...feature, properties };
      }),
    };
  }, [regionalGeometry, regionalCountryData, regionsById]);

  const regionalScale = useMemo(() => {
    const features = (enrichedRegional as { features: Array<{ properties: Record<string, unknown> }> } | null)?.features ?? [];
    const values = features
      .map((feature) => feature.properties[regionalMetricId])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    return buildColorScale(values, regionalMetricId);
  }, [enrichedRegional, regionalMetricId]);

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
    // The first map click selects the country and shows its national panel.
    // A second click on that same country opens its regional drill-down.
    if (iso3 && iso3 === selectedIso && (!regionalIndex || regionalIndex.countries[iso3])) {
      setRegionalIso(iso3);
      setSelectedRegion(null);
      setHover(null);
      setRegionHover(null);
      return;
    }

    setSelectedIso(iso3);
    setHover(null);
    setRegionHover(null);
    setSelectedRegion(null);
    setRegionalIso(null);
  }, [regionalIndex, selectedIso]);

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

  /** Open a section with its own metric and layers; nothing from the previous one lingers. */
  const enterSection = (id: SectionId | null) => {
    setSectionId(id);
    if (!id) return;
    const next = SECTION_BY_ID.get(id)!;
    setMetricId(next.defaultMetric);
    setViewMode(next.defaultView ?? 'current');
    setSelectedAlliances([]);
    setTradeMode(next.layers.trade);
    setShowChokepoints(next.layers.chokepoints);
    setShowMaritimeRoutes(next.layers.routes);
    setShowCables(next.layers.cables);
    setShowMarkets(next.layers.markets);
    setShowDayNight(next.layers.dayNight);
    setShowWebcams(next.layers.webcams);
    setShowNews(next.layers.news);
    setSelectedChokepoint(null);
    setSelectedWebcam(null);
    setSelectedIso(null);
    setRegionalIso(null);
    setSelectedRegion(null);
    if (next.view) {
      setFocusBbox(next.view);
      setFocusNonce((n) => n + 1);
    }
  };

  // Escape closes the topmost panel (comparison first), except while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest('input, select, textarea')) return;
      if (e.key === '/') {
        const search = document.querySelector<HTMLInputElement>('.topbar .search__input');
        if (search) { e.preventDefault(); search.focus(); }
        return;
      }
      if (e.key !== 'Escape') return;
      if (compareOpen) setCompareOpen(false);
      else closeCountryPanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compareOpen, closeCountryPanel]);

  const backToWorldMap = useCallback(() => {
    const iso3 = regionalIso;
    setRegionalIso(null);
    setSelectedRegion(null);
    setRegionHover(null);
    if (iso3) flyTo(iso3);
  }, [regionalIso, flyTo]);

  const landingStats = useMemo<Partial<Record<SectionId, string>>>(() => {
    if (!snapshot) return {};
    const count = (id: string) => snapshot.countries.filter((c) => c.metrics[id]).length;
    const indicators = snapshot.metrics.filter((m) => displayDomain(m) !== 'finance').length;
    return {
      riesgo: `${count('euro_spread_bund')} primas de riesgo · ${count('policy_rate')} bancos centrales`,
      economia: `${indicators} indicadores · historia 2004–2024`,
      comercio: `${CHOKEPOINTS.length} pasos marítimos · ${SUBMARINE_CABLES.length} cables`,
      mercados: `${MAJOR_MARKETS.length} bolsas en vivo`,
      pais: `${snapshot.countries.length} países y territorios`,
      actualidad: `${newsSnapshot.articles.length} titulares recientes`,
    };
  }, [snapshot, newsSnapshot]);
  const updated = snapshot?.generatedAt
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(snapshot.generatedAt))
    : undefined;
  const ready = enriched && scale && metric;
  const hoverValue = hover ? display.get(hover.iso3) : undefined;
  const rankingCountries = useMemo(() => allianceMembers
    ? snapshot?.countries.filter(country => allianceMembers.has(country.iso3)) ?? []
    : snapshot?.countries ?? [], [snapshot, allianceMembers]);
  const rankingValue = useCallback((country: CountryData) => display.get(country.iso3), [display]);

  return (
    <div className="app">
      <main className="map-root" aria-label="Mapa">
        {!regionalIso ? (
          ready ? (
            <WorldMap
              newsHotspots={showNews ? newsActivity.hotspots : undefined}
              selectedNewsIso={selectedNewsIso}
              onSelectNews={selectNews}
              data={enriched}
              fillColor={selectedAlliances.length ? allianceFill : shows(section, 'legend') ? scale.expression : NEUTRAL_FILL}
              showDayNight={showDayNight}
              selectedIso={selectedIso}
              focusBbox={focusBbox}
              focusNonce={focusNonce}
              arcs={arcs}
              onHover={setHover}
              onSelect={selectWorldCountry}
              showCables={showCables}
              showChokepoints={showChokepoints}
              selectedChokepoint={selectedChokepoint}
              showMaritimeRoutes={showMaritimeRoutes}
              showMarkets={showMarkets}
              cables={SUBMARINE_CABLES}
              chokepoints={CHOKEPOINTS}
              markets={MAJOR_MARKETS}
              showWebcams={showWebcams}
              onSelectWebcam={openWebcamFromMapOrCatalog}
              onSelectWebcamCluster={openWebcamCluster}
              onSelectChokepoint={setSelectedChokepoint}
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
            metricId={regionalMetricId}
            selectedShapeId={selectedRegion?.shapeId ?? null}
            focusBbox={regionalBbox}
            showWebcams={showWebcams && !!regionalWebcamCountry(regionalIso)}
            webcamCountry={regionalWebcamCountry(regionalIso)}
            onSelectWebcam={openWebcamFromMapOrCatalog}
            onSelectWebcamCluster={openWebcamCluster}
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
      </main>

      {sectionId && !regionalIso && (
        <nav className="topbar" aria-label="Navegación principal">
          <button type="button" className="topbar__brand" onClick={() => enterSection(null)} title="Volver a la portada">
            <Logo size={26} />
          </button>
          <div className="topbar__sections">
            {SECTIONS.filter((s) => !s.noTopBar || s.id === section.id).map((s) => (
              <button key={s.id} type="button" aria-current={s.id === section.id ? 'page' : undefined} onClick={() => enterSection(s.id)}>
                {s.title}
              </button>
            ))}
          </div>
          {snapshot && <div className="topbar__search" title="Atajo: tecla /">
            <SearchBox countries={snapshot.countries} onPick={flyTo} />
          </div>}
        </nav>
      )}

      {sectionId && !regionalIso && metric && scale && shows(section, 'legend') && selectedAlliances.length === 0 && (
        <div className="map-legend">
          <span className="map-legend__title">{metricShortLabel(metric, lang)}</span>
          <Legend
            unit={viewMode === 'current' ? metricUnit(metric, lang) : fmt(t.changeSince, { year: changeFromYear })}
            hint={viewMode === 'current' ? t.hintCurrent : t.hintChange}
            scale={scale}
            formatTick={(v) => (viewMode === 'current' ? formatCompact(v, metric, lang) : formatChange(v, metric, lang))}
          />
        </div>
      )}

      {sectionId && !regionalIso && (
        <button type="button" className="map-reset" onClick={() => { setFocusBbox(WORLD_VIEW); setFocusNonce((n) => n + 1); }}>
          Vista mundial
        </button>
      )}

      {!regionalIso && <header className="hud hud--top-left scroll-slim">
        <div className="section-head">
          <h1 className="section-head__title">{section.title}</h1>
          <p className="section-head__intro">{section.intro}</p>
          {section.id === 'riesgo' && (
            <button type="button" className={`verified-badge${VERIFICATION.issues ? ' verified-badge--warn' : ''}`} onClick={() => setShowVerification(true)}>
              <span aria-hidden="true">{VERIFICATION.issues ? '!' : '✓'}</span>
              <span>
                <b>{VERIFICATION.issues ? `${VERIFICATION.issues} datos por revisar` : 'Verificado contra BCE y Eurostat'}</b>
                <small>{verificationDate()} · cómo lo comprobamos →</small>
              </span>
            </button>
          )}
        </div>

        {snapshot && metric && scale && (
          <div className="controls">
            {section.id === 'pais' && <div className="section-search">
              <SearchBox countries={snapshot.countries} onPick={flyTo} />
            </div>}
            {shows(section, 'picker') && section.keyMetrics && (
              <div className="metric-chips" role="group" aria-label="Indicadores clave">
                {section.keyMetrics.map((id) => {
                  const m = snapshot.metrics.find((x) => x.id === id);
                  return m ? (
                    <button key={id} type="button" aria-pressed={metricId === id} onClick={() => selectMetric(id)}>
                      {metricShortLabel(m, lang)}
                    </button>
                  ) : null;
                })}
              </div>
            )}
            {section.themes && (() => {
              const active = Math.max(0, section.themes.findIndex((th) => th.metrics.includes(metricId)));
              return <>
                <div className="theme-tabs" role="tablist" aria-label="Temas">
                  {section.themes.map((th, i) => (
                    <button key={th.label} type="button" role="tab" aria-selected={i === active} onClick={() => selectMetric(th.metrics[0])}>{th.label}</button>
                  ))}
                </div>
                <div className="metric-chips" role="group" aria-label={section.themes[active].label}>
                  {section.themes[active].metrics.map((id) => {
                    const m = snapshot.metrics.find((x) => x.id === id);
                    return m ? (
                      <button key={id} type="button" aria-pressed={metricId === id} onClick={() => selectMetric(id)}>{metricShortLabel(m, lang)}</button>
                    ) : null;
                  })}
                </div>
              </>;
            })()}
            {shows(section, 'picker') && <div className="metric-more">
              <MetricPicker metrics={snapshot.metrics} domains={section.domains} value={metricId} onChange={selectMetric} label="Más indicadores" />
            </div>}
            {shows(section, 'picker') && isBondMetric(metricId) && <div className="bond-controls">
              <label className="field">
                <span>Plazo del bono</span>
                <select className="select" value={bondMonths(metricId)} onChange={e => selectBondMaturity(Number(e.target.value))}>
                  {BOND_TENORS.map(term => <option key={term.months} value={term.months}>{tenorLabelEs(term.months)}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Ver curvas de tipos · {curveCountries.length} países</span>
                <select className="select" value={curveCountries.some(country => country.iso3 === selectedIso) ? selectedIso! : ''}
                  onChange={e => { if (e.target.value) flyTo(e.target.value); }}>
                  <option value="">Elige un país con curva</option>
                  {curveCountries.map(country => <option key={country.iso3} value={country.iso3}>
                    {country.name} · {BONDS.countries[country.iso3].date}
                  </option>)}
                </select>
              </label>
              <p>{display.size} países con este plazo · moneda local · observaciones de los 180 días previos a la descarga</p>
              <p>Fuentes diarias y mensuales: compara fechas y métodos en la curva de cada país. Para comparar países usa la prima de riesgo frente al Bund.</p>
            </div>}
            {shows(section, 'legend') && <details className="metric-about">
              <summary>¿Qué mide «{metricShortLabel(metric, lang)}»?</summary>
              <p className="metric-desc">{metricDescription(metric, lang)}</p>
            </details>}
            {shows(section, 'download') && <DownloadCsv metric={metric} countries={snapshot.countries} history={histories[metric.id]} index={timeseriesIndex} />}

            {hasHistory && shows(section, 'trend') && (
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
            {viewMode === 'change' && !isBondMetric(metricId) && (
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

            {shows(section, 'alliances') && <Section
              title="Grupos geopolíticos"
              badge={selectedAlliances.length ? String(selectedAlliances.length) : undefined}
            >
              <AlliancePicker selected={selectedAlliances} onChange={setSelectedAlliances} />
            </Section>}


            <div className="layer-toggles">
              <div className="layer-toggles__grid">
                {shows(section, 'trade') && <>
                <button
                  type="button"
                  className={`btn toggle${tradeMode ? ' toggle--on' : ''}`}
                  onClick={() => setTradeMode((m) => !m)}
                  aria-pressed={tradeMode}
                  title="Flujos bilaterales de exportación"
                >
                  Flujos comerciales
                </button>
                {tradeMode && (
                  <div className="layer-toggles__detail">
                    <p className="hud__hint">
                      {selectedIso
                        ? arcs.length
                          ? t.arcsHintSelected
                          : t.arcsHintNone
                        : 'Se muestran los 35 mayores flujos de exportación declarados. Selecciona un país para comparar exportaciones e importaciones declaradas por sus socios.'}
                    </p>
                    <div className="hud__trade-legend" role="group" aria-label={t.tradeDirection}>
                      <span><i className="hud__trade-swatch hud__trade-swatch--export" aria-hidden="true" />{t.tradeExports}</span>
                      {selectedIso && (
                        <span><i className="hud__trade-swatch hud__trade-swatch--import" aria-hidden="true" />{t.tradeImports}</span>
                      )}
                    </div>
                  </div>
                )}
                </>}
                {shows(section, 'maritime') && <>
                <button
                  type="button"
                  className={`btn toggle${showChokepoints ? ' toggle--on' : ''}`}
                  onClick={() => { setShowChokepoints((v) => !v); setSelectedChokepoint(null); }}
                  aria-pressed={showChokepoints}
                  title="Puntos de estrangulamiento marítimo (Suez, Ormuz, Malaca, etc.)"
                >
                  Pasos marítimos
                </button>
                {showChokepoints && <button type="button" className="btn" onClick={() => setSelectedChokepoint(CHOKEPOINTS[0])}>Explorar pasos marítimos</button>}
                </>}
                {shows(section, 'cables') && <button
                  type="button"
                  className={`btn toggle cable-toggle${showCables ? ' toggle--on' : ''}`}
                  onClick={() => setShowCables((v) => !v)}
                  aria-pressed={showCables}
                  aria-controls="cable-network-legend"
                  title="Cables submarinos de telecomunicaciones intercontinentales"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 17C7 17 7 7 12 7s5 10 9 10"/><circle cx="3" cy="17" r="2"/><circle cx="21" cy="17" r="2"/></svg>
                  Cables submarinos
                </button>}
                {shows(section, 'markets') && <button
                  type="button"
                  className={`btn toggle${showMarkets ? ' toggle--on' : ''}`}
                  onClick={() => setShowMarkets((v) => !v)}
                  aria-pressed={showMarkets}
                  title="Centros financieros y bolsas de valores en vivo"
                >
                  Bolsas
                </button>}
                {shows(section, 'daynight') && <button type="button" className={`btn toggle daynight-toggle${showDayNight ? ' toggle--on' : ''}`}
                  aria-pressed={showDayNight} onClick={() => setShowDayNight((value) => !value)}>
                  <span aria-hidden="true">◐</span> Ciclo día/noche <span className="daynight-toggle__state">{showDayNight ? 'EN VIVO' : 'Activar'}</span>
                </button>}
              </div>
              {showDayNight && <p className="solar-hint">Sombra y crepúsculo según la hora UTC. Luces urbanas ilustrativas sobre ciudades de <a href="https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/" target="_blank" rel="noreferrer">Natural Earth</a> · cálculo <a href="https://gml.noaa.gov/grad/solcalc/solareqns.PDF" target="_blank" rel="noreferrer">NOAA</a>. Actualización cada 30 s.</p>}
              {shows(section, 'webcams') && <WebcamControls enabled={showWebcams} onToggle={toggleWebcams} onSelect={openWebcamFromMapOrCatalog}
                clusterCameras={selectedWebcamCluster} onSelectClusterCamera={openWebcam} onClearCluster={clearWebcamCluster} />}
              {shows(section, 'news') && <NewsControls enabled={showNews} onToggle={() => { setShowNews(value => !value); setNewsNow(Date.now()); }}
                snapshot={newsSnapshot} hotspots={newsActivity.hotspots} total={newsActivity.total} unmapped={newsActivity.unmapped}
                eventCount={newsActivity.eventCount} sourceCount={newsActivity.sourceCount} baselineReady={newsActivity.baselineReady}
                topic={newsTopic} onTopic={setNewsTopic} geography={newsGeography} onGeography={setNewsGeography}
                sources={newsSources} onSources={setNewsSources} offset={newsOffset} onOffset={setNewsOffset}
                hours={newsHours} onHours={setNewsHours} selected={selectedNewsIso} onSelect={selectNews}
                automatic={newsLive && !newsImported} now={newsNow}
                onImport={articles => { setNewsImported(true); setNewsSnapshot({ generatedAt: new Date().toISOString(), articles }); setNewsSources([]); setNewsOffset(0); setNewsNow(Date.now()); setSelectedNewsIso(null); }}
                onReset={() => { setNewsImported(false); setNewsSnapshot(newsSeed as NewsSnapshot); setNewsSources([]); setNewsOffset(0); setSelectedNewsIso(null); setNewsNow(Date.now()); }} />}
              {showCables && (
                <div className="cable-network" id="cable-network-legend">
                  <div className="cable-network__heading"><span className="cable-network__status" aria-hidden="true" />Red submarina<span className="cable-network__badge">Flujo animado</span></div>
                  <div className="cable-network__preview" aria-hidden="true"><span /><i /><i /></div>
                  <div className="cable-network__key"><span><b className="cable-network__line" />Cable</span><span><b className="cable-network__packet" />Pulso de datos</span><span><b className="cable-network__node" />Conexión</span></div>
                  <p>Rutas esquemáticas · movimiento ilustrativo, sin datos de tráfico en tiempo real.</p>
                </div>
              )}
            </div>

            {shows(section, 'ranking') && <RankingList
              countries={rankingCountries}
              getValue={rankingValue}
              format={formatValue}
              ascending={viewMode === 'current' ? metric.higherIsBetter === false : false}
              label={selectedAlliances.length ? 'Indicador · grupos seleccionados' : viewMode === 'current' ? t.ranking : t.biggestChange}
              selectedIso={selectedIso}
              onPick={flyTo}
            />}
          </div>
        )}
      </header>}

      {regionalIso && regionalIndex?.countries[regionalIso] && (
        <header className="hud hud--top-left regional-controls scroll-slim">
          <button className="btn" onClick={backToWorldMap}>{t.regionalBack}</button>
          {regionalWebcamCountry(regionalIso) && <WebcamControls country={regionalWebcamCountry(regionalIso)} enabled={showWebcams} onToggle={toggleWebcams} onSelect={openWebcamFromMapOrCatalog}
            clusterCameras={selectedWebcamCluster} onSelectClusterCamera={openWebcam} onClearCluster={clearWebcamCluster} />}
          <h2 className="regional-controls__title">{byIso.get(regionalIso)?.name ?? regionalIso}</h2>
          <p className="regional-controls__country">{t.regionalHint}</p>
          <label className="field">
            <span>{t.regionalMetricPicker}</span>
            <select
              className="select"
              value={regionalMetricId}
              onChange={(event) => { setRegionalMetricId(event.target.value as RegionalMetricId); setRegionHover(null); }}
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
          detail={isBondMetric(metricId) ? byIso.get(hover.iso3)?.metrics[metricId]?.period : undefined}
          x={hover.x}
          y={hover.y}
          name={selectedAlliances.length ? `${hover.name} · ${countryAlliances(hover.iso3).map((a) => a.name).join(' / ') || 'Sin grupo'}` : hover.name}
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
          bondCurve={BONDS.countries[selectedIso]}
          bondAsOf={BOND_AS_OF}
          bondMaturity={bondMonths(metricId)}
          onPickBondMaturity={selectBondMaturity}
          country={byIso.get(selectedIso) ?? null}
          metrics={panelMetrics}
          activeMetricId={metricId}
          onClose={closeCountryPanel}
          onAddCompare={addCompare}
          inCompare={compare.includes(selectedIso)}
          compareFull={compare.length >= MAX_COMPARE}
          trade={tradeSummary}
          onPickPartner={flyTo}
          activeMetric={metric}
          history={histories[metricId]?.[selectedIso] ?? null}
          products={products?.data[selectedIso] ?? null}
          productNames={products?.namesEn ?? products?.names ?? {}}
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

      {/* Ticker superior de bolsas mundiales en tiempo real */}
      {sectionId && shows(section, 'ticker') && <MarketBar onFlyToCoord={flyToCoord} />}

      {showWebcams && selectedWebcam && (!regionalIso || regionalWebcamCountry(regionalIso) === selectedWebcam.country) && <WebcamModal key={selectedWebcam.id} camera={selectedWebcam} onClose={() => setSelectedWebcam(null)} />}

      {/* Modal flotante al inspeccionar un chokepoint marítimo */}
      {selectedChokepoint && showChokepoints && !regionalIso && <ChokepointModal
        chokepoint={selectedChokepoint}
        onClose={closeChokepoint}
        onSelect={setSelectedChokepoint}
        showRoutes={showMaritimeRoutes}
        onToggleRoutes={toggleMaritimeRoutes}
      />}

      {!sectionId && <Landing countries={geojson} stats={landingStats} updated={updated} onPick={enterSection} onVerify={() => setShowVerification(true)} />}
      {showVerification && <VerificationPage onClose={() => setShowVerification(false)} onOpenMap={() => { setShowVerification(false); enterSection('mapa'); }} />}
    </div>
  );
}
