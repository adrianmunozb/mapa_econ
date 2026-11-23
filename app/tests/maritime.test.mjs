import assert from 'node:assert/strict';
import test from 'node:test';
import { CHOKEPOINTS } from '../src/data/chokepoints.ts';
import { TRAFFIC, trafficAverage, trafficSummary, trafficChart, trafficSeries } from '../src/data/maritimeTraffic.ts';
import { maritimeMatchTerms, maritimeSuggestions, matchesMaritimeSearch } from '../src/data/maritimeSearch.ts';

const days = Array.from({ length: 60 }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, i + 1)).toISOString().slice(0, 10), vessels: i < 30 ? 10 : 15 }));
const end = days.at(-1).date;

test('drought results explain the threat match instead of just showing unrelated traffic numbers', () => {
  const results = CHOKEPOINTS.filter((point) => matchesMaritimeSearch(point, 'sequia'));
  assert.deepEqual(results.map((point) => point.id), ['panama']);
  assert.deepEqual(maritimeMatchTerms(results[0], 'sequia'), [{ label: 'Sequía', category: 'Amenaza' }]);
  assert.deepEqual(maritimeMatchTerms(CHOKEPOINTS.find((point) => point.id === 'gibraltar'), 'sequia'), []);
  assert.deepEqual(maritimeMatchTerms(results[0], ''), []);
});

test('autocomplete completes partial names, goods and threats without requiring accents', () => {
  assert.equal(maritimeSuggestions(CHOKEPOINTS, 'petr')[0].label, 'Petróleo');
  assert.equal(maritimeSuggestions(CHOKEPOINTS, ' PETROLEO ')[0].label, 'Petróleo');
  assert.ok(maritimeSuggestions(CHOKEPOINTS, 'suez').some((item) => item.label === 'Canal de Suez' && item.category === 'Paso'));
  assert.ok(maritimeSuggestions(CHOKEPOINTS, 'sequi').some((item) => item.label === 'Sequía' && item.category === 'Amenaza'));
  assert.equal(maritimeSuggestions(CHOKEPOINTS, 'petr').filter((item) => item.label === 'Petróleo').length, 1);
  assert.deepEqual(maritimeSuggestions(CHOKEPOINTS, 'sequi', 'Estrecho'), []);
  assert.deepEqual(maritimeSuggestions(CHOKEPOINTS, '   '), []);
  assert.deepEqual(maritimeSuggestions(CHOKEPOINTS, 'zzzzzz'), []);
  assert.ok(maritimeSuggestions(CHOKEPOINTS, 'a').length <= 6);
});
test('selecting any suggested term leaves at least one matching row in the current type', () => {
  for (const kind of ['Todos', 'Canal', 'Estrecho', 'Ruta alternativa']) {
    for (const query of ['petr', 'suez', 'sequi', 'tai', 'gnl', 'a']) {
      for (const suggestion of maritimeSuggestions(CHOKEPOINTS, query, kind)) {
        assert.ok(CHOKEPOINTS.some((point) => (kind === 'Todos' || point.kind === kind) && matchesMaritimeSearch(point, suggestion.label)));
      }
    }
  }
  assert.ok(matchesMaritimeSearch(CHOKEPOINTS.find((point) => point.id === 'panama'), ' SEQUIA '));
});

test('calendar windows compare separate 30-day periods', () => {
  assert.deepEqual(trafficSummary(days, end), { current: 15, previous: 10, change: 50, latest: 15 });
});
test('missing observations are not zeros; zero baseline is not an infinite change', () => {
  assert.equal(trafficAverage(days.slice(1), days[29].date, 30), null);
  assert.equal(trafficAverage(days.map((d, i) => ({ ...d, vessels: i === 59 ? null : 10 })), end, 30), null);
  const zeros = days.map((d) => ({ ...d, vessels: 0 }));
  assert.equal(trafficAverage(zeros, end, 30), 0);
  assert.equal(trafficSummary(zeros, end).change, null);
  assert.equal(trafficSummary([], end).latest, null);
});
test('chart breaks paths at absent calendar days and nulls', () => {
  const path = trafficChart([days[0], days[1], days[3], { ...days[4], vessels: null }, days[5]], days[0].date, end);
  assert.equal((path.match(/M/g) ?? []).length, 3);
  assert.equal((path.match(/L/g) ?? []).length, 1);
  assert.ok(!path.includes('NaN'));
});
test('static snapshot has 90 unique calendar days for every selectable point', () => {
  assert.equal(CHOKEPOINTS.length, 9);
  assert.equal(new Set(CHOKEPOINTS.map((point) => point.id)).size, 9);
  assert.deepEqual(Object.keys(TRAFFIC.series).sort(), CHOKEPOINTS.map((point) => point.id).sort());
  for (const point of CHOKEPOINTS) {
    const series = trafficSeries(point.id);
    assert.equal(series.length, 90, point.id);
    assert.equal(new Set(series.map((day) => day.date)).size, 90);
    assert.equal(series[0].date, TRAFFIC.startDate);
    assert.equal(series.at(-1).date, TRAFFIC.endDate);
    for (const day of series) assert.ok(day.vessels === null || (Number.isInteger(day.vessels) && day.vessels >= 0));
    assert.notEqual(trafficSummary(series, TRAFFIC.endDate).current, null);
    for (const metric of point.metrics) {
      assert.ok(Number.isFinite(metric.value) && metric.value >= 0);
      assert.ok(metric.period && metric.unit && metric.scope && metric.sourceUrl.startsWith('https://'));
    }
    for (const route of point.routes) {
      assert.ok(route.points.length > 1);
      for (const [lon, lat] of route.points) assert.ok(Math.abs(lon) <= 180 && Math.abs(lat) <= 90);
    }
  }
  assert.equal(CHOKEPOINTS.find((p) => p.id === 'good_hope').kind, 'Ruta alternativa');
  assert.equal(CHOKEPOINTS.find((p) => p.id === 'suez').metrics[0].unit, 'buques');
});
