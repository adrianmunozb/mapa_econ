import type { MetricMeta } from '../types';
import type { Lang } from '../i18n';
import { LOCALES, metricUnit } from '../i18n';

const COMPACT_THRESHOLD = 1e7; // values >= 10M render compactly (M / Mrd. / B)

/** Locale-formatted number part only (no unit). */
export function formatNumber(value: number, metric: MetricMeta, lang: Lang = 'en'): string {
  const compact = Math.abs(value) >= COMPACT_THRESHOLD;
  const decimals = compact
    ? 1
    : metric.format === 'currency'
      ? 0
      : metric.format === 'number'
        ? Math.abs(value) < 100
          ? 1 // small counts (CO₂/capita, fertility) keep a decimal
          : 0 // large counts (population) stay whole
        : 1;
  return new Intl.NumberFormat(LOCALES[lang], {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Number + unit, ready to display (e.g. "12,345 US$", "81.3 years", "5.4 %"). */
export function formatValueWithUnit(value: number, metric: MetricMeta, lang: Lang = 'en'): string {
  const n = formatNumber(value, metric, lang);
  switch (metric.format) {
    case 'percent':
      return `${n} %`;
    case 'years':
      return lang === 'de' ? `${n} Jahre` : `${n} years`;
    case 'currency':
      return `${n} ${metricUnit(metric, lang)}`;
    case 'index':
      return n;
    case 'number':
    default:
      return n;
  }
}

/** Format a change value (development mode): relative % for currency/number
 *  metrics, absolute Δ (years / percentage points / index points) otherwise. */
export function formatChange(value: number, metric: MetricMeta, lang: Lang = 'en'): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const num = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 1 }).format(Math.abs(value));
  if (metric.format === 'currency' || metric.format === 'number') return `${sign}${num} %`;
  if (metric.format === 'years') return lang === 'de' ? `${sign}${num} J.` : `${sign}${num} yr`;
  if (metric.format === 'percent') return lang === 'de' ? `${sign}${num} %-Pkt.` : `${sign}${num} pp`;
  return `${sign}${num}`;
}

/** Compact USD amount for trade values, e.g. "US$ 337.9B". */
export function formatUsdCompact(value: number, lang: Lang = 'en'): string {
  const s = new Intl.NumberFormat(LOCALES[lang], {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
  return `${s} US$`;
}

/** Short label for legend ticks. */
export function formatCompact(value: number, metric?: MetricMeta, lang: Lang = 'en'): string {
  const s = new Intl.NumberFormat(LOCALES[lang], {
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
  if (!metric) return s;
  if (metric.format === 'percent') return `${s} %`;
  if (metric.format === 'years') return lang === 'de' ? `${s} J.` : `${s} yr`;
  return s;
}
