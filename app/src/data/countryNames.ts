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
