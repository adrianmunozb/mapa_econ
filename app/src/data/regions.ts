import type { MetricMeta } from '../types';
import { LOCALES, type Lang } from '../i18n';

export type RegionalMetricId =
  | 'gdpPerCapitaUsd2015'
  | 'gdpPerCapitaUsd'
  | 'gdpTotalUsd'
  | 'population';

export interface RegionalMetricMeta {
  id: RegionalMetricId;
  label: Record<Lang, string>;
  shortLabel: Record<Lang, string>;
  unit: Record<Lang, string>;
  format: 'currency' | 'number';
}

export const REGIONAL_METRICS: RegionalMetricMeta[] = [
  {
    id: 'gdpPerCapitaUsd2015',
    label: { es: 'PIB per cápita (US$ de 2015)' },
    shortLabel: { es: 'PIB per cápita' },
    unit: { es: 'US$ de 2015' },
    format: 'currency',
  },
  {
    id: 'gdpPerCapitaUsd',
    label: { es: 'PIB per cápita (US$ corrientes)' },
    shortLabel: { es: 'PIB per cápita' },
    unit: { es: 'US$ corrientes' },
    format: 'currency',
  },
  {
    id: 'gdpTotalUsd',
    label: { es: 'PIB regional calculado (US$ corrientes)' },
    shortLabel: { es: 'PIB calculado' },
    unit: { es: 'US$ corrientes' },
    format: 'currency',
  },
  {
    id: 'population',
    label: { es: 'Población' },
    shortLabel: { es: 'Población' },
    unit: { es: 'personas' },
    format: 'number',
  },
];

export interface RegionalValue {
  value: number;
  year: number;
}

export interface RegionRecord {
  id: string;
  name: string;
  values: Record<string, Partial<Record<RegionalMetricId, number>>>;
}

export interface RegionalCountryData {
  iso3: string;
  regions: RegionRecord[];
}

export interface RegionalCountryCoverage {
  regions: number;
  matched: number;
  boundaryUnits: number;
}

export interface RegionalIndex {
  generatedAt: string;
  coverage: {
    countries: number;
    regions: number;
    firstYear: number;
    lastYear: number;
    minimumCountryMatch: number;
    notes: string;
  };
  sources: Array<{ name: string; url: string; license: string }>;
  countries: Record<string, RegionalCountryCoverage>;
}

export function latestRegionalValue(
  region: RegionRecord | undefined,
  metricId: RegionalMetricId,
): RegionalValue | null {
  if (!region) return null;
  let latest: RegionalValue | null = null;
  for (const [yearString, values] of Object.entries(region.values)) {
    const value = values[metricId];
    const year = Number(yearString);
    if (typeof value === 'number' && Number.isFinite(value) && (!latest || year > latest.year)) {
      latest = { value, year };
    }
  }
  return latest;
}

export function formatRegionalValue(
  value: number,
  metric: RegionalMetricMeta,
  lang: Lang = 'es',
  compact = false,
): string {
  const options: Intl.NumberFormatOptions = metric.format === 'currency'
    ? {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: metric.id === 'gdpTotalUsd' ? 1 : 0,
        notation: compact || metric.id === 'gdpTotalUsd' ? 'compact' : 'standard',
      }
    : {
        maximumFractionDigits: 0,
        notation: compact ? 'compact' : 'standard',
      };
  return new Intl.NumberFormat(LOCALES[lang], options).format(value);
}

export function regionalTrendMetric(metric: RegionalMetricMeta): MetricMeta {
  return {
    id: metric.id,
    label: metric.label.es,
    labelEn: metric.label.es,
    shortLabel: metric.shortLabel.es,
    shortLabelEn: metric.shortLabel.es,
    unit: metric.unit.es,
    unitEn: metric.unit.es,
    description: metric.label.es,
    descriptionEn: metric.label.es,
    domain: metric.id === 'population' ? 'demographics' : 'economy',
    format: metric.format,
    higherIsBetter: metric.id === 'population' ? null : true,
    source: {
      name: 'DOSE v2.11',
      url: 'https://doi.org/10.5281/zenodo.16313760',
      license: 'Official Data',
    },
    indicatorCode: metric.id,
  };
}
