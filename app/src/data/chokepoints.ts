export type Position = [number, number];
export interface MaritimeMetric {
  label: string;
  value: number;
  unit: string;
  scope: string;
  period: string;
  source: string;
  sourceUrl: string;
  estimated: boolean;
}
export interface MaritimeRoute {
  name: string;
  kind: 'principal' | 'alternativa';
  points: Position[];
}
export interface MaritimeChokepoint {
  id: string;
  name: string;
  location: string;
  coordinates: Position;
  kind: 'Estrecho' | 'Canal' | 'Ruta alternativa';
  importance: 'Muy alta' | 'Alta';
  importanceReason: string;
  threats: string[];
  description: string;
  geography: string;
  goods: string[];
  exposure: string;
  alternative: string;
  metrics: MaritimeMetric[];
  sources: { name: string; url: string }[];
  routes: MaritimeRoute[];
}

export const MARITIME_REVIEW_DATE = '2026-10-20';
export const EIA_URL = 'https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints';
const PW_URL = 'https://portwatch.imf.org/';
const CSIS_URL = 'https://www.csis.org/analysis/south-china-sea-trade-chokepoints';
const SUEZ_URL = 'https://www.suezcanal.gov.eg/English/Downloads/DownloadsDocLibrary/Navigation%20Reports/Annual%20Reports%E2%80%8B%E2%80%8B%E2%80%8B/2025.pdf';
const PANAMA_URL = 'https://pancanal.com/en/panama-canal-maintains-operational-and-financial-strength/';
const oil = (value: number, scope: string): MaritimeMetric => ({
  label: 'Petróleo y otros líquidos', value, unit: 'millones de barriles/día', scope,
  period: '1.er semestre de 2025', source: 'EIA · tabla 1, revisión 03/03/2026', sourceUrl: EIA_URL, estimated: true,
});
const vessels = (value: number, period: string, sourceUrl: string, scope: string): MaritimeMetric => ({
  label: 'Tránsitos anuales', value, unit: 'buques', scope, period,
  source: sourceUrl === SUEZ_URL ? 'Autoridad del Canal de Suez' : 'Autoridad del Canal de Panamá · resultados preliminares',
  sourceUrl, estimated: false,
});
// Hand-drawn corridor waypoints: illustrative geography, never vessel tracks or routing instructions.
const asia: Position[] = [[103.8, 1.2], [99, 5.5], [93, 6], [80, 5], [65, 10], [52, 12], [43.35, 12.58], [40, 18], [37, 23], [34.5, 27], [32.55, 29.9], [32.34, 30.5], [32.3, 31.3], [28, 34], [20, 35], [13, 36], [11, 38], [5, 38], [-5.6, 35.95]];
const cape: Position[] = [[103.8, 1.2], [95, 5], [80, 4], [65, -5], [52, -22], [48, -28], [38, -34], [25, -36], [18.47, -35], [10, -30], [0, -10], [-20, 10], [-20, 28], [-10, 35], [-5.6, 35.95]];
const redSeaRoutes: MaritimeRoute[] = [
  { name: 'Singapur–Mediterráneo por Mar Rojo y Suez', kind: 'principal', points: asia },
  { name: 'Desvío por el sur de África', kind: 'alternativa', points: cape },
];
const sources = [{ name: 'EIA · pasos petroleros y alternativas', url: EIA_URL }, { name: 'IMF PortWatch · tráfico y metodología', url: PW_URL }];

export const CHOKEPOINTS: MaritimeChokepoint[] = [
  {
    id: 'hormuz', name: 'Estrecho de Ormuz', location: 'Golfo Pérsico', coordinates: [56.4, 26.6], kind: 'Estrecho',
    importance: 'Muy alta', importanceReason: 'Gran volumen energético y capacidad limitada de sustitución.',
    threats: ['Conflicto', 'Interrupción de navegación'], geography: 'Costas de Irán y Omán',
    description: 'Conecta los exportadores del golfo con el océano Índico. La capacidad de los oleoductos alternativos solo sustituye parte de los flujos marítimos.',
    goods: ['Petróleo', 'Productos refinados', 'GNL'], exposure: 'Exportadores del golfo y compradores asiáticos. Dependencia energética documentada por la EIA; no equivale a toda su relación comercial.',
    alternative: 'Oleoductos hacia el mar Rojo y Fujairah; capacidad y acceso limitados. No hay un desvío marítimo equivalente desde el interior del golfo.',
    metrics: [oil(20.9, 'Flujos que atraviesan Ormuz; volumen, no porcentaje del comercio mundial.')], sources,
    routes: [{ name: 'Golfo Pérsico–océano Índico', kind: 'principal', points: [[51.5, 26], [52, 26.7], [54, 26.7], [56.4, 26.6], [57.2, 25.5], [60, 24], [65, 20], [72, 15]] }],
  },
  {
    id: 'malacca', name: 'Estrecho de Malaca', location: 'Sudeste asiático', coordinates: [101.5, 2.5], kind: 'Estrecho',
    importance: 'Muy alta', importanceReason: 'Concentración de flujos entre el Índico y Asia oriental.',
    threats: ['Piratería', 'Congestión', 'Interrupción de navegación'], geography: 'Malasia, Indonesia y Singapur',
    description: 'Enlaza el océano Índico con el mar de China Meridional y las cadenas de suministro de Asia oriental.',
    goods: ['Petróleo', 'GNL', 'Contenedores'], exposure: 'Según CSIS, en 2024 atravesaron Malaca el 21% de las importaciones y el 14% de las exportaciones chinas (valor del comercio total). Son estimaciones, no mediciones aduaneras del paso.',
    alternative: 'Estrechos de Sunda o Lombok; el desvío depende del calado, origen y destino.',
    metrics: [oil(23.2, 'Tránsito petrolero de Malaca, incluidos crudo y productos.')], sources: [...sources, { name: 'CSIS · exposición comercial estimada, 2024', url: CSIS_URL }],
    routes: [
      { name: 'Índico–Singapur por Malaca', kind: 'principal', points: [[80, 5], [93, 6], [99, 5.5], [101.5, 2.5], [103.8, 1.2], [108, 5], [114, 12]] },
      { name: 'Alternativa por Lombok y Makassar', kind: 'alternativa', points: [[80, 5], [95, -6], [105, -12], [115.8, -9], [115.8, -8.4], [117, -6], [118, -4], [119, -1], [120, 2], [122, 4], [120, 10], [114, 12]] },
    ],
  },
  {
    id: 'suez', name: 'Canal de Suez', location: 'Egipto', coordinates: [32.34, 30.5], kind: 'Canal',
    importance: 'Muy alta', importanceReason: 'Acorta el corredor marítimo Asia–Europa.',
    threats: ['Conflicto en rutas de acceso', 'Encallamiento', 'Congestión'], geography: 'Administración: Autoridad del Canal de Suez, Egipto',
    description: 'Une el Mediterráneo con el mar Rojo. Su utilización también depende de la seguridad en Bab el-Mandeb.',
    goods: ['Contenedores', 'Petróleo', 'Graneles'], exposure: 'Corredor Asia–Europa y tráficos energéticos. Una carga puede pasar por Suez y Bab el-Mandeb: sus volúmenes no deben sumarse.',
    alternative: 'Circunnavegación de África. El tiempo adicional depende de los puertos y de la velocidad del buque.',
    metrics: [vessels(12758, 'Año natural 2025', SUEZ_URL, 'Buques en el canal; no incluye el oleoducto SUMED.')], sources: [{ name: 'SCA · estadísticas anuales 2025', url: SUEZ_URL }, ...sources], routes: redSeaRoutes,
  },
  {
    id: 'mandeb', name: 'Estrecho de Bab el-Mandeb', location: 'Acceso al mar Rojo', coordinates: [43.35, 12.58], kind: 'Estrecho',
    importance: 'Muy alta', importanceReason: 'Acceso meridional al corredor del mar Rojo y Suez.',
    threats: ['Ataques a buques', 'Conflicto', 'Desvíos preventivos'], geography: 'Costas de Yemen, Yibuti y Eritrea',
    description: 'Conecta el golfo de Adén con el mar Rojo. Las interrupciones afectan al corredor completo, incluso si Suez sigue disponible.',
    goods: ['Petróleo', 'Contenedores', 'Graneles'], exposure: 'Flujos Asia–Europa y energía del mar Rojo. Comparte cargas con Suez; no sumar ambos pasos.',
    alternative: 'Ruta por el sur de África para viajes intercontinentales; no sustituye el acceso a los puertos del mar Rojo.',
    metrics: [oil(4.2, 'Tránsito petrolero por Bab el-Mandeb; no sumar con Suez.')], sources, routes: redSeaRoutes,
  },
  {
    id: 'panama', name: 'Canal de Panamá', location: 'Panamá', coordinates: [-79.91, 9.11], kind: 'Canal',
    importance: 'Alta', importanceReason: 'Atajo entre el Atlántico y el Pacífico con capacidad condicionada por el agua.',
    threats: ['Sequía', 'Restricciones de calado', 'Congestión'], geography: 'Administración: Autoridad del Canal de Panamá',
    description: 'Conecta los dos océanos mediante esclusas. El agua disponible y el tamaño del buque condicionan la capacidad de tránsito.',
    goods: ['Contenedores', 'Granos', 'GLP y GNL'], exposure: 'Tráficos entre América y Asia; la exposición varía según costa, mercancía y dimensiones del buque.',
    alternative: 'Desvío por el cabo de Hornos, Suez u opciones intermodales según origen y destino. No todas las alternativas admiten la misma carga.',
    metrics: [vessels(13404, 'Año fiscal 2025', PANAMA_URL, 'Tránsitos totales; año fiscal, no año natural.')], sources: [{ name: 'ACP · resultados AF2025', url: PANAMA_URL }, ...sources],
    routes: [
      { name: 'Caribe–Pacífico por Panamá', kind: 'principal', points: [[-75, 20], [-78, 12], [-79.91, 9.35], [-79.8, 9.15], [-79.6, 8.9], [-80, 7], [-85, 5], [-100, 10]] },
      { name: 'Alternativa por cabo de Hornos', kind: 'alternativa', points: [[-75, 20], [-68, 16], [-55, 10], [-34, -5], [-38, -20], [-50, -40], [-62, -53], [-68, -57], [-76, -55], [-80, -35], [-85, -10], [-100, 10]] },
    ],
  },
  {
    id: 'bosporus', name: 'Estrechos turcos', location: 'Bósforo y Dardanelos', coordinates: [29.04, 41.05], kind: 'Estrecho',
    importance: 'Alta', importanceReason: 'Salida marítima del mar Negro al Mediterráneo.',
    threats: ['Accidentes', 'Congestión', 'Conflicto regional'], geography: 'Turquía · régimen de navegación de los estrechos',
    description: 'Dos pasos conectados por el mar de Mármara. Los datos del Bósforo y los Dardanelos no son intercambiables.',
    goods: ['Petróleo', 'Cereales', 'Productos refinados'], exposure: 'Puertos del mar Negro y consumidores mediterráneos. La ficha de tráfico diario corresponde al Bósforo.',
    alternative: 'No existe un desvío marítimo directo desde el mar Negro. Ferrocarril y oleoductos solo sustituyen determinados tráficos.',
    metrics: [oil(3.7, 'Dardanelos; no es la cifra del Bósforo (3,3 millones b/d).')], sources,
    routes: [{ name: 'Mar Negro–Mediterráneo', kind: 'principal', points: [[32, 43], [29.2, 41.25], [29.04, 41.05], [28.95, 40.95], [28, 40.7], [26.7, 40.5], [26.4, 40.1], [26, 39.8], [25, 38], [26, 35]] }],
  },
  {
    id: 'gibraltar', name: 'Estrecho de Gibraltar', location: 'Atlántico–Mediterráneo', coordinates: [-5.6, 35.95], kind: 'Estrecho',
    importance: 'Alta', importanceReason: 'Acceso oceánico occidental al Mediterráneo.',
    threats: ['Congestión', 'Accidentes'], geography: 'Costas de España, Marruecos y Gibraltar (Reino Unido)',
    description: 'Conecta el Atlántico con los puertos mediterráneos. No se asigna una cuota comercial sin periodo y denominador verificables.',
    goods: ['Contenedores', 'Energía', 'Graneles'], exposure: 'Puertos mediterráneos y sus conexiones atlánticas. Relación geográfica cualitativa; sin porcentaje de dependencia asignado.',
    alternative: 'Sin desvío marítimo local equivalente; entrar por Suez exige otro corredor completo y depende del origen.', metrics: [], sources: [{ name: 'IMF PortWatch · paso de Gibraltar', url: PW_URL }],
    routes: [{ name: 'Atlántico–Mediterráneo', kind: 'principal', points: [[-12, 35], [-7, 35.8], [-5.6, 35.95], [-4, 36.1], [0, 37], [8, 38]] }],
  },
  {
    id: 'good_hope', name: 'Cabo de Buena Esperanza', location: 'Sur de África', coordinates: [18.47, -34.35], kind: 'Ruta alternativa',
    importance: 'Alta', importanceReason: 'Capacidad de desvío para viajes que evitan el mar Rojo.',
    threats: ['Meteorología', 'Mayor distancia', 'Capacidad de flota'], geography: 'Frente a Sudáfrica; corredor oceánico',
    description: 'Corredor de circunnavegación, distinto de un estrecho o un canal. Absorbe parte de los desvíos de Suez y Bab el-Mandeb.',
    goods: ['Petróleo', 'GNL', 'Contenedores'], exposure: 'Viajes intercontinentales desviados del mar Rojo y conexiones del Atlántico con el Índico.',
    alternative: 'Suez y Bab el-Mandeb cuando el itinerario, las condiciones y el buque lo permiten.',
    metrics: [oil(9.1, 'Tránsito por el sur de África; puede incluir cargas desviadas de otros pasos.')], sources,
    routes: [{ name: 'Corredor por el sur de África', kind: 'principal', points: cape }, { name: 'Alternativa por Suez', kind: 'alternativa', points: asia }],
  },
  {
    id: 'taiwan_strait', name: 'Estrecho de Taiwán', location: 'Asia oriental', coordinates: [119.8, 24.2], kind: 'Estrecho',
    importance: 'Muy alta', importanceReason: 'Concentración de tráficos regionales y cadenas industriales.',
    threats: ['Conflicto', 'Ejercicios militares', 'Desvíos preventivos'], geography: 'Entre China continental y Taiwán; situación política disputada',
    description: 'Canaliza tráficos entre Asia nororiental y el mar de China Meridional. La dependencia industrial de Taiwán no equivale al tránsito por el estrecho.',
    goods: ['Contenedores', 'Energía', 'Maquinaria'], exposure: 'CSIS estima que en 2024 atravesaron el estrecho el 28% del comercio total de Japón y el 22% del de Corea del Sur (por valor).',
    alternative: 'Desvíos al este de Taiwán o de Filipinas según el área afectada; no resuelven una interrupción de los puertos taiwaneses.',
    metrics: [{ label: 'Cuota del comercio marítimo mundial', value: 21, unit: '% del valor', scope: 'Comercio que cruza el estrecho; estimación CSIS, no porcentaje de la flota.', period: '2024', source: 'CSIS · investigación publicada en 2026', sourceUrl: CSIS_URL, estimated: true }],
    sources: [{ name: 'CSIS · comercio y exposición, 2024', url: CSIS_URL }, { name: 'IMF PortWatch · tráfico', url: PW_URL }],
    routes: [
      { name: 'Mar de China Meridional–Asia nororiental', kind: 'principal', points: [[114, 15], [117, 20], [119.8, 24.2], [121, 26], [124, 29], [127, 32]] },
      { name: 'Alternativa al este de Taiwán', kind: 'alternativa', points: [[114, 15], [118, 18], [121, 19], [123, 21], [123.5, 24], [123.5, 26], [124, 29], [127, 32]] },
    ],
  },
];

/** Colors express editorial structural importance, never a live risk rating. */
export function chokepointColor(point: MaritimeChokepoint): [number, number, number] {
  return point.kind === 'Ruta alternativa' ? [45, 212, 191] : point.importance === 'Muy alta' ? [251, 191, 36] : [96, 165, 250];
}
