import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCable, cablePulses } from '../src/map/cableFlow.ts';
import { cablePulses as oldPulses, prepareCable as oldPrepare } from './fixtures/cableFlow-before.ts';
import { nightGeometry, sunPosition } from '../src/lib/solar.ts';
import { nightGeometry as oldNight } from './fixtures/solar-before.ts';
import { MAJOR_MARKETS, getMarketStatus, getCountryTimeInfo } from '../src/data/markets.ts';
import { getMarketStatus as oldStatus, getCountryTimeInfo as oldTime } from './fixtures/markets-before.ts';

test('optimized packets match reference paths at vertices, wraps and dense routes', () => {
  const paths = [
    [[170, 40], [-175, 42], [-160, 35]],
    [[0, 0], [0, 0], [26, 0], [52, 0]],
    [[1, 2], [1, 2]],
    Array.from({ length: 180 }, (_, i) => [-150 + i * 1.5, 60 * Math.sin(i / 30)]),
  ];
  for (const points of paths) {
    const cable = { id: 'test', name: 'test', owners: 'test', lengthKm: 1, points };
    const route = prepareCable(cable);
    const reference = oldPrepare(cable);
    for (const seconds of [0, 0.2, 1, 5.2, 10.4, 1000]) {
      const actual = cablePulses([route], seconds);
      const expected = oldPulses([reference], seconds);
      assert.equal(actual.length, expected.length);
      actual.forEach((pulse, i) => {
        assert.equal(pulse.points.length, expected[i].points.length);
        pulse.points.forEach((point, j) => point.forEach((value, k) => {
          assert.ok(Math.abs(value - expected[i].points[j][k]) < 1e-9);
        }));
      });
    }
  }
});

test('solar geometry matches reference exactly at equinoxes and solstices', () => {
  for (const date of ['2026-03-20', '2026-06-21', '2026-09-22', '2026-12-21']) {
    for (const hour of ['00', '12']) {
      const sun = sunPosition(new Date(`${date}T${hour}:00:00Z`));
      assert.deepEqual(nightGeometry(sun), oldNight(sun));
    }
  }
});

test('formatter reuse preserves market boundaries, weekends, DST and current seconds', () => {
  for (const instant of ['2026-03-27T14:29:59Z', '2026-03-27T14:30:00Z', '2026-03-29T01:00:00Z', '2026-10-25T01:00:00Z', '2026-10-20T07:00:00Z', '2026-10-20T07:00:01Z', '2026-10-20T15:30:00Z']) {
    const now = new Date(instant);
    for (const market of MAJOR_MARKETS) {
      assert.deepEqual(getMarketStatus(market, now), oldStatus(market, now));
      assert.deepEqual(getCountryTimeInfo(market.countryIso3, now), oldTime(market.countryIso3, now));
    }
  }
  const invalid = { ...MAJOR_MARKETS[0], timezone: 'invalid/timezone' };
  assert.deepEqual(getMarketStatus(invalid), oldStatus(invalid));
  // Exceed the 64-formatter bound, then verify evicted entries can be rebuilt.
  const now = new Date('2026-10-20T12:00:00Z');
  for (const timezone of Intl.supportedValuesOf('timeZone').slice(0, 40)) {
    const market = { ...MAJOR_MARKETS[0], timezone };
    assert.deepEqual(getMarketStatus(market, now), oldStatus(market, now));
  }
  assert.deepEqual(getMarketStatus(MAJOR_MARKETS[0], now), oldStatus(MAJOR_MARKETS[0], now));
});
