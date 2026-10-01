import { useCallback, useEffect, useRef, useState } from 'react';
import { Map as MapGL, Source, Layer } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StyleSpecification } from 'maplibre-gl';
import type { BBox } from '../lib/geo';
import { useLang } from '../i18n';

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

export interface RegionHoverInfo {
  name: string;
  value: number | null;
  year: number | null;
  x: number;
  y: number;
}

export interface RegionSelection {
  shapeId: string;
  regionId: string | null;
  name: string;
}

interface Props {
  data: unknown;
  fillColor: unknown;
  selectedShapeId: string | null;
  focusBbox: BBox | null;
  countryName: string;
  onHover: (info: RegionHoverInfo | null) => void;
  onSelect: (selection: RegionSelection) => void;
}

const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const OFFLINE_STYLE: StyleSpecification = {
  version: 8,
  name: 'World Economic Map (offline)',
  sources: {},
  layers: [{ id: 'wem-bg', type: 'background', paint: { 'background-color': '#0d1117' } }],
};

export function RegionMap({
  data,
  fillColor,
  selectedShapeId,
  focusBbox,
  countryName,
  onHover,
  onSelect,
}: Props) {
  const mapRef = useRef<MapInstance | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const offlineChecked = useRef(false);
  const { t } = useLang();
  const [style, setStyle] = useState<string | StyleSpecification>(() =>
    typeof navigator !== 'undefined' && navigator.onLine === false ? OFFLINE_STYLE : BASEMAP,
  );

  useEffect(() => {
    if (offlineChecked.current) return;
    offlineChecked.current = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(BASEMAP, { signal: ctrl.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      })
      .catch(() => setStyle(OFFLINE_STYLE))
      .finally(() => clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!focusBbox || !mapRef.current) return;
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    mapRef.current.fitBounds(
      [
        [focusBbox[0], focusBbox[1]],
        [focusBbox[2], focusBbox[3]],
      ],
      {
        padding: {
          top: Math.min(72, Math.round(height * 0.1)),
          bottom: Math.min(72, Math.round(height * 0.1)),
          left: Math.min(340, Math.round(width * 0.28)),
          right: Math.min(360, Math.round(width * 0.3)),
        },
        duration: 750,
        maxZoom: 8,
      },
    );
  }, [focusBbox]);

  const clearHover = useCallback((map: MapInstance) => {
    if (hoveredRef.current) {
      map.setFeatureState({ source: 'regions', id: hoveredRef.current }, { hover: false });
      hoveredRef.current = null;
    }
  }, []);

  const onMouseMove = useCallback((event: MapEvt) => {
    const feature = event.features?.[0];
    const properties = feature?.properties;
    clearHover(event.target);
    const shapeId = typeof properties?.shapeId === 'string' ? properties.shapeId : null;
    if (!shapeId) {
      event.target.getCanvas().style.cursor = '';
      onHover(null);
      return;
    }
    event.target.setFeatureState({ source: 'regions', id: shapeId }, { hover: true });
    hoveredRef.current = shapeId;
    event.target.getCanvas().style.cursor = 'pointer';
    onHover({
      name: (properties?.name as string) ?? countryName,
      value: typeof properties?.metricValue === 'number' ? properties.metricValue : null,
      year: typeof properties?.metricYear === 'number' ? properties.metricYear : null,
      x: event.point.x,
      y: event.point.y,
    });
  }, [clearHover, countryName, onHover]);

  const onMouseOut = useCallback((event: MapEvt) => {
    clearHover(event.target);
    event.target.getCanvas().style.cursor = '';
    onHover(null);
  }, [clearHover, onHover]);

  const onClick = useCallback((event: MapEvt) => {
    const properties = event.features?.[0]?.properties;
    if (!properties) return;
    onSelect({
      shapeId: String(properties.shapeId ?? ''),
      regionId: typeof properties.regionId === 'string' ? properties.regionId : null,
      name: String(properties.name ?? countryName),
    });
  }, [countryName, onSelect]);

  return (
    <MapGL
      ref={mapRef as never}
      initialViewState={{ longitude: 0, latitude: 25, zoom: 2 }}
      minZoom={0.7}
      maxZoom={9}
      dragRotate={false}
      mapStyle={style}
      style={{ position: 'absolute', inset: 0 }}
      interactiveLayerIds={['region-fill']}
      onMouseMove={onMouseMove}
      onMouseOut={onMouseOut}
      onClick={onClick}
      attributionControl={{ compact: true, customAttribution: t.sourcesFooter }}
    >
      <Source id="regions" type="geojson" data={data as never} promoteId="shapeId">
        <Layer
          id="region-fill"
          type="fill"
          paint={{ 'fill-color': fillColor as never, 'fill-opacity': 0.87 }}
        />
        <Layer
          id="region-border"
          type="line"
          paint={{
            'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#ffffff', 'rgba(170,195,235,0.28)'],
            'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 1.5, 0.65],
          }}
        />
        <Layer
          id="region-selected"
          type="line"
          filter={['==', ['get', 'shapeId'], selectedShapeId ?? ' ']}
          paint={{ 'line-color': '#ffd166', 'line-width': 2.4 }}
        />
      </Source>
    </MapGL>
  );
}

