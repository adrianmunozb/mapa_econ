import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { platform, arch, cpus } from 'node:os';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('https://basemaps.cartocdn.com/**', route => route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0d1117' } }] } }));
  await page.goto('http://127.0.0.1:5184/');
  await page.locator('.cable-toggle').waitFor();
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    const key = Object.keys(root).find(key => key.startsWith('__reactContainer'));
    const walk = node => {
      if (!node) return null;
      if (node.ref?.current?.getMap) return node.ref.current.getMap();
      return walk(node.child) || walk(node.sibling);
    };
    const map = walk(root[key]?.stateNode?.current ?? root[key]);
    const overlay = map?._controls.find(control => control._deck);
    if (!overlay?._deck?.layerManager) return false;
    window.__cableMap = map;
    window.__cableOverlay = overlay;
    return true;
  });
  console.log('Map/overlay ready; measuring first activation and two repeat activations.');
  await page.evaluate(() => {
    window.__cableRuns = [];
    window.__cableOverlay.setProps({ onAfterRender: ({ gl }) => {
      const run = window.__cableRun;
      if (!run) return;
      const now = performance.now();
      const layers = window.__cableOverlay._deck.layerManager.getLayers();
      const visible = layers.filter(layer => layer.props.visible && layer.isLoaded && layer.state?.model && layer.getNumInstances() > 0);
      if (run.staticMs === null && visible.some(layer => layer.id === 'submarine-cables')) run.staticMs = now - run.start;
      if (run.flowMs === null && visible.some(layer => layer.id === 'cable-flow-core' || (layer.id === 'submarine-cables' && layer.props.animate))) {
        gl.finish(); // Benchmark-only GPU fence: include completion, not just draw submission.
        run.flowMs = performance.now() - run.start;
      }
      run.frames++;
    } });
  });
  const geometryChecks = [];
  for (let index = 0; index < 3; index++) {
    await page.evaluate(index => {
      window.__cableRun = { index, start: performance.now(), staticMs: null, flowMs: null, frames: 0 };
      document.querySelector('.cable-toggle').click();
    }, index);
    await page.waitForFunction(() => window.__cableRun.staticMs !== null && window.__cableRun.flowMs !== null, null, { timeout: 60000 });
    // Inspect one animated interval to ensure time updates retain the mesh/model.
    if (index === 0) {
      await page.evaluate(() => {
        const layer = window.__cableOverlay._deck.layerManager.getLayers().find(layer => layer.id === 'submarine-cables');
        const tessellator = layer.state.pathTesselator;
        const original = tessellator.updateGeometry;
        window.__geometryUpdates = 0;
        window.__cableModel = layer.state.model;
        tessellator.updateGeometry = function(...args) { window.__geometryUpdates++; return original.apply(this, args); };
      });
      await page.waitForTimeout(600);
      geometryChecks.push(await page.evaluate(() => ({ updatesDuringAnimation: window.__geometryUpdates, sameModel: window.__cableModel === window.__cableOverlay._deck.layerManager.getLayers().find(layer => layer.id === 'submarine-cables').state.model })));
      if (process.argv.includes('--screenshot')) {
        const path = join(tmpdir(), 'wem-cables-gpu.png');
        await page.screenshot({ path });
        console.log(`Preview: ${path}`);
      }
    }
    const run = await page.evaluate(() => {
      const run = { ...window.__cableRun };
      window.__cableRun = null;
      document.querySelector('.cable-toggle').click();
      return run;
    });
    console.log(`Activation ${index}: static ${run.staticMs.toFixed(1)} ms, animated ${run.flowMs.toFixed(1)} ms`);
    await page.waitForFunction(() => document.querySelector('.cable-toggle').getAttribute('aria-pressed') === 'false');
    await page.waitForTimeout(250);
    await page.evaluate(run => window.__cableRuns.push(run), run);
  }
  const runs = await page.evaluate(() => window.__cableRuns);
  const budgetMs = [500, 150, 150];
  const report = { date: new Date().toISOString(), browser: browser.version(), node: process.version, platform: `${platform()} ${arch()}`, cpu: cpus()[0]?.model, scenario: 'Headless Chromium dev build, local basemap, 1280x800. Click-to-first-deck-frame, with a benchmark-only gl.finish() GPU completion fence for animated flow. Includes driver/shader initialization and host scheduling. No external APIs.', runs, budgetMs, geometryChecks, errors };
  const output = process.argv.slice(2).find(arg => !arg.startsWith('--')) ?? 'benchmarks/cable-activation.json';
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  if (errors.length || geometryChecks.some(check => check.updatesDuringAnimation !== 0 || !check.sameModel) || (process.argv.includes('--check') && runs.some((run, i) => run.flowMs > budgetMs[i]))) {
    console.log({ errors, geometryChecks, budgetMs }); process.exitCode = 1;
  }
} finally { await browser.close(); }
