// What each section of the app shows. One table, so it is easy to read which controls,
// layers and metrics belong where.

export type SectionId = 'mapa' | 'riesgo' | 'economia' | 'comercio' | 'mercados' | 'pais' | 'actualidad';

/** Controls that a section can show in its side panel. */
export type Control =
  | 'search' | 'picker' | 'trend' | 'legend' | 'download' | 'alliances' | 'ranking'
  | 'trade' | 'maritime' | 'cables' | 'markets' | 'daynight' | 'ticker' | 'news' | 'webcams';

export interface Layers {
  trade: boolean;
  chokepoints: boolean;
  routes: boolean;
  cables: boolean;
  markets: boolean;
  dayNight: boolean;
  webcams: boolean;
  news: boolean;
}

export interface Section {
  id: SectionId;
  title: string;
  /** One line for the landing card. */
  tagline: string;
  /** Short explanation shown at the top of the section panel. */
  intro: string;
  defaultMetric: string;
  /** Metrics offered as one-tap buttons; the rest stay in "Más indicadores". */
  keyMetrics?: string[];
  /** Metrics grouped by theme (first metric opens the theme); replaces the picker. */
  themes?: { label: string; metrics: string[] }[];
  /** 'change' opens on the trend since 2004 instead of the latest value. */
  defaultView?: 'current' | 'change';
  /** Where the map flies on entering, [minLng, minLat, maxLng, maxLat]; whole world if absent. */
  view?: [number, number, number, number];
  /** Metric groups offered in the picker (see displayDomain); empty = no picker. */
  domains: string[];
  controls: Control[];
  layers: Layers;
  /** Reached from the globe rather than from a landing card. */
  noCard?: boolean;
  /** Only on the landing page, not in the map's top bar. */
  noTopBar?: boolean;
}

const NO_LAYERS: Layers = {
  trade: false, chokepoints: false, routes: false, cables: false,
  markets: false, dayNight: false, webcams: false, news: false,
};

const NON_FINANCE = ['economy', 'social', 'governance', 'health', 'demographics', 'environment', 'infrastructure', 'trade'];

export const SECTIONS: Section[] = [
  {
    id: 'mapa',
    title: 'Mapa mundial',
    tagline: 'Todos los indicadores en un solo mapa del mundo.',
    intro: 'El explorador completo: cualquier indicador, de la prima de riesgo al PIB, con su último dato para todos los países.',
    defaultMetric: 'gdp_per_capita',
    keyMetrics: ['gdp_per_capita', 'euro_spread_bund', 'policy_rate', 'inflation', 'unemployment', 'population'],
    domains: ['finance', ...NON_FINANCE],
    controls: ['search', 'picker', 'trend', 'legend', 'download', 'ranking'],
    layers: NO_LAYERS,
    noCard: true,
  },
  {
    id: 'riesgo',
    title: 'Tipos y riesgo soberano',
    tagline: 'Prima de riesgo frente al Bund, tipos oficiales, tipo real y curvas de deuda.',
    intro: 'Cuánto paga cada Estado por financiarse y qué tipos fija su banco central. Datos del BIS, el BCE y Eurostat, verificados contra la fuente.',
    defaultMetric: 'euro_spread_bund',
    keyMetrics: ['euro_spread_bund', 'policy_rate', 'real_policy_rate', 'bond_yield_120m', 'inflation'],
    view: [-25, 34, 42, 66],
    domains: ['finance'],
    controls: ['search', 'picker', 'legend', 'download', 'ranking'],
    layers: NO_LAYERS,
  },
  {
    id: 'economia',
    title: 'Economía y sociedad',
    tagline: 'Por temas: crecimiento, empleo, desigualdad, salud, gobernanza y clima, y cómo han cambiado desde 2004.',
    intro: 'Elige un tema y un indicador. El mapa muestra cuánto ha cambiado cada país desde 2004 (o 2014); pulsa «Actual» para ver el último dato.',
    defaultMetric: 'gdp_per_capita',
    defaultView: 'change',
    themes: [
      { label: 'Crecimiento y renta', metrics: ['gdp_per_capita', 'gdp_per_capita_ppp', 'gdp_growth', 'gni_per_capita', 'gdp_total', 'capital_formation_gdp'] },
      { label: 'Empleo', metrics: ['unemployment', 'youth_unemployment', 'labor_participation'] },
      { label: 'Desigualdad y educación', metrics: ['gini', 'poverty', 'literacy', 'secondary_enrollment', 'education_expenditure'] },
      { label: 'Salud y población', metrics: ['life_expectancy', 'infant_mortality', 'health_expenditure_gdp', 'fertility', 'population_65plus', 'population_growth'] },
      { label: 'Gobernanza', metrics: ['control_of_corruption', 'rule_of_law', 'government_effectiveness', 'regulatory_quality', 'political_stability', 'voice_accountability'] },
      { label: 'Clima y energía', metrics: ['co2_per_capita', 'renewable_energy', 'energy_use_per_capita', 'pm25', 'forest_area'] },
      { label: 'Estructura y comercio', metrics: ['exports_gdp', 'imports_gdp', 'fdi_inflows_gdp', 'tax_revenue_gdp', 'services_gdp', 'industry_gdp', 'rd_expenditure'] },
    ],
    domains: [],
    controls: ['trend', 'legend', 'download', 'alliances', 'ranking'],
    layers: NO_LAYERS,
  },
  {
    id: 'comercio',
    title: 'Comercio y rutas',
    tagline: 'Flujos de exportación, pasos marítimos como Suez u Ormuz y cables submarinos.',
    intro: 'Selecciona un país para ver a quién exporta y de quién importa. Pulsa un paso marítimo para ver su tráfico y lo que depende de él.',
    defaultMetric: 'exports_gdp',
    domains: [],
    controls: ['search', 'legend', 'trade', 'maritime', 'cables', 'ranking'],
    layers: { ...NO_LAYERS, trade: true, chokepoints: true, routes: true },
  },
  {
    id: 'mercados',
    title: 'Mercados y bolsas',
    tagline: 'Las grandes bolsas del mundo, abiertas o cerradas ahora mismo, y el ciclo día/noche.',
    intro: 'Horario en vivo de las principales bolsas y tipo oficial de cada banco central en el mapa.',
    defaultMetric: 'policy_rate',
    domains: [],
    controls: ['legend', 'markets', 'daynight', 'ticker', 'ranking'],
    layers: { ...NO_LAYERS, markets: true, dayNight: true },
  },
  {
    id: 'pais',
    title: 'Explorar un país',
    noTopBar: true,
    tagline: 'Toda la información de un país en una ficha: tipos, curva de deuda, economía y comercio.',
    intro: 'Busca un país o púlsalo en el mapa para abrir su ficha completa y descargar sus datos.',
    defaultMetric: 'gdp_per_capita',
    domains: [],
    controls: ['search'],
    layers: NO_LAYERS,
  },
  {
    id: 'actualidad',
    title: 'Actualidad',
    tagline: 'Noticias georreferenciadas por país y cámaras en directo de todo el mundo.',
    intro: 'Titulares de agencias agrupados por país y tema, y cámaras públicas en directo.',
    defaultMetric: 'gdp_per_capita',
    domains: [],
    controls: ['news', 'webcams'],
    layers: { ...NO_LAYERS, news: true },
  },
];

export const SECTION_BY_ID = new Map(SECTIONS.map(s => [s.id, s]));

export const isSectionId = (value: string | null | undefined): value is SectionId =>
  !!value && SECTION_BY_ID.has(value as SectionId);

export const shows = (section: Section, control: Control) => section.controls.includes(control);

/** The section an old or shared link without ``s=`` belongs to. */
export function sectionForLink(metricId: string | null, tradeOn: boolean, financeIds: (id: string) => boolean): SectionId {
  if (tradeOn) return 'comercio';
  if (metricId && financeIds(metricId)) return 'riesgo';
  return 'economia';
}
