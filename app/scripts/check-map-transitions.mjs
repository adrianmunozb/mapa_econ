// Local browser check; uses the desktop's bundled Playwright, no npm install.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  // Make the scenario independent of basemap availability and tile requests.
  await page.route('https://basemaps.cartocdn.com/**', route => route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0d1117' } }] } }));
  await page.goto('http://127.0.0.1:5184/');
  await page.locator('.ranking__list').waitFor();
  // Reach the map through the React ref to observe real worker/source activity.
  const inspect = async () => {
    await page.waitForFunction(() => {
      const root = document.querySelector('#root');
      const key = root && Object.keys(root).find(k => k.startsWith('__reactContainer'));
      const fiber = key && (root[key]?.stateNode?.current ?? root[key]);
      const walk = node => {
        if (!node) return null;
        if (node.ref?.current?.getMap) return node.ref.current.getMap();
        return walk(node.child) || walk(node.sibling);
      };
      const map = walk(fiber);
      return map && (map.getSource('regions') || map.getSource('countries'));
    });
    return page.evaluate(() => {
    const root = document.querySelector('#root');
    const key = Object.keys(root).find(k => k.startsWith('__reactContainer'));
    const start = root[key]?.stateNode?.current ?? root[key];
    const walk = node => {
      if (!node) return null;
      if (node.ref?.current?.getMap) return node.ref.current.getMap();
      return walk(node.child) || walk(node.sibling);
    };
    const map = walk(start);
    if (!map) throw new Error('Map ref not found');
    window.__mapCheck = map;
    window.__sourceChanges = [];
    const proto = Object.getPrototypeOf(map.getSource(map.getSource('regions') ? 'regions' : 'countries'));
    const original = proto.setData;
    proto.setData = function(...args) { window.__sourceChanges.push(this.id); return original.apply(this, args); };
    return { layers: map.getStyle().layers.map(l => l.id) };
    });
  };
  await page.waitForTimeout(1200);
  const world = await inspect();
  console.log('World map ready');
  await page.evaluate(() => {
    window.__frames = []; window.__lastFrame = performance.now();
    window.__recordFrames = true;
    const tick = now => { if (!window.__recordFrames) return; window.__frames.push(now - window.__lastFrame); window.__lastFrame = now; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  });
  const metric = page.locator('.controls select').first();
  const options = await metric.locator('option').evaluateAll(opts => opts.map(o => o.value));
  for (const value of options.slice(0, 5)) { await metric.selectOption(value); await page.waitForTimeout(300); }
  await page.mouse.move(900, 500);
  await page.mouse.move(1000, 580, { steps: 45 });
  const worldResults = await page.evaluate(() => { window.__recordFrames = false; const a = window.__frames.slice().sort((x, y) => x - y); return { setDataCalls: window.__sourceChanges, frameP95Ms: a[Math.floor(a.length * .95)], frames: a.length }; });
  // A deep link makes the same regional scenario repeatable before/after changes.
  await page.goto('about:blank');
  await page.goto('http://127.0.0.1:5184/#c=ESP&r=1');
  await page.locator('.regional-controls select').waitFor();
  await page.waitForTimeout(1500);
  const region = await inspect();
  console.log('Regional map ready');
  const selector = page.locator('.regional-controls select');
  const regionOptions = await selector.locator('option').evaluateAll(opts => opts.map(o => o.value));
  for (const value of regionOptions) { await selector.selectOption(value); await page.waitForTimeout(350); }
  const regionalResults = await page.evaluate(() => ({ setDataCalls: window.__sourceChanges, fillLayers: window.__mapCheck.getStyle().layers.filter(l => l.id.startsWith('region-fill')).map(l => ({ id: l.id, paint: l.paint })) }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.__mapCheck.getPaintProperty('region-fill', 'fill-opacity-transition').duration === 0);
  const reducedMotion = await page.evaluate(() => window.__mapCheck.getPaintProperty('region-fill', 'fill-opacity-transition').duration);
  // Back/forward through actual map selection must retain one WebGL canvas.
  await page.evaluate(() => { window.__oldCanvas = window.__mapCheck.getCanvas(); });
  await page.getByRole('button', { name: '← World map', exact: true }).click();
  await page.locator('.ranking__list').waitFor();
  await page.waitForTimeout(1000);
  await inspect();
  const reusedOnReturn = await page.evaluate(() => window.__oldCanvas === window.__mapCheck.getCanvas());
  console.log('Returned to world map; canvas reused:', reusedOnReturn);
  await page.locator('.rank-row').filter({ has: page.locator('.rank-row__name', { hasText: /^Spain$/ }) }).click();
  await page.locator('.btn--regional').click();
  await page.locator('.regional-controls select').waitFor();
  await page.waitForTimeout(1000);
  await inspect();
  const reusedOnDrilldown = await page.evaluate(() => window.__oldCanvas === window.__mapCheck.getCanvas());
  const checks = { noGeometryReload: worldResults.setDataCalls.length === 0 && regionalResults.setDataCalls.length === 0, reducedMotion: reducedMotion === 0, reusedOnReturn, reusedOnDrilldown };
  const report = { date: new Date().toISOString(), note: 'Headless Chromium, development build, local empty basemap; frame timings are smoke evidence, not a hardware-independent FPS guarantee.', world, worldResults, region, regionalResults, checks, errors };
  const output = process.argv[2];
  if (output) writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (errors.length || Object.values(checks).some(passed => !passed)) process.exitCode = 1;
} finally { await browser.close(); }
