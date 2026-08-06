export type BBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

/** Bounding box of a GeoJSON Polygon/MultiPolygon geometry. */
export function bboxOf(geometry: unknown): BBox | null {
  const g = geometry as { coordinates?: unknown } | null;
  if (!g?.coordinates) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (node: unknown) => {
    const arr = node as number[] | unknown[];
    if (typeof arr[0] === 'number') {
      const x = arr[0] as number;
      const y = arr[1] as number;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    } else {
      for (const child of arr as unknown[]) visit(child);
    }
  };
  visit(g.coordinates);
  if (!Number.isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

/** Merge two bounding boxes into one that contains both. */
export function mergeBBox(a: BBox, b: BBox): BBox {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
}

/**
 * Centroid of the *largest* polygon in a geometry, plus that polygon's bbox area.
 * Using the biggest landmass gives a good node position for trade arcs even when a
 * country has far-flung territories or crosses the antimeridian (USA incl. Alaska,
 * France incl. overseas, Russia, Fiji ...), where a whole-geometry center lands in
 * the ocean.
 */
export function largestPolygonCentroid(
  geometry: unknown,
): { point: [number, number]; area: number } | null {
  const g = geometry as { type?: string; coordinates?: unknown };
  if (!g?.coordinates) return null;

  let best: { ring: number[][]; area: number } | null = null;
  const consider = (ring: number[][]) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const pt of ring) {
      if (pt[0] < minX) minX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] > maxY) maxY = pt[1];
    }
    const area = (maxX - minX) * (maxY - minY);
    if (!best || area > best.area) best = { ring, area };
  };

  if (g.type === 'Polygon') {
    consider((g.coordinates as number[][][])[0]);
  } else if (g.type === 'MultiPolygon') {
    for (const poly of g.coordinates as number[][][][]) consider(poly[0]);
  } else {
    return null;
  }
  if (!best) return null;

  const ring = (best as { ring: number[][] }).ring;
  let sx = 0;
  let sy = 0;
  for (const pt of ring) {
    sx += pt[0];
    sy += pt[1];
  }
  const n = ring.length || 1;
  return { point: [sx / n, sy / n], area: (best as { area: number }).area };
}
