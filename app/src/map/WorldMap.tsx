import { useCallback, useEffect, useRef } from 'react';
import { Map as MapGL, Source, Layer, useControl } from '@vis.gl/react-maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArcLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { BBox } from '../lib/geo';

// The map instance + event shapes we actually use. Kept local so we don't depend
// on the exact type-export surface of the wrapper/maplibre-gl across versions.
interface MapInstance {
  setFeatureState: (target: { source: string; id: string }, state: Record<string, unknown>) => void;
  getCanvas: () => HTMLCanvasElement;
  fitBounds: (bounds: [[number, number], [number, number]], opts?: Record<string, unknown>) => void;
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
  label: string;
}

interface Props {
  data: unknown; // enriched FeatureCollection (metric values on each feature)
  fillColor: unknown; // MapLibre fill-color expression
  selectedIso: string | null;
  focusBbox: BBox | null;
  focusNonce: number; // bump to re-trigger fly-to even for the same bbox
  arcs: Arc[];
  onHover: (info: HoverInfo | null) => void;
  onSelect: (iso3: string | null) => void;
}

// CARTO dark-matter: tokenless vector style, dark ocean — ideal under a glowing choropleth.
const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

/** deck.gl overlay (added as a MapLibre control) that draws the trade arcs. */
function DeckOverlay({ arcs }: { arcs: Arc[] }) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: false, layers: [] }));
  const layers = arcs.length
    ? [
        new ArcLayer<Arc>({
          id: 'trade-arcs',
          data: arcs,
          getSourcePosition: (d) => d.source,
          getTargetPosition: (d) => d.target,
          getSourceColor: [255, 209, 102, 235] as [number, number, number, number],
          getTargetColor: [79, 156, 249, 205] as [number, number, number, number],
          getWidth: (d) => d.width,
          getHeight: 0.5,
          greatCircle: true,
          pickable: true,
        }),
      ]
    : [];
  (overlay as unknown as { setProps: (p: Record<string, unknown>) => void }).setProps({
    layers,
    getTooltip: (info: { object?: Arc }) => (info.object ? { text: info.object.label } : null),
  });
  return null;
}

export function WorldMap({
  data,
  fillColor,
  selectedIso,
  focusBbox,
  focusNonce,
  arcs,
  onHover,
  onSelect,
}: Props) {
  const hoveredRef = useRef<string | null>(null);
  const mapRef = useRef<MapInstance | null>(null);

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
  }, [focusNonce]);

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
      clearHover(map);
      const iso3 = feature?.properties?.iso3 as string | undefined;
      if (iso3) {
        map.setFeatureState({ source: 'countries', id: iso3 }, { hover: true });
        hoveredRef.current = iso3;
        map.getCanvas().style.cursor = 'pointer';
        onHover({
          iso3,
          name: (feature?.properties?.name as string) ?? iso3,
          x: e.point.x,
          y: e.point.y,
        });
      } else {
        map.getCanvas().style.cursor = '';
        onHover(null);
      }
    },
    [clearHover, onHover],
  );

  const onMouseOut = useCallback(
    (e: MapEvt) => {
      clearHover(e.target);
      e.target.getCanvas().style.cursor = '';
      onHover(null);
    },
    [clearHover, onHover],
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
      ref={mapRef as never}
      initialViewState={{ longitude: 12, latitude: 28, zoom: 1.45 }}
      minZoom={0.7}
      maxZoom={7}
      dragRotate={false}
      mapStyle={BASEMAP}
      style={{ position: 'absolute', inset: 0 }}
      interactiveLayerIds={['country-fill']}
      onMouseMove={onMouseMove}
      onMouseOut={onMouseOut}
      onClick={onClick}
      attributionControl={{
        compact: true,
        customAttribution:
          'Daten: World Bank · IMF (Handel & Inflation) · BIS (Leitzins) · Grenzen: Natural Earth',
      }}
    >
      {/* promoteId lets feature-state key on the country's ISO3 string */}
      <Source id="countries" type="geojson" data={data as never} promoteId="iso3">
        <Layer
          id="country-fill"
          type="fill"
          paint={{ 'fill-color': fillColor as never, 'fill-opacity': 0.85 }}
        />
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
      <DeckOverlay arcs={arcs} />
    </MapGL>
  );
}
