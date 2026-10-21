// NOAA fractional-year approximation; UTC throughout, including leap years.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
const RAD = Math.PI / 180;
export interface SunPosition { longitude: number; declination: number; }

export function sunPosition(date: Date): SunPosition {
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const daysInYear = (Date.UTC(year + 1, 0, 1) - start) / 86400000;
  const day = (date.getTime() - start) / 86400000;
  const gamma = 2 * Math.PI / daysInYear * (day - 0.5);
  const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const longitude = ((180 - (minutes + equation) / 4 + 540) % 360) - 180;
  return { longitude, declination };
}

export function solarAltitude(longitude: number, latitude: number, sun: SunPosition): number {
  const dot = Math.sin(latitude * RAD) * Math.sin(sun.declination)
    + Math.cos(latitude * RAD) * Math.cos(sun.declination) * Math.cos((longitude - sun.longitude) * RAD);
  return Math.asin(Math.max(-1, Math.min(1, dot))) / RAD;
}

// Solve the small-circle boundary at a longitude. Multiple intervals handle polar day/night.
export function nightIntervals(longitude: number, altitude: number, sun: SunPosition): [number, number][] {
  const a = Math.sin(sun.declination);
  const b = Math.cos(sun.declination) * Math.cos((longitude - sun.longitude) * RAD);
  const r = Math.hypot(a, b);
  const ratio = Math.sin(altitude * RAD) / r;
  const cuts = [-85, 85]; // Web Mercator's visible latitude range.
  if (r > 1e-12 && Math.abs(ratio) <= 1) {
    const angle = Math.asin(ratio);
    const phase = Math.atan2(b, a);
    for (const root of [angle - phase, Math.PI - angle - phase]) {
      for (let turn = -2; turn <= 2; turn++) {
        const latitude = (root + turn * 2 * Math.PI) / RAD;
        if (latitude > -85 && latitude < 85) cuts.push(latitude);
      }
    }
  }
  cuts.sort((x, y) => x - y);
  const intervals: [number, number][] = [];
  for (let i = 1; i < cuts.length; i++) {
    if (solarAltitude(longitude, (cuts[i - 1] + cuts[i]) / 2, sun) < altitude) {
      intervals.push([cuts[i - 1], cuts[i]]);
    }
  }
  return intervals;
}

export function nightGeometry(sun: SunPosition) {
  const features = [];
  // Layered transparent caps soften the terminator without external textures or tiles.
  for (const altitude of [0, -2, -4, -7, -11, -18]) {
    for (let longitude = -180; longitude < 180; longitude++) {
      const middle = nightIntervals(longitude + 0.5, altitude, sun);
      const left = nightIntervals(longitude, altitude, sun);
      const right = nightIntervals(longitude + 1, altitude, sun);
      for (const interval of middle) {
        const closest = (edges: [number, number][]): [number, number] => {
          if (!edges.length) {
            const latitude = (interval[0] + interval[1]) / 2;
            return [latitude, latitude];
          }
          return edges.reduce((best, edge) => Math.abs(edge[0] + edge[1] - interval[0] - interval[1])
            < Math.abs(best[0] + best[1] - interval[0] - interval[1]) ? edge : best);
        };
        const [lowLeft, highLeft] = closest(left);
        const [lowRight, highRight] = closest(right);
        features.push({
          type: 'Feature' as const,
          properties: { opacity: altitude === 0 ? 0.13 : 0.16 },
          geometry: { type: 'Polygon' as const, coordinates: [[
            [longitude, lowLeft], [longitude + 1, lowRight], [longitude + 1, highRight],
            [longitude, highLeft], [longitude, lowLeft],
          ]] },
        });
      }
    }
  }
  return { type: 'FeatureCollection' as const, features };
}
