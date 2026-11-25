// CSV built in the browser from the data already loaded: works offline and in the
// single-file build, and matches what the map shows. Comma-separated, like data/csv/.
import type { CountryData, MetricHistory, MetricMeta } from '../types';

/** Numbers as the pipeline writes them (Python repr): tiny values in exponent form. */
const number = (v: number): string =>
  v !== 0 && Math.abs(v) < 1e-4 ? v.toExponential().replace(/e([+-])(\d)$/, 'e$10$2') : String(v);

const cell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'number' ? number(value) : value;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: (string | number | null | undefined)[][]): string =>
  rows.map(row => row.map(cell).join(',')).join('\n') + '\n';

/** Same layout as the pipeline's data/csv/history/<metric>.csv: country × year. */
export function historyCsv(countries: Pick<CountryData, 'iso3' | 'name'>[], history: MetricHistory,
  startYear: number, endYear: number): string {
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  const rows = [...countries]
    .sort((a, b) => (a.iso3 < b.iso3 ? -1 : a.iso3 > b.iso3 ? 1 : 0))
    .filter(c => history[c.iso3] && Object.keys(history[c.iso3]).length)
    .map(c => [c.iso3, c.name, ...years.map(y => history[c.iso3][String(y)])]);
  return toCsv([['iso3', 'country', ...years.map(String)], ...rows]);
}

/** Latest value of one metric for every country that has it. */
export function latestCsv(metric: MetricMeta, label: string, unit: string, countries: CountryData[]): string {
  const rows = countries
    .filter(c => c.metrics[metric.id])
    .sort((a, b) => (a.iso3 < b.iso3 ? -1 : 1))
    .map(c => {
      const v = c.metrics[metric.id]!;
      return [c.iso3, c.name, v.value, v.period ?? v.year, unit, metric.source?.name, metric.source?.license];
    });
  return toCsv([['iso3', 'pais', `${metric.id} (${label})`, 'periodo', 'unidad', 'fuente', 'licencia'], ...rows]);
}

/** Every metric available for one country. */
export function countryCsv(country: CountryData, metrics: MetricMeta[],
  label: (m: MetricMeta) => string, unit: (m: MetricMeta) => string): string {
  const rows = metrics
    .filter(m => country.metrics[m.id])
    .map(m => {
      const v = country.metrics[m.id]!;
      return [m.id, label(m), v.value, unit(m), v.period ?? v.year, m.source?.name, m.source?.license];
    });
  return toCsv([['id', 'metrica', 'valor', 'unidad', 'periodo', 'fuente', 'licencia'], ...rows]);
}

/** Save ``text`` as a file. The BOM makes Excel read the accents as UTF-8. */
export function downloadCsv(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
