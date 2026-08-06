// Canonical data model for the World Economic Map.
// The Python pipeline emits a Snapshot that matches these types exactly,
// so the frontend can consume data/snapshot.json with full type safety.

/** Where a number comes from — shown in the UI so every value is traceable. */
export interface SourceRef {
  name: string; // e.g. "World Bank Open Data"
  url: string; // link to the dataset / indicator page
  license: string; // e.g. "CC BY 4.0"
}

export type MetricDomain =
  | 'economy'
  | 'health'
  | 'social'
  | 'demographics'
  | 'environment'
  | 'infrastructure'
  | 'trade';

export type MetricFormat = 'currency' | 'number' | 'percent' | 'years' | 'index';

/** Describes one selectable metric (e.g. "GDP per capita"). */
export interface MetricMeta {
  id: string; // stable slug, e.g. "gdp_per_capita"
  label: string; // human label (German); English is the default language
  labelEn?: string; // English label
  shortLabel?: string;
  shortLabelEn?: string;
  unit: string; // e.g. "US$", "Jahre", "%"
  unitEn?: string; // English unit
  description: string;
  descriptionEn?: string; // English description
  domain: MetricDomain;
  format: MetricFormat;
  /** true = high is "good", false = low is "good", null = neutral. Drives color scales. */
  higherIsBetter: boolean | null;
  source: SourceRef;
  indicatorCode: string; // provider-specific code, e.g. "NY.GDP.PCAP.CD"
}

/** A single observed value for one country & one metric. */
export interface MetricValue {
  value: number;
  year: number; // the year this value is from (latest available)
  period?: string; // precise period for sub-annual data, e.g. "Apr 2026"
}

/** All data for one country. */
export interface CountryData {
  iso3: string; // canonical ISO 3166-1 alpha-3, the join key against the map geometry
  iso2?: string;
  name: string;
  region?: string;
  incomeGroup?: string;
  /** metricId -> value. Missing metrics are simply absent. */
  metrics: Record<string, MetricValue>;
}

/** The whole dataset, loaded once by the frontend. */
export interface Snapshot {
  generatedAt: string; // ISO timestamp
  sources: SourceRef[];
  metrics: MetricMeta[];
  countries: CountryData[];
}

/** One export partner: { p: partner ISO3, v: value in USD }. */
export interface TradePartner {
  p: string;
  v: number;
}

/** A reporter country's top export partners (from IMF IMTS). */
export interface TradeFlow {
  total: number; // total exports to the world, USD
  year: number;
  partners: TradePartner[]; // sorted descending by value
}

/** Bilateral trade snapshot, keyed by reporter ISO3. */
export interface TradeData {
  generatedAt: string;
  year: number;
  source: SourceRef;
  flows: Record<string, TradeFlow>;
}

/** Yearly history: data[iso3][metricId][year] = value (sparse). */
export interface TimeseriesData {
  startYear: number;
  endYear: number;
  source: SourceRef;
  data: Record<string, Record<string, Record<string, number>>>;
}

/** One exported product category: { c: HS2 code, v: value in USD }. */
export interface ProductShare {
  c: string;
  v: number;
}

/** A country's top export goods (UN Comtrade, HS2 chapters). */
export interface ProductEntry {
  year: number;
  total: number;
  products: ProductShare[];
}

/** Export product composition per country, with HS2 code → name lookup. */
export interface TradeProductsData {
  source: SourceRef;
  names: Record<string, string>;
  namesEn?: Record<string, string>; // English HS2 names
  data: Record<string, ProductEntry>;
}
