import { useEffect, useMemo, useRef } from 'react';
import { Map as MapGL, type MapRef } from '@vis.gl/react-maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_THEME } from '../theme';

const DEGREES_PER_SECOND = 6;

/** Decorative rotating globe for the landing page, drawn from the app's own country
 *  borders (no tiles, so it also works offline). Still under prefers-reduced-motion. */
export function Globe({ countries }: { countries: unknown | null }) {
  const ref = useRef<MapRef>(null);

  const style = useMemo<StyleSpecification>(() => ({
    version: 8,
    projection: { type: 'globe' },
    sources: (countries ? { countries: { type: 'geojson', data: countries as GeoJSON.FeatureCollection } } : {}) as StyleSpecification['sources'],
    layers: [
      { id: 'ocean', type: 'background', paint: { 'background-color': MAP_THEME.ocean } },
      ...(countries ? [
        { id: 'land', type: 'fill' as const, source: 'countries', paint: { 'fill-color': MAP_THEME.land } },
        { id: 'borders', type: 'line' as const, source: 'countries', paint: { 'line-color': MAP_THEME.border, 'line-width': 0.5, 'line-opacity': 0.8 } },
      ] : []),
    ],
  }), [countries]);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let last = performance.now();
    const spin = (now: number) => {
      const map = ref.current?.getMap();
      if (map && !document.hidden) {
        const center = map.getCenter();
        map.setCenter([((center.lng + DEGREES_PER_SECOND * (now - last) / 1000 + 540) % 360) - 180, center.lat]);
      }
      last = now;
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="globe" aria-hidden="true">
      <MapGL
        ref={ref}
        initialViewState={{ longitude: -20, latitude: 22, zoom: 1.75 }}
        mapStyle={style}
        interactive={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
