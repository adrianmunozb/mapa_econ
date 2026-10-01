import { createContext, useContext } from 'react';
import type { MetricMeta } from './types';

export type Lang = 'en' | 'de';

export const STORAGE_KEY = 'wem-lang';

export const LOCALES: Record<Lang, string> = { en: 'en-US', de: 'de-DE' };

export const DOMAIN_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    economy: 'Economy',
    social: 'Society',
    health: 'Health',
    demographics: 'Demographics',
    environment: 'Environment',
    infrastructure: 'Infrastructure',
    trade: 'Trade',
  },
  de: {
    economy: 'Wirtschaft',
    social: 'Soziales',
    health: 'Gesundheit',
    demographics: 'Demografie',
    environment: 'Umwelt',
    infrastructure: 'Infrastruktur',
    trade: 'Handel',
  },
};

// German month abbreviations (used in the data files) → English.
const EN_MONTHS: Record<string, string> = {
  Jan: 'Jan', Feb: 'Feb', Mär: 'Mar', Apr: 'Apr', Mai: 'May', Jun: 'Jun',
  Jul: 'Jul', Aug: 'Aug', Sep: 'Sep', Okt: 'Oct', Nov: 'Nov', Dez: 'Dec',
};

const STRINGS_EN = {
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
  arcsHintSelected: 'Arcs show exports of the selected country.',
  arcsHintNone: 'Select a country → top export partners shown as arcs.',
  ranking: 'Ranking',
  biggestChange: 'Biggest change',
  noData: 'No data',
  countries: 'countries',
  rank: 'Rank',
  compareTitle: 'Compare countries',
  close: 'Close',
  metricCol: 'Metric',
  compareFooter: 'Best value per row highlighted in green · Source: World Bank Open Data (CC BY 4.0)',
  noOfficialData: 'No official data available for this area.',
  inCompare: '✓ In comparison',
  compareFull: 'Comparison full (max 4)',
  addCompare: '＋ Add to comparison',
  trendOf: 'Trend · {label}',
  topExportPartners: 'Top export partners ({year})',
  goTo: 'Go to {name}',
  topExportGoods: 'Top export goods ({year})',
  sourcesFooter: 'Sources: World Bank · IMF · BIS · UN Comtrade · regional data: DOSE · regional boundaries: geoBoundaries · countries: Natural Earth',
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
  regionalSourceNote: 'Reported data · DOSE v2.11 · up to 2020. Years vary by region. USD GDP totals are calculated from reported GDP per capita × population. Boundaries: geoBoundaries (CC BY 4.0).',
  regionalHint: 'Regional GDP and population · reported values through 2020',
};

const STRINGS_DE: typeof STRINGS_EN = {
  loading: 'Daten werden geladen …',
  loadError: 'Fehler beim Laden: {error}',
  brandSub: 'Länderindikatoren & gemeldete Regionaldaten · jede Zahl mit Quelle',
  metricPickerLabel: 'Kennzahl (Heatmap)',
  viewCurrent: 'Aktuell',
  viewChange: 'Entwicklung',
  period: 'Zeitraum',
  since2004: 'seit 2004 (20 Jahre)',
  since2014: 'seit 2014 (10 Jahre)',
  changeSince: 'Veränderung seit {year}',
  hintCurrent: 'heller = höher',
  hintChange: 'rot ↓ · blau ↑',
  tradeFlowsOn: '🔗 Handelsströme an',
  tradeFlowsOff: '🔗 Handelsströme aus',
  arcsHintSelected: 'Bögen zeigen Exporte des gewählten Landes.',
  arcsHintNone: 'Land wählen → Top-Exportpartner als Bögen.',
  ranking: 'Rangliste',
  biggestChange: 'Größte Veränderung',
  noData: 'keine Daten',
  countries: 'Länder',
  rank: 'Platz',
  compareTitle: 'Ländervergleich',
  close: 'Schließen',
  metricCol: 'Kennzahl',
  compareFooter: 'Bester Wert je Zeile grün hervorgehoben · Quelle: World Bank Open Data (CC BY 4.0)',
  noOfficialData: 'Für dieses Gebiet liegen keine offiziellen Daten vor.',
  inCompare: '✓ Im Vergleich',
  compareFull: 'Vergleich voll (max. 4)',
  addCompare: '＋ Zum Vergleich hinzufügen',
  trendOf: 'Entwicklung · {label}',
  topExportPartners: 'Top-Exportpartner ({year})',
  goTo: 'Zu {name}',
  topExportGoods: 'Top-Exportgüter ({year})',
  sourcesFooter: 'Quellen: World Bank · IMF · BIS · UN Comtrade · Regionaldaten: DOSE · Regionsgrenzen: geoBoundaries · Länder: Natural Earth',
  compareBar: 'Vergleich',
  remove: 'Entfernen',
  compareBtn: 'Vergleichen ({n})',
  clear: 'Leeren',
  searchPlaceholder: '🔍  Land suchen …',
  trendAria: 'Verlauf {label}',
  language: 'Sprache',
  regionalMetricPicker: 'Kennzahl der Regionskarte',
  regionalBack: '← Weltkarte',
  regionalOpen: 'Regionskarte öffnen · {count} Regionen',
  regionalCoverage: 'Makrodaten für {matched} von {total} gemeldeten Regionen zugeordnet. Nicht zugeordnete Gebiete sind grau.',
  regionalNoDataCountry: 'Für dieses Land liegen noch keine regionalen Makrodaten vor.',
  regionalNoDataRegion: 'Dieser Gebietsgrenze konnten keine Makrodaten zugeordnet werden.',
  regionalSelectRegion: 'Region auswählen',
  regionalMacroData: 'Makrodaten',
  regionalSourceNote: 'Gemeldete Daten · DOSE v2.11 · bis 2020. Die Jahre variieren nach Region. USD-BIP-Gesamtwerte werden aus gemeldetem BIP pro Kopf × Bevölkerung berechnet. Grenzen: geoBoundaries (CC BY 4.0).',
  regionalHint: 'Regionales BIP und Bevölkerung · gemeldete Werte bis 2020',
};

export const STRINGS: Record<Lang, typeof STRINGS_EN> = { en: STRINGS_EN, de: STRINGS_DE };

export type Strings = typeof STRINGS_EN;

/** Simple {placeholder} interpolation. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** English (default) or German label for a metric. */
export function metricLabel(m: MetricMeta, lang: Lang): string {
  return lang === 'de' ? m.label : (m.labelEn ?? m.label);
}
export function metricShortLabel(m: MetricMeta, lang: Lang): string {
  return lang === 'de' ? (m.shortLabel ?? m.label) : (m.shortLabelEn ?? m.labelEn ?? m.label);
}
export function metricUnit(m: MetricMeta, lang: Lang): string {
  return lang === 'de' ? m.unit : (m.unitEn ?? m.unit);
}
export function metricDescription(m: MetricMeta, lang: Lang): string {
  return lang === 'de' ? m.description : (m.descriptionEn ?? m.description);
}

export function domainLabel(domain: string, lang: Lang): string {
  return DOMAIN_LABELS[lang][domain] ?? domain;
}

/** Translate German month abbreviations in data periods ("Mär 2026" → "Mar 2026"). */
export function tPeriod(period: string | undefined, lang: Lang): string | undefined {
  if (!period || lang === 'de') return period;
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
