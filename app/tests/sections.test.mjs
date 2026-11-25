import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { SECTIONS, isSectionId, sectionForLink, shows } from '../src/sections.ts';

const snapshot = JSON.parse(readFileSync(new URL('../public/data/snapshot.json', import.meta.url), 'utf8'));
const metricIds = new Set(snapshot.metrics.map(m => m.id));

test('every section opens on a metric that exists in the published data', () => {
  for (const section of SECTIONS) assert.ok(metricIds.has(section.defaultMetric), `${section.id}: ${section.defaultMetric}`);
});

test('sections are distinct and each one is focused', () => {
  assert.equal(new Set(SECTIONS.map(s => s.id)).size, SECTIONS.length);
  for (const section of SECTIONS) {
    assert.ok(section.controls.length <= 7, `${section.id} shows too much`);
    assert.equal(shows(section, 'picker'), section.domains.length > 0, `${section.id}: picker iff domains`);
  }
  // Layers are switched on only where they belong.
  const on = id => Object.entries(SECTIONS.find(s => s.id === id).layers).filter(([, v]) => v).map(([k]) => k);
  assert.deepEqual(on('riesgo'), []);
  assert.deepEqual(on('comercio'), ['trade', 'chokepoints', 'routes']);
  assert.deepEqual(on('actualidad'), ['news']);
});

test('old shared links land in the right section', () => {
  const finance = id => id === 'policy_rate' || id.startsWith('bond_yield_');
  assert.equal(sectionForLink('policy_rate', false, finance), 'riesgo');
  assert.equal(sectionForLink('gdp_total', true, finance), 'comercio');
  assert.equal(sectionForLink('gdp_total', false, finance), 'economia');
  assert.equal(isSectionId('riesgo'), true);
  assert.equal(isSectionId('inicio'), false);
});

test('the globe opens a full world map with every metric group, not a landing card', () => {
  const full = SECTIONS.find(s => s.id === 'mapa');
  assert.equal(full.noCard, true);
  assert.ok(full.domains.includes('finance') && full.domains.includes('economy') && full.domains.length >= 9);
  assert.equal(SECTIONS.filter(s => !s.noCard).length, 6);
});
