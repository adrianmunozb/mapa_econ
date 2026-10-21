import { useEffect, useMemo, useState } from 'react';
import { Source, Layer } from '@vis.gl/react-maplibre';
import cities from '../data/cities.json';
import { nightGeometry, solarAltitude, sunPosition } from '../lib/solar';

/** Mounted only while the layer is enabled; one local timer and no network activity. */
export function SolarCycle() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => setTime(new Date());
    const sync = () => {
      clearInterval(timer);
      if (!document.hidden) {
        update();
        timer = setInterval(update, 30000);
      }
    };
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  const sun = useMemo(() => sunPosition(time), [time]);
  const night = useMemo(() => nightGeometry(sun), [sun]);
  const lights = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: (cities as [string, number, number, number][]).flatMap(([name, longitude, latitude, population]) => {
      const altitude = solarAltitude(longitude, latitude, sun);
      if (altitude >= 0) return [];
      return [{ type: 'Feature' as const,
        properties: { name, strength: Math.min(1, -altitude / 8), size: Math.max(0.7, Math.min(3, Math.log10(Math.max(1, population)) - 4)) },
        geometry: { type: 'Point' as const, coordinates: [longitude, latitude] },
      }];
    }),
  }), [sun]);
  return <>
    <Source id="solar-night" type="geojson" data={night}>
      <Layer id="solar-night-shade" beforeId="country-border" type="fill" paint={{
        'fill-color': '#020817', 'fill-opacity': ['get', 'opacity'], 'fill-antialias': false,
      }} />
    </Source>
    <Source id="urban-lights" type="geojson" data={lights}>
      <Layer id="urban-lights-glow" type="circle" paint={{
        'circle-radius': ['*', ['get', 'size'], 4], 'circle-color': '#f6b64d',
        'circle-opacity': ['*', ['get', 'strength'], 0.35], 'circle-blur': 0.85,
      }} />
      <Layer id="urban-lights-core" type="circle" paint={{
        'circle-radius': ['get', 'size'], 'circle-color': '#ffe9b0',
        'circle-opacity': ['*', ['get', 'strength'], 0.9], 'circle-blur': 0.25,
      }} />
    </Source>
    <div className="solar-clock" aria-label="Ciclo solar en vivo">
      <span className="solar-clock__orb" aria-hidden="true" />
      <div><strong>Día / Noche <span>EN VIVO</span></strong>
        <time dateTime={time.toISOString()}>{time.toISOString().slice(11, 16)} UTC</time>
      </div>
    </div>
  </>;
}
