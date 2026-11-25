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

test('economy is organised by themes and differs from the full world map', () => {
  const eco = SECTIONS.find(s => s.id === 'economia');
  const full = SECTIONS.find(s => s.id === 'mapa');
  assert.equal(eco.defaultView, 'change');
  assert.ok(eco.themes.length >= 6);
  const all = eco.themes.flatMap(th => th.metrics);
  assert.equal(new Set(all).size, all.length, 'a metric belongs to one theme only');
  for (const id of all) assert.ok(metricIds.has(id), id);
  assert.equal(eco.themes[0].metrics[0], eco.defaultMetric);
  assert.notDeepEqual(eco.controls, full.controls);
});

test('the country explorer is reached from the landing page, not from the top bar', () => {
  const pais = SECTIONS.find(s => s.id === 'pais');
  assert.equal(pais.noTopBar, true);
  assert.notEqual(pais.noCard, true);
  assert.ok(SECTIONS.find(s => s.id === 'comercio').title.length <= 16);
});
