// Color for countries that have no value for the active metric.
export const NO_DATA_COLOR = '#27314d';

// Sequential ramp (low -> high) tuned to glow on a dark basemap.
const RAMP = ['#16385a', '#1f6f8b', '#2aa39a', '#5cc26b', '#a9d949', '#f4e733'];

// Diverging ramp for development mode: red (decline) → neutral → blue (growth).
const DIVERGING = ['#d1495b', '#e8895f', '#e9e0c9', '#48a9a6', '#2978b5'];

export interface ColorScale {
  /** MapLibre `fill-color` expression. */
  expression: unknown;
  legendColors: string[];
  min: number;
  max: number;
  empty: boolean;
  diverging: boolean;
}

/**
 * Quantile-classed sequential scale for the value stored at `propertyKey`.
 * Quantile breaks keep skewed data (GDP, population) readable.
 */
export function buildColorScale(values: number[], propertyKey: string): ColorScale {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) {
    return { expression: NO_DATA_COLOR, legendColors: RAMP, min: 0, max: 0, empty: true, diverging: false };
  }

  const sorted = [...clean].sort((a, b) => a - b);
  const n = RAMP.length;
  const breaks: number[] = [];
  for (let i = 0; i < n; i++) {
    const q = i / (n - 1);
    const idx = q * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    breaks.push(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
  }
  for (let i = 1; i < breaks.length; i++) {
    if (breaks[i] <= breaks[i - 1]) {
      breaks[i] = breaks[i - 1] + Math.abs(breaks[i - 1] || 1) * 1e-4 + 1e-6;
    }
  }

  const interp: unknown[] = ['interpolate', ['linear'], ['get', propertyKey]];
  breaks.forEach((b, i) => interp.push(b, RAMP[i]));
  return {
    expression: ['case', ['has', propertyKey], interp, NO_DATA_COLOR],
    legendColors: RAMP,
    min: breaks[0],
    max: breaks[breaks.length - 1],
    empty: false,
    diverging: false,
  };
}

/**
 * Diverging scale centered on 0 for change values, with a symmetric domain at the
 * 95th percentile of |change| so a few extreme movers don't wash out the rest.
 */
export function buildDivergingScale(values: number[], propertyKey: string): ColorScale {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) {
    return { expression: NO_DATA_COLOR, legendColors: DIVERGING, min: 0, max: 0, empty: true, diverging: true };
  }
  const absSorted = clean.map(Math.abs).sort((a, b) => a - b);
  const p95 = absSorted[Math.floor(0.95 * (absSorted.length - 1))] || absSorted[absSorted.length - 1] || 1;
  const m = p95 || 1;
  const stops = [-m, -m / 2, 0, m / 2, m];

  const interp: unknown[] = ['interpolate', ['linear'], ['get', propertyKey]];
  stops.forEach((s, i) => interp.push(s, DIVERGING[i]));
  return {
    expression: ['case', ['has', propertyKey], interp, NO_DATA_COLOR],
    legendColors: DIVERGING,
    min: -m,
    max: m,
    empty: false,
    diverging: true,
  };
}
