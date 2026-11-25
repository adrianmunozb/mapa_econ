import { createContext, useContext } from 'react';
import type { MetricMeta } from './types';
import { METRICS_ES, bondMetricEs } from './data/metricsEs';

export type Lang = 'es';

export const STORAGE_KEY = 'wem-lang';

export const LOCALES: Record<Lang, string> = { es: 'es-ES' };

export const DOMAIN_LABELS: Record<string, string> = {
  finance: 'Tipos y riesgo soberano',
  economy: 'Economía',
  social: 'Sociedad',
  health: 'Salud',
  demographics: 'Demografía',
  environment: 'Medio ambiente',
  infrastructure: 'Infraestructura',
  trade: 'Comercio',
  governance: 'Gobernanza',
};

export const STRINGS_ES = {
  loading: 'Cargando datos…',
  loadError: 'Error al cargar: {error}',
  brandTitle: 'Meridiano',
  brandSub: 'Riesgo soberano y economía mundial',
  indicator: 'Indicador',
  metricPickerLabel: 'Métrica del mapa',
  viewCurrent: 'Actual',
  viewChange: 'Evolución',
  period: 'Periodo',
  since2004: 'desde 2004 (20 años)',
  since2014: 'desde 2014 (10 años)',
  changeSince: 'Cambio desde {year}',
  hintCurrent: 'más claro = más alto',
  hintChange: 'rojo ↓ · azul ↑',
  tradeFlowsOn: 'Flujos comerciales: activados',
  tradeFlowsOff: 'Flujos comerciales: desactivados',
  arcsHintSelected: 'Arcos ámbar: exportaciones declaradas por el país seleccionado. Arcos violeta: importaciones deducidas de las exportaciones que declaran sus socios.',
  arcsHintNone: 'No hay flujos de exportación ni importaciones declaradas por socios para este país.',
  tradeDirection: 'Dirección del flujo comercial',
  tradeExports: 'Exportaciones',
  tradeImports: 'Importaciones (declaradas por socios)',
  ranking: 'Ranking',
  biggestChange: 'Mayor cambio',
  noData: 'Sin datos',
  countries: 'países',
  rank: 'Puesto',
  compareTitle: 'Comparar países',
  close: 'Cerrar',
  metricCol: 'Métrica',
  compareFooter: 'En verde, el mejor valor de cada fila · la fuente figura en cada métrica',
  noOfficialData: 'No hay datos oficiales para esta zona.',
  inCompare: '✓ En la comparación',
  compareFull: 'Comparación completa (máx. 4)',
  addCompare: '＋ Añadir a la comparación',
  trendOf: 'Evolución · {label}',
  topExportPartners: 'Principales destinos de exportación ({year})',
  goTo: 'Ir a {name}',
  topExportGoods: 'Principales productos exportados ({year})',
  sourcesFooter: 'Fuentes: Banco Mundial · FMI · BIS · BCE · Eurostat · UN Comtrade · oficinas estadísticas',
  compareBar: 'Comparar',
  remove: 'Quitar',
  compareBtn: 'Comparar ({n})',
  clear: 'Vaciar',
  searchLabel: 'Buscar país',
  searchPlaceholder: 'Buscar país…',
  trendAria: 'Evolución de {label}',
  language: 'Idioma',
  regionalMetricPicker: 'Métrica del mapa regional',
  regionalBack: '← Mapa mundial',
  regionalOpen: 'Ver mapa regional · {count} regiones',
  regionalCoverage: 'Datos macro asignados a {matched} de {total} regiones. Las fronteras sin dato aparecen en gris.',
  regionalNoDataCountry: 'Todavía no hay datos macro regionales para este país.',
  regionalNoDataRegion: 'No hay datos macro asignados a esta región.',
  regionalSelectRegion: 'Selecciona una región',
  regionalMacroData: 'Datos macro',
  regionalSourceNote: 'Datos regionales publicados hasta 2020. El PIB total en USD se calcula como PIB per cápita × población.',
  regionalHint: 'PIB y población regionales · valores publicados hasta 2020',
  downloadTitle: 'Descargar datos (CSV)',
  downloadHistory: 'Serie histórica',
  downloadLatest: 'Valores actuales',
  downloadCountry: 'Descargar datos de {name} (CSV)',
  downloadNote: 'CSV en UTF-8 con la fuente y la licencia de cada dato.',
};

export const STRINGS: Record<Lang, typeof STRINGS_ES> = { es: STRINGS_ES };

export type Strings = typeof STRINGS_ES;

/** Simple {placeholder} interpolation. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

const es = (m: MetricMeta) => METRICS_ES[m.id] ?? bondMetricEs(m.id);

/** Spanish label for a metric (falls back to the English one from the data file). */
export function metricLabel(m: MetricMeta, _lang?: Lang): string {
  return es(m)?.[0] ?? m.labelEn ?? m.label;
}
export function metricShortLabel(m: MetricMeta, _lang?: Lang): string {
  return es(m)?.[1] ?? m.shortLabelEn ?? m.labelEn ?? m.label;
}
export function metricUnit(m: MetricMeta, _lang?: Lang): string {
  return es(m)?.[2] ?? m.unitEn ?? m.unit;
}
export function metricDescription(m: MetricMeta, _lang?: Lang): string {
  return es(m)?.[3] ?? m.descriptionEn ?? m.description;
}

/** Interest rates, inflation and sovereign risk form their own group, shown first. */
const FINANCE_IDS = new Set(['inflation', 'policy_rate', 'real_policy_rate', 'euro_spread_bund']);
export function displayDomain(m: Pick<MetricMeta, 'id' | 'domain'>): string {
  return FINANCE_IDS.has(m.id) || m.id.startsWith('bond_yield_') ? 'finance' : m.domain;
}

/** Domains in first-appearance order, with "Tipos y riesgo soberano" always first. */
export function orderedDomains(metrics: Pick<MetricMeta, 'id' | 'domain'>[]): string[] {
  const domains: string[] = [];
  for (const m of metrics) {
    const d = displayDomain(m);
    if (!domains.includes(d)) domains.push(d);
  }
  return domains.sort((a, b) => Number(b === 'finance') - Number(a === 'finance'));
}

export function domainLabel(domain: string, _lang?: Lang): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

/** Format data periods for display: every ISO month ("2026-05") becomes "may 2026";
 *  full dates ("2026-10-19") are left as they are. */
export function tPeriod(period: string | undefined, lang: Lang): string | undefined {
  if (!period) return period;
  return period.replace(/\b(\d{4})-(\d{2})\b(?!-\d)/g, (_, y: string, mo: string) => {
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, 1));
    return new Intl.DateTimeFormat(LOCALES[lang], { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  });
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
