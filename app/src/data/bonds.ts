import type { CountryData, MetricMeta, Snapshot, SourceRef } from '../types';

export interface BondCurve {
  currency: string;
  date: string;
  frequency: 'daily' | 'monthly' | 'auction';
  source: SourceRef;
  method: string;
  points: { months: number; yield: number }[];
}

export interface BondSnapshot {
  generatedAt: string;
  countries: Record<string, BondCurve>;
  warnings: string[];
}

export const BOND_TENORS = [
  { months: 3, label: '3 months' }, { months: 6, label: '6 months' },
  { months: 12, label: '1 year' }, { months: 24, label: '2 years' },
  { months: 36, label: '3 years' }, { months: 60, label: '5 years' },
  { months: 84, label: '7 years' }, { months: 120, label: '10 years' },
  { months: 180, label: '15 years' }, { months: 240, label: '20 years' },
  { months: 300, label: '25 years' },
  { months: 360, label: '30 years' },
  { months: 480, label: '40 years' }, { months: 600, label: '50 years' },
];

export const bondMetricId = (months: number) => `bond_yield_${months}m`;
export const isBondMetric = (id: string) => BOND_TENORS.some(t => bondMetricId(t.months) === id);
export const bondMonths = (id: string) => BOND_TENORS.find(t => bondMetricId(t.months) === id)?.months ?? 120;
export const tenorLabel = (months: number) => months < 12 ? `${months}M` : `${months / 12}Y`;

// The World Bank country snapshot does not include Taiwan. Keep its official
// bond observation joinable to the existing TWN map geometry without
// manufacturing unrelated macro metrics.
const BOND_ONLY_COUNTRIES: CountryData[] = [{
  iso3: 'TWN', iso2: 'TW', name: 'Taiwan', region: 'East Asia & Pacific',
  incomeGroup: 'High income', metrics: {},
}];

/** No nearest-term fallback: an unavailable maturity must remain missing. */
export function bondPoint(curve: BondCurve | undefined, months: number) {
  return curve?.points.find(point => point.months === months && Number.isFinite(point.yield));
}

export function isRecentBondCurve(curve: BondCurve, now = Date.now()) {
  const observed = Date.parse(`${curve.date}${curve.date.length === 7 ? '-01' : ''}T00:00:00Z`);
  return Number.isFinite(observed) && observed <= now && now - observed <= 180 * 86_400_000;
}

export function availableBondCountries(countries: CountryData[], bonds: BondSnapshot, now = Date.now()) {
  return countries.filter(country => {
    const curve = bonds.countries[country.iso3];
    return curve && isRecentBondCurve(curve, now)
      && curve.points.filter(point => Number.isFinite(point.yield) && isBondMetric(bondMetricId(point.months))).length >= 2;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export function withBondMetrics(snapshot: Snapshot, bonds: BondSnapshot): Snapshot {
  const source: SourceRef = { name: 'Official sovereign yield sources', url: 'https://www.bankofcanada.ca/rates/interest-rates/lookup-bond-yields/', license: 'Official data; see country source' };
  const metrics: MetricMeta[] = BOND_TENORS.map(term => ({
    id: bondMetricId(term.months), label: `Government bond yield · ${term.label}`,
    shortLabel: `Bond yield · ${tenorLabel(term.months)}`, unit: '%',
    description: 'Sovereign yields in local currency. Dates and methods vary by country: daily par, benchmark or spot rates, and monthly averages. Grey means no observation for this maturity. Click a country for its curve, date and source.',
    domain: 'economy', format: 'percent', higherIsBetter: null, source,
    indicatorCode: `sovereign_${term.months}m`,
  }));
  const knownCountries = new Set(snapshot.countries.map(country => country.iso3));
  const countries = [
    ...snapshot.countries,
    ...BOND_ONLY_COUNTRIES.filter(country => {
      const curve = bonds.countries[country.iso3];
      return !knownCountries.has(country.iso3) && curve !== undefined && isRecentBondCurve(curve);
    }),
  ];
  return {
    ...snapshot,
    metrics: [...snapshot.metrics.filter(m => !isBondMetric(m.id)), ...metrics],
    countries: countries.map(country => {
      const curve = bonds.countries[country.iso3];
      if (!curve || !isRecentBondCurve(curve)) return country;
      const values = { ...country.metrics };
      for (const term of BOND_TENORS) {
        const point = bondPoint(curve, term.months);
        if (point) values[bondMetricId(term.months)] = {
          value: point.yield, year: Number(curve.date.slice(0, 4)),
          period: `${curve.date} · ${curve.frequency === 'monthly' ? 'monthly' : curve.frequency === 'auction' ? 'auction' : 'daily'} · ${curve.currency}`,
        };
      }
      return { ...country, metrics: values };
    }),
  };
}

/** A slope is meaningful only for the same curve/date; percent -> basis points. */
export function bondSpread(curve: BondCurve | undefined) {
  const short = bondPoint(curve, 24);
  const long = bondPoint(curve, 120);
  return short && long ? (long.yield - short.yield) * 100 : null;
}
