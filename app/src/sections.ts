// What each section of the app shows. One table, so it is easy to read which controls,
// layers and metrics belong where.

export type SectionId = 'riesgo' | 'economia' | 'comercio' | 'mercados' | 'pais' | 'actualidad';

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
  icon: string;
  defaultMetric: string;
  /** Where the map flies on entering, [minLng, minLat, maxLng, maxLat]; whole world if absent. */
  view?: [number, number, number, number];
  /** Metric groups offered in the picker (see displayDomain); empty = no picker. */
  domains: string[];
  controls: Control[];
  layers: Layers;
}

const NO_LAYERS: Layers = {
  trade: false, chokepoints: false, routes: false, cables: false,
  markets: false, dayNight: false, webcams: false, news: false,
};

const NON_FINANCE = ['economy', 'social', 'governance', 'health', 'demographics', 'environment', 'infrastructure', 'trade'];

export const SECTIONS: Section[] = [
  {
    id: 'riesgo',
    title: 'Tipos y riesgo soberano',
    tagline: 'Prima de riesgo frente al Bund, tipos oficiales, tipo real y curvas de deuda.',
    intro: 'Cuánto paga cada Estado por financiarse y qué tipos fija su banco central. Datos del BIS, el BCE y Eurostat, verificados contra la fuente.',
    icon: '◎',
    defaultMetric: 'euro_spread_bund',
    view: [-25, 34, 42, 66],
    domains: ['finance'],
    controls: ['search', 'picker', 'legend', 'download', 'ranking'],
    layers: NO_LAYERS,
  },
  {
    id: 'economia',
    title: 'Economía y sociedad',
    tagline: 'PIB, empleo, salud, gobernanza y medio ambiente de cada país, con 20 años de historia.',
    intro: 'Indicadores oficiales del Banco Mundial y el FMI. Cambia a "Evolución" para ver cómo han cambiado desde 2004 o 2014.',
    icon: '▤',
    defaultMetric: 'gdp_per_capita',
    domains: NON_FINANCE,
    controls: ['search', 'picker', 'trend', 'legend', 'download', 'alliances', 'ranking'],
    layers: NO_LAYERS,
  },
  {
    id: 'comercio',
    title: 'Comercio y rutas marítimas',
    tagline: 'Flujos de exportación, pasos marítimos como Suez u Ormuz y cables submarinos.',
    intro: 'Selecciona un país para ver a quién exporta y de quién importa. Pulsa un paso marítimo para ver su tráfico y lo que depende de él.',
    icon: '⚓',
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
    icon: '↗',
    defaultMetric: 'policy_rate',
    domains: [],
    controls: ['legend', 'markets', 'daynight', 'ticker', 'ranking'],
    layers: { ...NO_LAYERS, markets: true, dayNight: true },
  },
  {
    id: 'pais',
    title: 'Explorar un país',
    tagline: 'Toda la información de un país en una ficha: tipos, curva de deuda, economía y comercio.',
    intro: 'Busca un país o púlsalo en el mapa para abrir su ficha completa y descargar sus datos.',
    icon: '⌕',
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
    icon: '◉',
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
