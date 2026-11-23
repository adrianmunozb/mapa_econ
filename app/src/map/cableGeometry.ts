import type { CableRoute } from './cableFlow';

export interface CableRenderRoute extends CableRoute { path: Float64Array; }

/** Flat, already normalized open paths for deck.gl's fast path. */
export function cableRenderRoutes(routes: CableRoute[]): CableRenderRoute[] {
  return routes.map(route => ({ ...route, path: new Float64Array(route.points.flat()) }));
}

/** Per-segment start/end distance and route phase. Built once, never per frame. */
export function cableProgress(routes: CableRenderRoute[]): Float32Array {
  const result = new Float32Array(routes.reduce((sum, route) => sum + route.points.length, 0) * 3);
  let offset = 0;
  routes.forEach((route, index) => {
    route.distances.forEach((distance, point) => {
      result[offset++] = distance;
      result[offset++] = route.distances[Math.min(point + 1, route.distances.length - 1)];
      result[offset++] = index * 7;
    });
  });
  return result;
}
