import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { cpus } from 'node:os';
import ts from 'typescript';
import { clusterWebcams } from '../src/map/webcamClusters.ts';

// Resolve the local static catalog without network or changing its TypeScript imports.
const moduleUrl = (path) => {
  let js = ts.transpile(readFileSync(path, 'utf8'), { module: ts.ModuleKind.ESNext });
  js = js.replace(/from ['"](.+?)['"]/g, (_, relative) => {
    if (!relative.startsWith('.')) throw Error('Only local catalog imports are supported');
    return `from '${moduleUrl(new URL(relative + '.ts', path))}'`;
  });
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
};
const { WEBCAMS } = await import(moduleUrl(new URL('../src/data/webcams.ts', import.meta.url)));
const width = 1440, height = 900;
const project = ([lng, lat]) => {
  const bounded = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
  return { x: (lng + 180) / 360 * width, y: height / 2 - Math.log(Math.tan(Math.PI / 4 + bounded / 2)) * width / (2 * Math.PI) };
};
const cases = [
  ['catalog', WEBCAMS],
  ['10000', Array.from({ length: 10000 }, (_, i) => ({ id: String(i), coordinates: [((i * 137.5) % 360) - 180, ((i * 37.1) % 160) - 80] }))],
  ['50000', Array.from({ length: 50000 }, (_, i) => ({ id: String(i), coordinates: [((i * 137.5) % 360) - 180, ((i * 37.1) % 160) - 80] }))],
];
const results = [];
for (const [name, cameras] of cases) {
  for (let i = 0; i < 20; i++) clusterWebcams(cameras, project, width, height);
  const samples = [];
  let groups;
  for (let i = 0; i < 51; i++) {
    const start = performance.now();
    groups = clusterWebcams(cameras, project, width, height);
    samples.push(performance.now() - start);
  }
  samples.sort((a,b) => a-b);
  results.push({ name, cameras: cameras.length, markers: groups.length, medianMs: samples[25], p95Ms: samples[48] });
}
const report = { date: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model, viewport: {width,height}, results,
  scope: 'Local clustering plus Mercator projection; excludes DOM, MapLibre rendering, GPU and browser FPS.' };
console.table(results);
if (process.argv.includes('--output')) {
  const path = process.argv[process.argv.indexOf('--output') + 1];
  if (!path) throw Error('--output requires a path');
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
}