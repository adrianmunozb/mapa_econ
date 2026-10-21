import { WebcamMarkers } from './WebcamMarkers';
import { NewsMarkers } from './NewsMarkers';
import type { NewsHotspot } from '../data/news';
import type { Webcam } from '../data/webcams';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapGL, Source, Layer, useControl } from '@vis.gl/react-maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArcLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StyleSpecification } from 'maplibre-gl';
import type { BBox } from '../lib/geo';
import { useLang } from '../i18n';
import type { MaritimeChokepoint, SubmarineCable } from '../data/maritime';
import { chokepointColor, type MaritimeRoute } from '../data/chokepoints';
import { prepareCable } from './cableFlow';
import { cableRenderRoutes } from './cableGeometry';
import { CableLayer } from './CableLayer';
import type { StockMarket } from '../data/markets';
import { getMarketStatus } from '../data/markets';
import { SolarCycle } from './SolarCycle';
import { SmoothFill } from './SmoothFill';
import { frameCoalescer } from './interaction';

// The map instance + event shapes we actually use. Kept local so we don't depend
// on the exact type-export surface of the wrapper/maplibre-gl across versions.
export interface MapInstance {
  setFeatureState: (target: { source: string; id: string }, state: Record<string, unknown>) => void;
  getCanvas: () => HTMLCanvasElement;
  fitBounds: (bounds: [[number, number], [number, number]], opts?: Record<string, unknown>) => void;
  flyTo?: (opts: { center: [number, number]; zoom?: number; duration?: number }) => void;
}
interface MapEvt {
  target: MapInstance;
  point: { x: number; y: number };
  features?: Array<{ properties: Record<string, unknown> | null }>;
}

export interface HoverInfo {
  iso3: string;
  name: string;
  x: number;
  y: number;
}

/** A trade arc: from reporter centroid to a partner centroid. */
export interface Arc {
  source: [number, number];
  target: [number, number];
  width: number;
  flowType: 'export' | 'import';
  label: string;
}

interface Props {
  newsHotspots?: NewsHotspot[];
  selectedNewsIso?: string | null;
  onSelectNews?: (iso: string) => void;
  webcamCountry?: Webcam['country'];
  showWebcams?: boolean;
  onSelectWebcam?: (camera: Webcam) => void;
  onSelectWebcamCluster?: (cameras: Webcam[]) => void;
  data: unknown; // enriched FeatureCollection (metric values on each feature)
  fillColor: unknown; // MapLibre fill-color expression
  selectedIso: string | null;
  focusBbox: BBox | null;
  focusNonce: number; // bump to re-trigger fly-to even for the same bbox
  arcs: Arc[];
  onHover: (info: HoverInfo | null) => void;
  onSelect: (iso3: string | null) => void;
  showDayNight?: boolean;
  showCables?: boolean;
  showChokepoints?: boolean;
  selectedChokepoint?: MaritimeChokepoint | null;
  showMaritimeRoutes?: boolean;
  showMarkets?: boolean;
  cables?: SubmarineCable[];
  chokepoints?: MaritimeChokepoint[];
  markets?: StockMarket[];
  onSelectChokepoint?: (chokepoint: MaritimeChokepoint | null) => void;
}

// CARTO dark-matter: tokenless vector style, dark ocean — ideal under a glowing choropleth.
const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Offline fallback: a minimal dark style with no external resources, so the
// single-file build keeps working from file:// without any network access.
const OFFLINE_STYLE: StyleSpecification = {
  version: 8,
  name: 'World Economic Map (offline)',
  sources: {},
  layers: [
    { id: 'wem-bg', type: 'background', paint: { 'background-color': '#0d1117' } },
  ],
};

/** deck.gl overlay (added as a MapLibre control) that draws arcs, cables, chokepoints and markets. */
const DeckOverlay = memo(function DeckOverlay({
  arcs,
  showCables,
  showChokepoints,
  selectedChokepoint,
  showMaritimeRoutes,
  showMarkets,
  cables = [],
  chokepoints = [],
  markets = [],
  onSelectChokepoint,
}: {
  arcs: Arc[];
  showCables?: boolean;
  showChokepoints?: boolean;
  selectedChokepoint?: MaritimeChokepoint | null;
  showMaritimeRoutes?: boolean;
  showMarkets?: boolean;
  cables?: SubmarineCable[];
  chokepoints?: MaritimeChokepoint[];
  markets?: StockMarket[];
  onSelectChokepoint?: (chokepoint: MaritimeChokepoint | null) => void;
}) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: false, layers: [] }));
  const animationTime = useRef(0);
  const routes = useMemo(() => cableRenderRoutes(cables.filter((c) => c.points.length > 1).map(prepareCable)), [cables]);
  const landings = useMemo(() => {
    const unique = new Map<string, [number, number]>();
    for (const cable of cables) {
      for (const point of [cable.points[0], cable.points[cable.points.length - 1]]) {
        // Split Pacific routes end at the dateline, not at a landing station.
        if (point && Math.abs(point[0]) < 179) unique.set(point.join(','), point);
      }
    }
    return [...unique.values()];
  }, [cables]);
  const layers = useMemo(() => {
    const layers: unknown[] = [];

    // Thin constant-pixel cores remain legible at every zoom; wide translucent halos add depth.
    if (showCables && routes.length > 0) {
      layers.push(
        new CableLayer({
          id: 'submarine-cables', data: routes, getPath: (d) => d.path,
          positionFormat: 'XY', _pathType: 'open', time: 0, animate: false,
          getColor: [255, 255, 255, 255], getWidth: 7, widthUnits: 'pixels',
          capRounded: true, jointRounded: true,
          pickable: true, autoHighlight: true, highlightColor: [224, 255, 255, 255],
        }),
        new ScatterplotLayer({
          id: 'cable-landings', data: landings, getPosition: (d) => d,
          radiusUnits: 'pixels', getRadius: 3, getFillColor: [215, 255, 255, 255],
          stroked: true, getLineColor: [34, 211, 238, 100], lineWidthUnits: 'pixels',
          getLineWidth: 3, pickable: false, wrapLongitude: true,
        }),
      );
    }

    // Structural importance colors; no implied live geopolitical rating.
    if (showChokepoints && chokepoints.length > 0) {
      if (showMaritimeRoutes && selectedChokepoint) {
        layers.push(new PathLayer<MaritimeRoute>({
          id: 'maritime-corridors', data: selectedChokepoint.routes,
          getPath: (route) => route.points,
          getColor: (route) => route.kind === 'principal' ? [94, 234, 212, 230] : [192, 132, 252, 210],
          getWidth: (route) => route.kind === 'principal' ? 3 : 2,
          widthUnits: 'pixels', capRounded: true, jointRounded: true,
          pickable: true, autoHighlight: true, wrapLongitude: true,
        }));
      }
      layers.push(
        new ScatterplotLayer<MaritimeChokepoint>({
          id: 'chokepoints-halo', data: chokepoints, getPosition: (d) => d.coordinates,
          radiusUnits: 'pixels', getRadius: (d) => d.id === selectedChokepoint?.id ? 19 : 12,
          getFillColor: (d) => [...chokepointColor(d), 45],
          stroked: true, getLineColor: (d) => [...chokepointColor(d), 150],
          getLineWidth: 1, lineWidthUnits: 'pixels', pickable: false,
          updateTriggers: { getRadius: selectedChokepoint?.id },
        }),
        new ScatterplotLayer<MaritimeChokepoint>({
          id: 'chokepoints-core', data: chokepoints, getPosition: (d) => d.coordinates,
          radiusUnits: 'pixels', getRadius: (d) => d.importance === 'Muy alta' ? 7 : 5,
          getFillColor: (d) => [...chokepointColor(d), 240],
          stroked: true, getLineColor: [255, 255, 255, 255],
          getLineWidth: 1.5, lineWidthUnits: 'pixels', pickable: true,
          onClick: (info) => { if (info.object) onSelectChokepoint?.(info.object); },
        }),
      );
    }

    // 3. Bolsas mundiales (Centros bursátiles)
    if (showMarkets && markets.length > 0) {
      layers.push(
        new ScatterplotLayer<StockMarket>({
          id: 'market-points',
          data: markets,
          getPosition: (d) => d.coordinates,
          getRadius: 80000,
          radiusMinPixels: 6,
          radiusMaxPixels: 12,
          getFillColor: (d) => {
            const st = getMarketStatus(d);
            return st.isOpen ? [34, 197, 94, 235] : [148, 163, 184, 180];
          },
          stroked: true,
          getLineColor: [255, 255, 255, 220],
          getLineWidth: 2,
          lineWidthMinPixels: 1.5,
          pickable: true,
        }),
      );
    }

    // 4. Arcos comerciales existentes
    if (arcs.length > 0) {
      layers.push(
        new ArcLayer<Arc>({
          id: 'trade-arcs',
          data: arcs,
          getSourcePosition: (d) => d.source,
          getTargetPosition: (d) => d.target,
          getSourceColor: (d) => d.flowType === 'import'
            ? [192, 132, 252, 245] as [number, number, number, number]
            : [255, 209, 102, 245] as [number, number, number, number],
          getTargetColor: (d) => d.flowType === 'import'
            ? [129, 140, 248, 225] as [number, number, number, number]
            : [251, 146, 60, 225] as [number, number, number, number],
          getWidth: (d) => d.width,
          widthUnits: 'pixels',
          widthMinPixels: 2.5,
          widthMaxPixels: 10,
          getHeight: 0.6,
          // Reciprocal flows bend to opposite sides instead of hiding one another.
          getTilt: 20,
          greatCircle: true,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 255],
        }),
      );
    }

    return layers;
  }, [arcs, showCables, showChokepoints, selectedChokepoint, showMaritimeRoutes, showMarkets, routes, landings, chokepoints, markets, onSelectChokepoint]);

  useEffect(() => {
    const control = overlay as unknown as { setProps: (p: Record<string, unknown>) => void };
    control.setProps({
      layers,
      getTooltip: (info: { object?: unknown; layer?: { id: string } }) => {
        if (!info.object || !info.layer) return null;
        if (info.layer.id === 'trade-arcs') {
          return { text: (info.object as Arc).label };
        }
        if (info.layer.id === 'submarine-cables') {
          const c = info.object as SubmarineCable;
          return {
            text: `${c.name}\n${c.lengthKm.toLocaleString()} km · ${c.owners}\nRuta esquemática · flujo ilustrativo`,
            style: { background: '#0b202b', color: '#e0fcff', border: '1px solid #226071', borderRadius: '12px', padding: '12px 16px', fontSize: '12px', maxWidth: '320px' },
          };
        }
        if (info.layer.id === 'maritime-corridors') {
          const route = info.object as MaritimeRoute;
          return { text: `${route.name}\n${route.kind} · corredor esquemático, no trayectoria AIS` };
        }
        if (info.layer.id === 'chokepoints-core') {
          const cp = info.object as MaritimeChokepoint;
          return { text: `⚓ ${cp.name} (${cp.location})\n${cp.kind} · importancia ${cp.importance.toLowerCase()}\nEstado operativo sin verificar\n(Click para ver detalles)` };
        }
        if (info.layer.id === 'market-points') {
          const m = info.object as StockMarket;
          const st = getMarketStatus(m);
          return { text: `${m.flag} ${m.name}\nÍndice: ${m.indexName}\nHora local: ${st.localTimeStr}\nEstado: ${st.isOpen ? '🟢 ABIERTO' : '🔴 ' + st.statusText}` };
        }
        return null;
      },
    });

    if (!showCables || !routes.length) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastDraw = -Infinity;
    let elapsed = animationTime.current;
    let previous: number | null = null;
    const draw = (now: number) => {
      if (!document.hidden && !motion.matches) {
        if (previous !== null) elapsed += Math.min(now - previous, 100);
        animationTime.current = elapsed;
        if (now - lastDraw >= 1000 / 30) {
          control.setProps({ layers: layers.map(layer => layer instanceof CableLayer
            ? layer.clone({ time: elapsed / 1000, animate: true }) : layer) });
          lastDraw = now;
        }
      }
      previous = now;
      frame = requestAnimationFrame(draw);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      previous = null;
      if (!document.hidden && !motion.matches) draw(performance.now());
      else control.setProps({ layers });
    };
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
    };
  }, [overlay, layers, routes, showCables]);
  return null;
});

export const WorldMap = memo(function WorldMap({
  newsHotspots,
  selectedNewsIso = null,
  onSelectNews,
  webcamCountry,
  showWebcams = false,
  onSelectWebcam,
  onSelectWebcamCluster,
  data,
  fillColor,
  selectedIso,
  focusBbox,
  focusNonce,
  arcs,
  onHover,
  onSelect,
  showDayNight = false,
  showCables = false,
  showChokepoints = false,
  selectedChokepoint,
  showMaritimeRoutes = true,
  showMarkets = false,
  cables,
  chokepoints,
  markets,
  onSelectChokepoint,
}: Props) {
  const hoveredRef = useRef<string | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const offlineChecked = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { t } = useLang();
  const hoverQueue = useMemo(() => frameCoalescer(onHover, requestAnimationFrame, cancelAnimationFrame), [onHover]);
  useEffect(() => () => hoverQueue.cancel(), [hoverQueue]);
  const [style, setStyle] = useState<string | StyleSpecification>(() =>
    typeof navigator !== 'undefined' && navigator.onLine === false ? OFFLINE_STYLE : BASEMAP,
  );

  // Keep the selected corridor in the part of the map left visible by the explorer.
  useEffect(() => {
    if (!selectedChokepoint || !showChokepoints || !mapRef.current) return;
    const points = showMaritimeRoutes
      ? selectedChokepoint.routes.flatMap((route) => route.points)
      : [selectedChokepoint.coordinates];
    const lons = points.map((point) => point[0]);
    const lats = points.map((point) => point[1]);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width < 760;
    mapRef.current.fitBounds([
      [Math.min(...lons) - 2, Math.min(...lats) - 2],
      [Math.max(...lons) + 2, Math.max(...lats) + 2],
    ], {
      padding: { left: mobile ? 20 : Math.min(350, width * 0.28), right: mobile ? 20 : Math.min(480, width * 0.38), top: 70, bottom: mobile ? height * 0.45 : 70 },
      maxZoom: 6, duration: 700,
    });
  }, [selectedChokepoint, showChokepoints, showMaritimeRoutes]);

  // Check once whether the online basemap is reachable; fall back to the
  // embedded offline style so the map works even without any network.
  useEffect(() => {
    if (offlineChecked.current) return;
    offlineChecked.current = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(BASEMAP, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      })
      .catch(() => setStyle(OFFLINE_STYLE))
      .finally(() => clearTimeout(timer));
  }, []);

  // Fly to a country when it's picked from the list / search.
  useEffect(() => {
    if (focusBbox && mapRef.current) {
      // Keep the country clear of the floating panels, but never let padding
      // exceed the viewport (which would degenerate on narrow screens).
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const h = typeof window !== 'undefined' ? window.innerHeight : 800;
      const left = Math.min(360, Math.round(w * 0.28));
      const right = Math.min(380, Math.round(w * 0.3));
      const vert = Math.min(80, Math.round(h * 0.12));
      mapRef.current.fitBounds(
        [
          [focusBbox[0], focusBbox[1]],
          [focusBbox[2], focusBbox[3]],
        ],
        { padding: { top: vert, bottom: vert, left, right }, duration: 900, maxZoom: 6 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce, mapLoaded]);

  const clearHover = useCallback((map: MapInstance) => {
    if (hoveredRef.current) {
      map.setFeatureState({ source: 'countries', id: hoveredRef.current }, { hover: false });
      hoveredRef.current = null;
    }
  }, []);

  const onMouseMove = useCallback(
    (e: MapEvt) => {
      const map = e.target;
      const feature = e.features?.[0];
      const iso3 = feature?.properties?.iso3 as string | undefined;
      if (hoveredRef.current !== (iso3 ?? null)) {
        clearHover(map);
        if (iso3) map.setFeatureState({ source: 'countries', id: iso3 }, { hover: true });
        hoveredRef.current = iso3 ?? null;
      }
      if (iso3) {
        map.getCanvas().style.cursor = 'pointer';
        hoverQueue.push({
          iso3,
          name: (feature?.properties?.name as string) ?? iso3,
          x: e.point.x,
          y: e.point.y,
        });
      } else {
        map.getCanvas().style.cursor = '';
        hoverQueue.push(null);
      }
    },
    [clearHover, hoverQueue],
  );

  const onMouseOut = useCallback(
    (e: MapEvt) => {
      clearHover(e.target);
      hoverQueue.cancel();
      e.target.getCanvas().style.cursor = '';
      onHover(null);
    },
    [clearHover, onHover, hoverQueue],
  );

  const onClick = useCallback(
    (e: MapEvt) => {
      const iso3 = e.features?.[0]?.properties?.iso3 as string | undefined;
      onSelect(iso3 ?? null);
    },
    [onSelect],
  );

  return (
    <MapGL
      reuseMaps
      ref={mapRef as never}
      initialViewState={{ longitude: 12, latitude: 28, zoom: 1.45 }}
      minZoom={0.7}
      maxZoom={7}
      dragRotate={false}
      mapStyle={style}
      style={{ position: 'absolute', inset: 0 }}
      interactiveLayerIds={['country-fill', 'country-fill-fade']}
      onMouseMove={onMouseMove}
      onMouseOut={onMouseOut}
      onClick={onClick}
      onLoad={() => setMapLoaded(true)}
      attributionControl={{
        compact: true,
        customAttribution: t.sourcesFooter,
      }}
    >
      {/* promoteId lets feature-state key on the country's ISO3 string */}
      <Source id="countries" type="geojson" data={data as never} promoteId="iso3">
        <SmoothFill id="country-fill" color={fillColor} opacity={0.85} />
        <Layer
          id="country-border"
          type="line"
          paint={{
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#ffffff',
              'rgba(170,195,235,0.16)',
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1.4,
              0.4,
            ],
          }}
        />
        <Layer
          id="country-selected"
          type="line"
          filter={['==', ['get', 'iso3'], selectedIso ?? ' ']}
          paint={{ 'line-color': '#ffd166', 'line-width': 2.2 }}
        />
      </Source>
      {showDayNight && <SolarCycle />}
      <DeckOverlay
        arcs={arcs}
        showCables={showCables}
        showChokepoints={showChokepoints}
        selectedChokepoint={selectedChokepoint}
        showMaritimeRoutes={showMaritimeRoutes}
        showMarkets={showMarkets}
        cables={cables}
        chokepoints={chokepoints}
        markets={markets}
        onSelectChokepoint={onSelectChokepoint}
      />
      {showWebcams && onSelectWebcam && onSelectWebcamCluster && <WebcamMarkers country={webcamCountry} onSelect={onSelectWebcam} onSelectCluster={onSelectWebcamCluster} />}
      {newsHotspots && onSelectNews && <NewsMarkers hotspots={newsHotspots} selected={selectedNewsIso} onSelect={onSelectNews} />}
    </MapGL>
  );
});
