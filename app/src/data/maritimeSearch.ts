import type { MaritimeChokepoint } from './chokepoints';

export function normalizeMaritimeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');
}

export interface MaritimeSuggestion { label: string; category: 'Paso' | 'Mercancía' | 'Amenaza' }

export function maritimeMatchTerms(point: MaritimeChokepoint, query: string): MaritimeSuggestion[] {
  const normalized = normalizeMaritimeSearch(query);
  if (!normalized) return [];
  return [
    { label: point.name, category: 'Paso' as const },
    ...point.goods.map((label) => ({ label, category: 'Mercancía' as const })),
    ...point.threats.map((label) => ({ label, category: 'Amenaza' as const })),
  ].filter((term) => normalizeMaritimeSearch(term.label).includes(normalized));
}

/** Suggest only terms that exist in the current type filter. No external requests. */
export function maritimeSuggestions(points: MaritimeChokepoint[], query: string, kind = 'Todos'): MaritimeSuggestion[] {
  const normalized = normalizeMaritimeSearch(query);
  if (!normalized) return [];
  const unique = new Map<string, MaritimeSuggestion>();
  for (const point of points.filter((item) => kind === 'Todos' || item.kind === kind)) {
    const terms: MaritimeSuggestion[] = [
      { label: point.name, category: 'Paso' },
      ...point.goods.map((label) => ({ label, category: 'Mercancía' as const })),
      ...point.threats.map((label) => ({ label, category: 'Amenaza' as const })),
    ];
    for (const term of terms) {
      const key = normalizeMaritimeSearch(term.label);
      if (key.includes(normalized) && !unique.has(key)) unique.set(key, term);
    }
  }
  const rank = (label: string) => {
    const term = normalizeMaritimeSearch(label);
    return term === normalized ? 0 : term.startsWith(normalized) ? 1 : term.split(' ').some((word) => word.startsWith(normalized)) ? 2 : 3;
  };
  return [...unique.values()].sort((a, b) => rank(a.label) - rank(b.label) || a.label.localeCompare(b.label, 'es')).slice(0, 6);
}

export function matchesMaritimeSearch(point: MaritimeChokepoint, query: string): boolean {
  return normalizeMaritimeSearch(`${point.name} ${point.goods.join(' ')} ${point.threats.join(' ')}`).includes(normalizeMaritimeSearch(query));
}
