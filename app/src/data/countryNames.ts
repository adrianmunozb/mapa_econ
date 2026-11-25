import type { Snapshot } from '../types';

const NAMES_ES = new Intl.DisplayNames(['es'], { type: 'region', fallback: 'none' });

/** Spanish country names from the ISO code (the data files carry World Bank English names). */
export function spanishName(iso2: string | undefined, fallback: string): string {
  if (!iso2 || !/^[A-Z]{2}$/.test(iso2)) return fallback;
  try {
    return NAMES_ES.of(iso2) ?? fallback;
  } catch {
    return fallback;
  }
}

export function withSpanishNames(snapshot: Snapshot): Snapshot {
  return { ...snapshot, countries: snapshot.countries.map(c => ({ ...c, name: spanishName(c.iso2, c.name) })) };
}

const GROUPS_ES: Record<string, string> = {
  'Middle East, North Africa, Afghanistan & Pakistan': 'Oriente Medio, Norte de África, Afganistán y Pakistán',
  'Europe & Central Asia': 'Europa y Asia Central',
  'East Asia & Pacific': 'Asia Oriental y Pacífico',
  'Sub-Saharan Africa': 'África subsahariana',
  'Latin America & Caribbean': 'América Latina y Caribe',
  'South Asia': 'Asia meridional',
  'North America': 'América del Norte',
  'Low income': 'Renta baja',
  'Lower middle income': 'Renta media-baja',
  'Upper middle income': 'Renta media-alta',
  'High income': 'Renta alta',
};

/** World Bank region and income-group names in Spanish. */
export const groupEs = (name: string | undefined) => (name ? GROUPS_ES[name.trim()] ?? name.trim() : name);
