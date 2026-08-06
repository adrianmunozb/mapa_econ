import type { MetricFormat } from '../types';

export type YearMap = Record<string, number>; // "2004" -> value

/** Most recent (year, value) in a sparse year→value map. */
export function latestPoint(hist: YearMap | undefined): { year: number; value: number } | null {
  if (!hist) return null;
  let best: { year: number; value: number } | null = null;
  for (const [y, v] of Object.entries(hist)) {
    const year = Number(y);
    if (!best || year > best.year) best = { year, value: v };
  }
  return best;
}

/** Value at a given year, or the nearest available within ±tol years. */
export function valueAtYear(hist: YearMap | undefined, year: number, tol = 2): number | null {
  if (!hist) return null;
  for (let d = 0; d <= tol; d++) {
    const earlier = hist[String(year - d)];
    if (earlier != null) return earlier;
    const later = hist[String(year + d)];
    if (later != null) return later;
  }
  return null;
}

/**
 * Change in a metric from `fromYear` to the latest available year.
 * Relative (%) for currency/number metrics, absolute (Δ in unit) otherwise.
 * Returns null when there isn't enough data to compute a span.
 */
export function changeSince(
  hist: YearMap | undefined,
  fromYear: number,
  format: MetricFormat,
): number | null {
  const latest = latestPoint(hist);
  if (!latest || latest.year <= fromYear) return null;
  const base = valueAtYear(hist, fromYear);
  if (base == null) return null;
  if (format === 'currency' || format === 'number') {
    if (base === 0) return null;
    return ((latest.value - base) / Math.abs(base)) * 100;
  }
  return latest.value - base;
}
