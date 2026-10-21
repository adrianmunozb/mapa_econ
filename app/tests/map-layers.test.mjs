import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createExpression } from '@maplibre/maplibre-gl-style-spec';
import { sunPosition, solarAltitude, nightIntervals, nightGeometry } from '../src/lib/solar.ts';
import { ALLIANCES, countryAlliances, allianceColors } from '../src/data/alliances.ts';
import { prepareCable, cablePulses } from '../src/map/cableFlow.ts';

test('solar position follows UTC noon, midnight, solstices and leap years', () => {
  const noon = sunPosition(new Date('2026-03-20T12:00:00Z'));
  const midnight = sunPosition(new Date('2026-03-20T00:00:00Z'));
  assert.ok(solarAltitude(0, 0, noon) > 87);
  assert.ok(solarAltitude(0, 0, midnight) < -87);
  const summer = sunPosition(new Date('2026-06-21T12:00:00Z'));
  const winter = sunPosition(new Date('2026-12-21T12:00:00Z'));
  assert.ok(Math.abs(summer.declination * 180 / Math.PI - 23.44) < 0.3);
  assert.ok(Math.abs(winter.declination * 180 / Math.PI + 23.44) < 0.3);
  assert.ok(solarAltitude(180, 84, summer) > 0, 'Arctic midnight sun');
  assert.ok(solarAltitude(0, 84, winter) < 0, 'Arctic polar night');
  assert.ok(Object.values(sunPosition(new Date('2028-02-29T12:00:00Z'))).every(Number.isFinite));
});

test('night boundaries agree with solar altitude, including equinoxes and polar regions', () => {
  for (const declination of [0, 0.41, -0.41, 1e-8]) {
    const sun = { longitude: 173, declination };
    for (const threshold of [0, -2, -7, -18]) {
      for (let lon = -180; lon <= 180; lon += 15) {
        const intervals = nightIntervals(lon, threshold, sun);
        for (let lat = -80; lat <= 80; lat += 10) {
          const altitude = solarAltitude(lon, lat, sun);
          if (Math.abs(altitude - threshold) < 1e-7) continue;
          assert.equal(intervals.some(([low, high]) => lat >= low && lat <= high), altitude < threshold,
            `lon=${lon}, lat=${lat}, decl=${declination}, threshold=${threshold}`);
        }
      }
    }
  }
});

test('night polygons stay closed and never cross the dateline', () => {
  for (const date of ['2026-03-20', '2026-06-21', '2026-12-21']) {
    const night = nightGeometry(sunPosition(new Date(`${date}T00:00:00Z`)));
    assert.ok(night.features.length > 0 && night.features.length < 4400);
    for (const feature of night.features) {
      const ring = feature.geometry.coordinates[0];
      assert.deepEqual(ring[0], ring.at(-1));
      for (const [longitude, latitude] of ring) {
        assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180);
        assert.ok(Number.isFinite(latitude) && latitude >= -85 && latitude <= 85);
      }
      assert.ok(Math.max(...ring.map(([x]) => x)) - Math.min(...ring.map(([x]) => x)) <= 1);
    }
  }
});

test('alliance lists are unique, match expected counts and distinguish partners', () => {
  assert.deepEqual(ALLIANCES.map((a) => a.members.length), [32, 11, 27, 7, 11]);
  for (const alliance of ALLIANCES) {
    assert.equal(new Set(alliance.members).size, alliance.members.length);
    assert.ok(alliance.members.every((iso) => /^[A-Z]{3}$/.test(iso)));
  }
  assert.deepEqual(countryAlliances('ESP').map((a) => a.id), ['nato', 'eu']);
  assert.deepEqual(countryAlliances('IDN').map((a) => a.id), ['brics', 'asean']);
  assert.deepEqual(countryAlliances('VNM').map((a) => a.id), ['asean'], 'BRICS partner is not a member');
  assert.ok(!countryAlliances('GBR').some((a) => a.id === 'eu'));
  assert.ok(countryAlliances('SWE').some((a) => a.id === 'nato'));
});

test('MapLibre expressions compile for every combination and color overlaps explicitly', () => {
  const evaluate = (selected, iso3) => {
    const parsed = createExpression(allianceColors(selected));
    assert.equal(parsed.result, 'success', JSON.stringify(parsed.value));
    return parsed.value.evaluate({ zoom: 1 }, { type: 'Polygon', properties: { iso3 } });
  };
  for (let mask = 0; mask < 32; mask++) {
    const selected = ALLIANCES.filter((_, i) => mask & (1 << i)).map((a) => a.id);
    evaluate(selected, 'ESP');
  }
  assert.equal(evaluate(['nato', 'eu'], 'ESP'), '#e8d5a4');
  assert.equal(evaluate(['nato', 'eu'], 'USA'), '#5da9ff');
  assert.equal(evaluate(['nato', 'eu'], 'BRA'), '#253340');
});

test('bundled urban locations contain valid geographic coordinates and named real cities', () => {
  const cities = JSON.parse(readFileSync(new URL('../src/data/cities.json', import.meta.url), 'utf8'));
  assert.ok(cities.length > 3000);
  assert.ok(cities.some(([name]) => name === 'Madrid'));
  for (const [name, longitude, latitude, population] of cities) {
    assert.equal(typeof name, 'string');
    assert.ok(Number.isFinite(longitude) && Math.abs(longitude) <= 180);
    assert.ok(Number.isFinite(latitude) && Math.abs(latitude) <= 90);
    assert.ok(Number.isFinite(population));
  }
});

test('cable packets follow continuous Pacific paths and move without invalid coordinates', () => {
  const cable = { id: 'test', name: 'Test', owners: 'Test', lengthKm: 1, points: [[170, 40], [-175, 42], [-160, 35]] };
  const route = prepareCable(cable);
  assert.ok(route.total < 50);
  assert.ok(route.points.at(-1)[0] > 180);
  assert.ok(route.distances.every((d, i, a) => !i || d >= a[i - 1]));
  const pulses = cablePulses([route], 2);
  assert.ok(pulses.length);
  assert.ok(pulses.every((p) => p.points.length >= 2 && p.points.flat().every(Number.isFinite)));
  assert.notDeepEqual(pulses, cablePulses([route], 3));
  assert.deepEqual(cablePulses([prepareCable({ ...cable, points: [[1, 2], [1, 2]] })], 4), []);
});
