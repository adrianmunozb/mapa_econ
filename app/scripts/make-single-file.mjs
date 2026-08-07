#!/usr/bin/env node
/**
 * make-single-file.mjs — post-processes the vite build output (dist/) into a
 * truly self-contained single HTML file:
 *
 *   - all JS chunks and CSS are inlined into <script>/<style> tags
 *   - the app data (snapshot/trade/timeseries/products/countries) is embedded
 *     as <script type="application/json"> so the app needs NO fetch() at runtime
 *   - the resulting index.html opens offline directly from file://
 *
 * Run after `vite build` (wired up as `npm run build`).
 */

import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

const DATA_FILES = [
  ['snapshot', 'data/snapshot.json'],
  ['trade', 'data/trade.json'],
  ['timeseries', 'data/timeseries.json'],
  ['products', 'data/trade_products.json'],
  ['countries', 'data/countries.geojson'],
];

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const indexHtml = resolve(DIST, 'index.html');
if (!existsSync(indexHtml)) {
  console.error('dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

let html = readFileSync(indexHtml, 'utf-8');

// 1) Inline every referenced JS chunk (single chunk thanks to inlineDynamicImports).
const scriptRe = /<script([^>]*)\bsrc="([^"]+\.js)"([^>]*)><\/script>/g;
html = html.replace(scriptRe, (_m, pre, src, post) => {
  const file = resolve(DIST, src.replace(/^\//, ''));
  if (!existsSync(file)) return _m;
  const code = readFileSync(file, 'utf-8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${code}</script>`;
});

// 2) Inline every referenced stylesheet.
const cssRe = /<link([^>]*)\bhref="([^"]+\.css)"([^>]*)\/?>/g;
html = html.replace(cssRe, (_m, pre, href, post) => {
  const file = resolve(DIST, href.replace(/^\//, ''));
  if (!existsSync(file)) return _m;
  const css = readFileSync(file, 'utf-8').replace(/<\/style/gi, '<\\/style');
  return `<style>${css}</style>`;
});

// 3) Drop modulepreload links (their chunks are now inline).
html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');

// 4) Embed the app data so the UI works without any fetch().
const tags = DATA_FILES.map(([id, rel]) => {
  const file = resolve(DIST, rel);
  if (!existsSync(file)) {
    console.warn(`missing data file: ${rel}`);
    return '';
  }
  const content = readFileSync(file, 'utf-8').replace(/</g, '\\u003c');
  return `<script type="application/json" id="wem-data-${id}">${content}</script>`;
}).join('\n    ');

html = html.replace('</head>', `    ${tags}\n  </head>`);

writeFileSync(indexHtml, html);

// 5) Remove now-redundant build artifacts — the HTML is fully self-contained.
for (const dir of ['assets', 'data']) rmSync(resolve(DIST, dir), { recursive: true, force: true });

console.log(`✓ single-file build: ${indexHtml} (${(html.length / 1024 / 1024).toFixed(1)} MB)`);
