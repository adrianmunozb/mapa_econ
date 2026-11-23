import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { cleanArticles } from '../src/data/news.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FEEDS = JSON.parse(await readFile(resolve(ROOT, 'src/data/news-feeds.json'), 'utf8'));
const TTL = 15 * 60_000;
const DAY = 86_400_000;
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const text = value => typeof value === 'string' ? value : typeof value?.['#text'] === 'string' ? value['#text'] : '';

export function parseFeed(xml, feed) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error('Invalid feed XML');
  const parsed = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, processEntities: true }).parse(xml);
  const channel = parsed.rss?.channel ?? parsed.feed ?? parsed.RDF;
  if (!channel) throw new Error('Missing RSS/Atom channel');
  const items = array(channel.item ?? channel.entry ?? parsed.RDF?.item).slice(0, 500);
  const rows = items.map(item => {
    const link = array(item.link).find(link => !link?.['@_rel'] || link['@_rel'] === 'alternate');
    return { title: text(item.title).replace(/<[^>]*>/g, ''), url: typeof link === 'string' ? link : link?.['@_href'] ?? text(link),
      publishedAt: text(item.pubDate ?? item.published ?? item.updated ?? item.date), source: feed.name, sourceId: feed.id };
  });
  const articles = cleanArticles(rows);
  if (!articles.length) throw new Error('No valid dated news');
  return articles;
}

export function mergeNewsArchive(previous, incoming, statuses, now) {
  const stamp = new Date(now).toISOString(); const cutoff = now - 14 * DAY;
  const existing = new Map((previous.articles ?? []).map(article => [article.url, article]));
  const articles = cleanArticles([...incoming.map(article => ({ ...article, firstSeenAt: existing.get(article.url)?.firstSeenAt ?? stamp })), ...(previous.articles ?? [])])
    .filter(article => Date.parse(article.publishedAt) >= cutoff && Date.parse(article.publishedAt) <= now + 300_000)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const warnings = statuses.filter(source => source.status !== 'ok').map(source => `${source.name}: sin actualización; se conserva su archivo.`);
  if (articles.length >= 8000) warnings.push('Archivo limitado a 8.000 noticias; el historial puede estar incompleto.');
  const observations = [...(previous.observations ?? []).filter(o => Date.parse(o.at) >= cutoff), { at: stamp, sources: statuses.filter(s => s.status === 'ok').map(s => s.id) }].slice(-1400);
  return { generatedAt: incoming.length ? stamp : previous.generatedAt ?? null, articles: articles.slice(0, 8000), sources: statuses, observations, warnings };
}

/** Shared, bounded cache. No work until requested; failures are cached as well. */
export function createNewsService({ feeds = FEEDS, fetcher = (...args) => fetch(...args), now = Date.now, cachePath = resolve(ROOT, '.news-cache/history.json'), initial } = {}) {
  let pending; let expires = 0; let cached = initial; let initialized = false;
  const initialize = async () => {
    if (initialized) return;
    initialized = true;
    if (cachePath && !cached) try {
      const info = await stat(cachePath);
      if (info.size <= 12_000_000) cached = JSON.parse(await readFile(cachePath, 'utf8'));
    } catch { /* Missing/corrupt cache falls back to the dated bundled snapshot. */ }
    if (!cached) try { cached = JSON.parse(await readFile(resolve(ROOT, 'src/data/news-snapshot.json'), 'utf8')); } catch { cached = { generatedAt: null, articles: [] }; }
    const last = cached.observations?.at(-1)?.at;
    if (last && cachePath) expires = Math.min(Date.parse(last) + TTL, now() + TTL);
  };
  const refresh = async () => {
    await initialize();
    if (now() < expires) return cached;
    expires = now() + TTL;
    const stamp = new Date(now()).toISOString();
    const results = await Promise.all(feeds.slice(0, 8).map(async feed => {
      const prior = cached.sources?.find(source => source.id === feed.id);
      try {
        const result = await fetcher(feed.url, { signal: AbortSignal.timeout(15_000), headers: { 'User-Agent': 'WorldEconomicMap/1.1 (personal RSS reader)' } });
        if (!result.ok || !result.body) throw new Error('Feed unavailable');
        const reader = result.body.getReader(); const chunks = []; let size = 0;
        try {
          while (true) { const { value, done } = await reader.read(); if (done) break;
            size += value.byteLength; if (size > 2_000_000) throw new Error('Feed exceeds limit'); chunks.push(Buffer.from(value)); }
        } finally { await reader.cancel(); }
        const articles = parseFeed(Buffer.concat(chunks).toString('utf8'), feed);
        return { articles, source: { ...feed, status: 'ok', lastSuccessAt: stamp, count: articles.length } };
      } catch { return { articles: [], source: { ...feed, status: 'error', lastSuccessAt: prior?.lastSuccessAt, count: 0 } }; }
    }));
    cached = mergeNewsArchive(cached, results.flatMap(result => result.articles), results.map(result => result.source), now());
    if (cachePath) try {
      await mkdir(dirname(cachePath), { recursive: true });
      await writeFile(`${cachePath}.tmp`, JSON.stringify(cached), 'utf8');
      await rename(`${cachePath}.tmp`, cachePath);
    } catch { cached.warnings.push('No se pudo guardar el historial local; se conserva en memoria.'); }
    return cached;
  };
  return { get() {
    if (!pending) pending = refresh().finally(() => { pending = undefined; });
    return pending;
  } };
}

export function newsFeedPlugin(options) {
  const service = createNewsService(options);
  return { name: 'local-news-feed', configureServer(server) {
    server.middlewares.use('/api/news-feed', async (request, response) => {
      if (request.method !== 'GET') { response.statusCode = 405; response.end(); return; }
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      try { response.end(JSON.stringify(await service.get())); }
      catch { response.statusCode = 503; response.end(JSON.stringify({ error: 'RSS temporarily unavailable' })); }
    });
  } };
}
