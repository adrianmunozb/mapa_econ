import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { availableBondCountries, bondPoint, bondSpread, bondMetricId, bondMonths, isRecentBondCurve, withBondMetrics } from '../src/data/bonds.ts';

const source = { name: 'Official source', url: 'https://example.org', license: 'Official data' };
const curve = { date: new Date().toISOString().slice(0, 10), frequency: 'daily', currency: 'EUR', source,
  method: 'Benchmark', points: [{ months: 24, yield: 0 }, { months: 120, yield: -0.5 }] };

test('maturity selection never substitutes a nearby yield; zero and negative yields survive', () => {
  assert.equal(bondPoint(curve, 24).yield, 0);
  assert.equal(bondPoint(curve, 120).yield, -0.5);
  assert.equal(bondPoint(curve, 60), undefined);
  assert.equal(bondPoint(undefined, 120), undefined);
  assert.equal(bondPoint({ ...curve, points: [{ months: 120, yield: NaN }] }, 120), undefined);
  assert.equal(bondSpread(curve), -50);
  assert.equal(bondSpread({ ...curve, points: [curve.points[1]] }), null);
});

test('snapshot adds dated, local-currency observations without changing policy rates or filling gaps', () => {
  const original = { generatedAt: '', sources: [], metrics: [], countries: [
    { iso3: 'ESP', name: 'Spain', metrics: { policy_rate: { value: 2, year: 2026 } } },
    { iso3: 'FRA', name: 'France', metrics: {} },
  ] };
  const result = withBondMetrics(original, { generatedAt: '', countries: { ESP: curve }, warnings: [] });
  assert.equal(result.countries[0].metrics[bondMetricId(24)].value, 0);
  assert.equal(result.countries[0].metrics[bondMetricId(120)].value, -0.5);
  assert.match(result.countries[0].metrics[bondMetricId(120)].period, /daily · EUR$/);
  assert.equal(result.countries[0].metrics[bondMetricId(60)], undefined);
  assert.equal(result.countries[1].metrics[bondMetricId(120)], undefined);
  assert.deepEqual(result.countries[0].metrics.policy_rate, original.countries[0].metrics.policy_rate);
  assert.equal(original.countries[0].metrics[bondMetricId(24)], undefined);
  assert.ok(result.metrics.every(m => m.higherIsBetter === null));
  assert.equal(bondMonths(bondMetricId(360)), 360);
});

test('historical, invalid and future observations cannot enter the current heatmap', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  assert.equal(isRecentBondCurve({ ...curve, date: '2026-09' }, now), true);
  for (const date of ['2022-08', 'invalid', '2027-01-01']) {
    assert.equal(isRecentBondCurve({ ...curve, date }, now), false);
  }
});

test('curve explorer lists only countries with recent selectable multi-tenor curves', () => {
  const countries = [
    { iso3: 'ESP', name: 'Spain', metrics: {} }, { iso3: 'USA', name: 'United States', metrics: {} },
    { iso3: 'GBR', name: 'United Kingdom', metrics: {} }, { iso3: 'JPN', name: 'Japan', metrics: {} },
    { iso3: 'CAN', name: 'Canada', metrics: {} }, { iso3: 'XXX', name: 'Missing', metrics: {} },
  ];
  const now = Date.parse('2026-10-20T12:00:00Z');
  const countriesWithCurves = availableBondCountries(countries, { countries: {
    ESP: { ...curve, date: '2026-07' }, USA: { ...curve, date: '2026-10-19' },
    GBR: { ...curve, date: '2026-09', points: [{ months: 120, yield: 4 }] },
    JPN: { ...curve, date: '2026-09', points: [{ months: 480, yield: 4 }, { months: 120, yield: 3 }] },
    CAN: { ...curve, date: '2022-08' },
  } }, now);
  assert.deepEqual(countriesWithCurves.map(c => c.iso3), ['JPN', 'ESP', 'USA']);
  assert.equal(bondMonths(bondMetricId(480)), 480);
  assert.equal(bondMonths(bondMetricId(600)), 600);
});

test('bundled curves have traceable sources, valid dates, distinct supported tenors and finite yields', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/bonds-snapshot.json', import.meta.url), 'utf8'));
  assert.ok(Object.keys(data.countries).length >= 25);
  for (const [iso, item] of Object.entries(data.countries)) {
    assert.match(iso, /^[A-Z]{3}$/);
    assert.match(item.date, /^\d{4}-\d{2}(-\d{2})?$/);
    assert.match(item.source.url, /^https:\/\//);
    assert.ok(item.method.length > 10);
    assert.equal(new Set(item.points.map(p => p.months)).size, item.points.length);
    assert.ok(item.points.every(p => Number.isFinite(p.yield) && bondMonths(bondMetricId(p.months)) === p.months));
  }
  for (const iso of ['ESP', 'USA', 'CAN', 'DEU', 'FRA']) assert.ok(data.countries[iso].points.length >= 5);
  for (const iso of ['GBR', 'SWE', 'NOR', 'CHE', 'JPN', 'SGP', 'CHN', 'NZL']) {
    assert.ok(data.countries[iso].points.length >= 2, `${iso} must retain its multi-tenor curve`);
  }
});
