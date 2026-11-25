// Spanish labels for every metric the pipeline publishes. The data files keep their EN/DE
// fields; presentation in Spanish lives here so no data has to be regenerated.
// [label, short label, unit, description]
type Es = [string, string, string, string];

export const METRICS_ES: Record<string, Es> = {
  // Tipos y riesgo soberano
  inflation: ['Inflación', 'Inflación', '% anual', 'Inflación de precios de consumo, tasa interanual del último mes disponible (IPC nacional, FMI).'],
  policy_rate: ['Tipo de interés oficial', 'Tipo oficial', '%', 'Tipo de interés de referencia del banco central, último nivel (BIS). En la zona euro, la facilidad de depósito del BCE.'],
  real_policy_rate: ['Tipo de interés real (ex post)', 'Tipo real', '%', 'Tipo oficial menos la última inflación interanual. Positivo: política monetaria restrictiva en términos reales. Usa inflación pasada, no esperada; solo se calcula si las dos cifras distan 3 meses o menos.'],
  euro_spread_bund: ['Prima de riesgo frente al Bund (10 años)', 'Prima de riesgo', 'pb', 'Rentabilidad del bono a 10 años menos la del Bund alemán, mismo mes y una sola fuente (Eurostat, criterio de convergencia). Solo zona euro: entre monedas distintas el diferencial también incluye riesgo de tipo de cambio. Se excluyen series sin variación (no son precios de mercado).'],
  // Economía
  gdp_per_capita: ['PIB per cápita', 'PIB/hab.', 'US$', 'Producto interior bruto por habitante, en dólares corrientes (Banco Mundial).'],
  gdp_per_capita_ppp: ['PIB per cápita (PPA)', 'PIB/hab. PPA', '$ int.', 'PIB por habitante en paridad de poder adquisitivo, dólares internacionales corrientes.'],
  gdp_total: ['PIB total', 'PIB', 'US$', 'Producto interior bruto en dólares corrientes.'],
  gdp_growth: ['Crecimiento del PIB', 'Crecimiento', '% anual', 'Variación anual del PIB real.'],
  gdp_per_capita_growth: ['Crecimiento del PIB per cápita', 'Crec./hab.', '% anual', 'Variación anual del PIB real por habitante.'],
  gni_per_capita: ['RNB per cápita', 'RNB/hab.', 'US$', 'Renta nacional bruta por habitante (método Atlas), dólares corrientes.'],
  unemployment: ['Tasa de paro', 'Paro', '% de la población activa', 'Desempleados en porcentaje de la población activa (estimación OIT).'],
  youth_unemployment: ['Paro juvenil', 'Paro juvenil', '% de activos de 15–24', 'Desempleados de 15 a 24 años en porcentaje de la población activa de esa edad.'],
  labor_participation: ['Tasa de actividad', 'Actividad', '% de población 15+', 'Población activa en porcentaje de la población de 15 años o más.'],
  exports_gdp: ['Exportaciones (% del PIB)', 'Exportaciones', '% del PIB', 'Exportaciones de bienes y servicios en porcentaje del PIB.'],
  imports_gdp: ['Importaciones (% del PIB)', 'Importaciones', '% del PIB', 'Importaciones de bienes y servicios en porcentaje del PIB.'],
  fdi_inflows_gdp: ['Inversión extranjera directa', 'IED', '% del PIB', 'Entradas netas de inversión extranjera directa en porcentaje del PIB.'],
  capital_formation_gdp: ['Formación bruta de capital', 'Inversión', '% del PIB', 'Inversión en activos fijos y variación de existencias en porcentaje del PIB.'],
  tax_revenue_gdp: ['Ingresos tributarios', 'Impuestos', '% del PIB', 'Ingresos tributarios del gobierno central en porcentaje del PIB.'],
  total_reserves: ['Reservas internacionales', 'Reservas', 'US$', 'Reservas totales, incluido el oro, en dólares corrientes.'],
  agriculture_gdp: ['Agricultura (% del PIB)', 'Agricultura', '% del PIB', 'Valor añadido de agricultura, silvicultura y pesca en porcentaje del PIB.'],
  industry_gdp: ['Industria (% del PIB)', 'Industria', '% del PIB', 'Valor añadido de la industria, incluida la construcción, en porcentaje del PIB.'],
  services_gdp: ['Servicios (% del PIB)', 'Servicios', '% del PIB', 'Valor añadido de los servicios en porcentaje del PIB.'],
  rd_expenditure: ['Gasto en I+D', 'I+D', '% del PIB', 'Gasto en investigación y desarrollo en porcentaje del PIB.'],
  // Comercio
  tourism_arrivals: ['Llegadas de turistas internacionales', 'Turistas', 'llegadas', 'Número de llegadas de turistas internacionales.'],
  // Sociedad
  gini: ['Índice de Gini (desigualdad)', 'Gini', 'índice 0–100', 'Desigualdad de la renta: 0 = igualdad perfecta, 100 = máxima desigualdad.'],
  poverty: ['Pobreza extrema', 'Pobreza', '% de la población', 'Población por debajo del umbral internacional de pobreza extrema del Banco Mundial (serie SI.POV.DDAY).'],
  education_expenditure: ['Gasto en educación', 'Educación', '% del PIB', 'Gasto público en educación en porcentaje del PIB.'],
  literacy: ['Tasa de alfabetización', 'Alfabetización', '% de adultos', 'Adultos (15+) que saben leer y escribir.'],
  secondary_enrollment: ['Escolarización secundaria', 'Secundaria', '% bruto', 'Matriculación bruta en educación secundaria.'],
  women_parliament: ['Mujeres en el parlamento', 'Diputadas', '% de escaños', 'Escaños ocupados por mujeres en el parlamento nacional.'],
  homicide_rate: ['Tasa de homicidios', 'Homicidios', 'por 100.000', 'Homicidios intencionados por cada 100.000 habitantes.'],
  // Salud
  life_expectancy: ['Esperanza de vida', 'Esperanza de vida', 'años', 'Esperanza de vida al nacer.'],
  health_expenditure_gdp: ['Gasto sanitario', 'Sanidad', '% del PIB', 'Gasto corriente en salud en porcentaje del PIB.'],
  fertility: ['Tasa de fecundidad', 'Fecundidad', 'hijos por mujer', 'Número medio de hijos por mujer.'],
  infant_mortality: ['Mortalidad infantil', 'Mort. infantil', 'por 1.000 nacidos vivos', 'Muertes antes del primer año por cada 1.000 nacidos vivos.'],
  under5_mortality: ['Mortalidad de menores de 5 años', 'Mort. <5', 'por 1.000 nacidos vivos', 'Muertes antes de los cinco años por cada 1.000 nacidos vivos.'],
  physicians: ['Médicos', 'Médicos', 'por 1.000', 'Médicos por cada 1.000 habitantes.'],
  hospital_beds: ['Camas de hospital', 'Camas', 'por 1.000', 'Camas hospitalarias por cada 1.000 habitantes.'],
  safe_water: ['Agua potable básica', 'Agua', '% de la población', 'Población con acceso al menos a un servicio básico de agua potable.'],
  sanitation: ['Saneamiento básico', 'Saneamiento', '% de la población', 'Población con acceso al menos a un saneamiento básico.'],
  // Demografía
  population: ['Población', 'Población', 'personas', 'Población total residente.'],
  urban_population: ['Población urbana', 'Urbanización', '% de la población', 'Población que vive en zonas urbanas.'],
  population_growth: ['Crecimiento de la población', 'Crec. población', '% anual', 'Variación anual de la población.'],
  population_65plus: ['Población de 65 años o más', '65+', '% de la población', 'Población de 65 años o más en porcentaje del total.'],
  birth_rate: ['Tasa bruta de natalidad', 'Natalidad', 'por 1.000', 'Nacimientos por cada 1.000 habitantes.'],
  net_migration: ['Migración neta', 'Migración', 'personas', 'Inmigrantes menos emigrantes; negativo = emigración neta (Banco Mundial, SM.POP.NETM).'],
  // Medio ambiente
  co2_per_capita: ['CO₂ per cápita', 'CO₂/hab.', 't al año', 'Emisiones de CO₂ por habitante, toneladas al año.'],
  renewable_energy: ['Energías renovables', 'Renovables', '% de la energía final', 'Consumo de energía renovable en porcentaje del consumo final.'],
  forest_area: ['Superficie forestal', 'Bosques', '% del territorio', 'Superficie de bosque en porcentaje del territorio.'],
  pm25: ['Contaminación del aire (PM2,5)', 'PM2,5', 'µg/m³', 'Exposición media anual a partículas finas PM2,5.'],
  energy_use_per_capita: ['Consumo de energía per cápita', 'Energía/hab.', 'kg equivalentes de petróleo', 'Consumo de energía primaria por habitante.'],
  // Infraestructura
  internet_users: ['Usuarios de internet', 'Internet', '% de la población', 'Personas que han usado internet en los últimos tres meses.'],
  electricity_access: ['Acceso a la electricidad', 'Electricidad', '% de la población', 'Población con acceso a la electricidad.'],
  mobile_subscriptions: ['Líneas móviles', 'Móviles', 'por 100 personas', 'Suscripciones de telefonía móvil por cada 100 habitantes.'],
  broadband: ['Banda ancha fija', 'Banda ancha', 'por 100 personas', 'Suscripciones de banda ancha fija por cada 100 habitantes.'],
  // Gobernanza (Banco Mundial, WGI)
  voice_accountability: ['Voz y rendición de cuentas', 'Voz y rendición', 'índice 0–100', 'Percepción de la libertad de expresión, de asociación y de elegir gobierno (WGI, Banco Mundial).'],
  political_stability: ['Estabilidad política', 'Estabilidad', 'índice 0–100', 'Probabilidad percibida de inestabilidad política o violencia (WGI).'],
  government_effectiveness: ['Eficacia del gobierno', 'Eficacia', 'índice 0–100', 'Calidad percibida de los servicios públicos y de la formulación de políticas (WGI).'],
  regulatory_quality: ['Calidad regulatoria', 'Regulación', 'índice 0–100', 'Capacidad percibida del gobierno para regular a favor del sector privado (WGI).'],
  rule_of_law: ['Estado de derecho', 'Estado de derecho', 'índice 0–100', 'Confianza percibida en las reglas: contratos, propiedad, policía y tribunales (WGI).'],
  control_of_corruption: ['Control de la corrupción', 'Corrupción', 'índice 0–100', 'Percepción de hasta qué punto el poder público se usa en beneficio privado (WGI).'],
};

/** Sovereign yield metrics are generated per maturity (``bond_yield_<months>m``). */
export function bondMetricEs(id: string): Es | undefined {
  const match = /^bond_yield_(\d+)m$/.exec(id);
  if (!match) return undefined;
  const months = Number(match[1]);
  const tenor = months < 12 ? `${months} meses` : months === 12 ? '1 año' : `${months / 12} años`;
  return [
    `Rentabilidad del bono soberano · ${tenor}`,
    `Bono · ${months < 12 ? `${months}M` : `${months / 12}A`}`,
    '%',
    'Rentabilidad de la deuda pública en moneda local. Fecha y método varían por país (diario, media mensual o subasta); gris = sin dato para ese plazo. Pulsa un país para ver su curva, fecha y fuente. No es comparable entre monedas.',
  ];
}

/** "10 años", "6 meses": maturity names for selectors. */
export const tenorLabelEs = (months: number) =>
  months < 12 ? `${months} meses` : months === 12 ? '1 año' : `${months / 12} años`;
