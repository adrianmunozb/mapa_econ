import { createContext, useContext } from 'react';
import type { MetricMeta } from './types';

export type Lang = 'en';

export const STORAGE_KEY = 'wem-lang';

export const LOCALES: Record<Lang, string> = { en: 'en-US' };

export const DOMAIN_LABELS: Record<string, string> = {
  economy: 'Economy',
  social: 'Society',
  health: 'Health',
  demographics: 'Demographics',
  environment: 'Environment',
  infrastructure: 'Infrastructure',
  trade: 'Trade',
};

// German month abbreviations (used in some legacy data fields) → English.
const EN_MONTHS: Record<string, string> = {
  Jan: 'Jan', Feb: 'Feb', Mär: 'Mar', Apr: 'Apr', Mai: 'May', Jun: 'Jun',
  Jul: 'Jul', Aug: 'Aug', Sep: 'Sep', Okt: 'Oct', Nov: 'Nov', Dez: 'Dec',
};

export const STRINGS_EN = {
  loading: 'Loading data …',
  loadError: 'Error loading: {error}',
  brandSub: 'Country indicators & reported regional data · every number with its source',
  metricPickerLabel: 'Metric (heatmap)',
  viewCurrent: 'Current',
  viewChange: 'Trend',
  period: 'Period',
  since2004: 'since 2004 (20 years)',
  since2014: 'since 2014 (10 years)',
  changeSince: 'Change since {year}',
  hintCurrent: 'lighter = higher',
  hintChange: 'red ↓ · blue ↑',
  tradeFlowsOn: '🔗 Trade flows on',
  tradeFlowsOff: '🔗 Trade flows off',
  arcsHintSelected: 'Amber arcs: exports reported by the selected country. Violet arcs: imports inferred from partners’ reported exports.',
  arcsHintNone: 'No export or partner-reported import flows are available for this country.',
  tradeDirection: 'Trade flow direction',
  tradeExports: 'Exports',
  tradeImports: 'Imports (partner-reported)',
  ranking: 'Ranking',
  biggestChange: 'Biggest change',
  noData: 'No data',
  countries: 'countries',
  rank: 'Rank',
  compareTitle: 'Compare countries',
  close: 'Close',
  metricCol: 'Metric',
  compareFooter: 'Best value per row highlighted in green · Source: World Bank',
  noOfficialData: 'No official data available for this area.',
  inCompare: '✓ In comparison',
  compareFull: 'Comparison full (max 4)',
  addCompare: '＋ Add to comparison',
  trendOf: 'Trend · {label}',
  topExportPartners: 'Top export partners ({year})',
  goTo: 'Go to {name}',
  topExportGoods: 'Top export goods ({year})',
  sourcesFooter: 'Sources: World Bank · IMF · BIS · UN Comtrade · Regional & National Statistical Offices',
  compareBar: 'Compare',
  remove: 'Remove',
  compareBtn: 'Compare ({n})',
  clear: 'Clear',
  searchPlaceholder: '🔍  Search countries …',
  trendAria: 'Trend of {label}',
  language: 'Language',
  regionalMetricPicker: 'Regional map metric',
  regionalBack: '← World map',
  regionalOpen: 'Explore regional map · {count} regions',
  regionalCoverage: 'Macro data matched for {matched} of {total} reported regions. Unmatched boundaries are grey.',
  regionalNoDataCountry: 'Regional macro data are not available for this country yet.',
  regionalNoDataRegion: 'No macro data have been matched to this boundary.',
  regionalSelectRegion: 'Select a region',
  regionalMacroData: 'Macro data',
  regionalSourceNote: 'Reported regional data up to 2020. USD GDP totals calculated from reported GDP per capita × population.',
  regionalHint: 'Regional GDP and population · reported values through 2020',
};

export const STRINGS: Record<Lang, typeof STRINGS_EN> = { en: STRINGS_EN };

export type Strings = typeof STRINGS_EN;

/** Simple {placeholder} interpolation. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** English label for a metric. */
export function metricLabel(m: MetricMeta, _lang?: Lang): string {
  return m.labelEn ?? m.label;
}
export function metricShortLabel(m: MetricMeta, _lang?: Lang): string {
  return m.shortLabelEn ?? m.labelEn ?? m.label;
}
export function metricUnit(m: MetricMeta, _lang?: Lang): string {
  return m.unitEn ?? m.unit;
}
export function metricDescription(m: MetricMeta, _lang?: Lang): string {
  return m.descriptionEn ?? m.description;
}

export function domainLabel(domain: string, _lang?: Lang): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

/** Translate German month abbreviations in data periods ("Mär 2026" → "Mar 2026"). */
export function tPeriod(period: string | undefined, _lang?: Lang): string | undefined {
  if (!period) return period;
  return period.replace(/^(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)\b/, (m) => EN_MONTHS[m] ?? m);
}

export interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}

export const LangContext = createContext<LangContextValue | null>(null);

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LangProvider');
  return ctx;
}
