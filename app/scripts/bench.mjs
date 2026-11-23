import { performance } from 'node:perf_hooks';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cpus, platform, arch } from 'node:os';
const reference = process.argv.includes('--reference');
const { prepareCable, cablePulses } = await import(reference ? '../tests/fixtures/cableFlow-before.ts' : '../src/map/cableFlow.ts');
const { nightGeometry, sunPosition } = await import(reference ? '../tests/fixtures/solar-before.ts' : '../src/lib/solar.ts');
import { bboxOf, largestPolygonCentroid } from '../src/lib/geo.ts';
const { MAJOR_MARKETS, getMarketStatus } = await import(reference ? '../tests/fixtures/markets-before.ts' : '../src/data/markets.ts');

// Read the actual bundled routes without importing maritime's unrelated re-exports.
import ts from 'typescript';
const source = readFileSync(new URL('../src/data/maritime.ts', import.meta.url), 'utf8').replace(/^export \{[^\n]+\n/, '');
const { SUBMARINE_CABLES } = await import(`data:text/javascript;base64,${Buffer.from(ts.transpile(source, { module: ts.ModuleKind.ESNext })).toString('base64')}`);
const routes = SUBMARINE_CABLES.filter(c => c.points.length > 1).map(prepareCable);
const denseRoutes = SUBMARINE_CABLES.map(c => prepareCable({ ...c, points: c.points.flatMap((p, i, a) => i === a.length - 1 ? [p] : Array.from({ length: 16 }, (_, j) => [p[0] + (a[i + 1][0] - p[0]) * j / 16, p[1] + (a[i + 1][1] - p[1]) * j / 16])) }));
const geometry = JSON.parse(readFileSync(new URL('../public/data/countries.geojson', import.meta.url), 'utf8'));
const dates = ['2026-03-20', '2026-06-21', '2026-12-21'].map(d => new Date(`${d}T12:00:00Z`));
const cases = [
  ['cable-frame', i => cablePulses(routes, i / 30).length, 0.5],
  ['cable-frame-dense', i => cablePulses(denseRoutes, i / 30).length, 2],
  ['solar-geometry', i => nightGeometry(sunPosition(dates[i % dates.length])).features.length, 25],
  ['country-geometry', () => { let n = 0; for (const f of geometry.features) { n += bboxOf(f.geometry)?.[0] ?? 0; n += largestPolygonCentroid(f.geometry)?.area ?? 0; } return n; }, 100],
  ['market-status-all', i => { let n = 0; const date = new Date(dates[i % dates.length].getTime() + i * 1000); for (const m of MAJOR_MARKETS) n += getMarketStatus(m, date).localTimeStr.length; return n; }, 1],
];
let sink = 0;
const results = [];
for (const [name, run, budgetMs] of cases) {
  for (let i = 0; i < 40; i++) sink += run(i);
  const samples = [];
  let iterations = 1;
  let sequence = 0;
  // Calibrate each sample to at least 20ms to reduce clock/GC noise.
  while (true) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) sink += run(sequence++);
    if (performance.now() - start >= 20 || iterations >= 16384) break;
    iterations *= 2;
  }
  for (let sample = 0; sample < 21; sample++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) sink += run(sequence++);
    samples.push((performance.now() - start) / iterations);
  }
  samples.sort((a, b) => a - b);
  results.push({ name, medianMs: samples[10], p95Ms: samples[19], budgetMs, iterations });
}
const report = { schema: 1, reference, date: new Date().toISOString(), node: process.version, platform: `${platform()} ${arch()}`, cpu: cpus()[0]?.model, fixtures: { cables: routes.length, denseVertices: denseRoutes.reduce((n, r) => n + r.points.length, 0), countries: geometry.features.length }, results, sink };
console.table(results.map(r => ({ benchmark: r.name, 'median ms': r.medianMs.toFixed(3), 'p95 ms': r.p95Ms.toFixed(3), 'budget ms': r.budgetMs })));
const output = process.argv.indexOf('--output');
if (output >= 0) {
  if (!process.argv[output + 1]) throw new Error('--output requires a path');
  mkdirSync(new URL('../benchmarks/', import.meta.url), { recursive: true });
  writeFileSync(process.argv[output + 1], JSON.stringify(report, null, 2) + '\n');
}
const compare = process.argv.indexOf('--compare');
if (compare >= 0) {
  const baseline = JSON.parse(readFileSync(process.argv[compare + 1], 'utf8'));
  for (const r of results) {
    const before = baseline.results.find(b => b.name === r.name);
    if (before) console.log(`${r.name}: ${(before.medianMs / r.medianMs).toFixed(2)}x; ${((1 - r.medianMs / before.medianMs) * 100).toFixed(1)}% less execution time`);
  }
}
if (process.argv.includes('--check') && results.some(r => r.p95Ms > r.budgetMs)) process.exitCode = 1;
