// Frozen pre-optimization implementation; used only by tests and --reference.
import type { SubmarineCable } from '../../src/data/maritime';

type Point = [number, number];
export interface CableRoute extends SubmarineCable {
  distances: number[];
  total: number;
}

// Work in Mercator space so packets follow the exact rendered line, also at high latitudes.
const project = ([x, y]: Point): Point => [x, Math.log(Math.tan(Math.PI / 4 + y * Math.PI / 360)) * 180 / Math.PI];
const unproject = ([x, y]: Point): Point => [x, (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI];
const mix = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function prepareCable(cable: SubmarineCable): CableRoute {
  const controls = cable.points.map(project);
  // Keep Pacific crossings continuous instead of drawing a line across the entire world.
  for (let i = 1; i < controls.length; i++) {
    while (controls[i][0] - controls[i - 1][0] > 180) controls[i][0] -= 360;
    while (controls[i][0] - controls[i - 1][0] < -180) controls[i][0] += 360;
  }
  const smooth: Point[] = [controls[0]];
  for (let i = 1; i < controls.length - 1; i++) {
    const start = mix(controls[i], controls[i - 1], 0.12);
    const end = mix(controls[i], controls[i + 1], 0.12);
    smooth.push(start);
    for (let step = 1; step <= 8; step++) {
      const t = step / 8;
      smooth.push(mix(mix(start, controls[i], t), mix(controls[i], end, t), t));
    }
  }
  smooth.push(controls[controls.length - 1]);
  const distances = [0];
  for (let i = 1; i < smooth.length; i++) {
    distances.push(distances[i - 1] + Math.hypot(smooth[i][0] - smooth[i - 1][0], smooth[i][1] - smooth[i - 1][1]));
  }
  return { ...cable, points: smooth.map(unproject), distances, total: distances[distances.length - 1] };
}

export interface CablePulse { points: Point[]; }

export function cablePulses(routes: CableRoute[], seconds: number): CablePulse[] {
  const pulses: CablePulse[] = [];
  for (const [index, route] of routes.entries()) {
    if (route.total <= 0) continue;
    const at = (distance: number): Point => {
      let i = 1;
      while (i < route.distances.length - 1 && route.distances[i] < distance) i++;
      const span = route.distances[i] - route.distances[i - 1];
      return unproject(mix(project(route.points[i - 1]), project(route.points[i]), span ? (distance - route.distances[i - 1]) / span : 0));
    };
    // Constant map-space speed; stagger routes and repeat packets every 26 degrees.
    for (let head = (seconds * 5 + index * 7) % 26; head < route.total + 4; head += 26) {
      const start = Math.max(0, head - 4);
      const end = Math.min(head, route.total);
      if (end <= start) continue;
      const points = [at(start)];
      route.distances.forEach((distance, i) => {
        if (distance > start && distance < end) points.push(route.points[i]);
      });
      points.push(at(end));
      pulses.push({ points });
    }
  }
  return pulses;
}
