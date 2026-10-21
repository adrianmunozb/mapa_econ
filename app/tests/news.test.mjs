import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanArticles, countryMatcher, newsHotspots, parseNewsImport, csvRows, clusterNews, newsPlaces, publisherId, comparableHistory, newsTopic } from '../src/data/news.ts';
import { mkdtemp, readFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createNewsService, mergeNewsArchive, parseFeed } from '../scripts/news-feed.mjs';

const countries = [
  { iso3: 'IRN', iso2: 'IR', name: 'Iran, Islamic Rep.' }, { iso3: 'ISR', iso2: 'IL', name: 'Israel' },
  { iso3: 'ESP', iso2: 'ES', name: 'Spain' }, { iso3: 'USA', iso2: 'US', name: 'United States' },
  { iso3: 'GIN', iso2: 'GN', name: 'Guinea' }, { iso3: 'PNG', iso2: 'PG', name: 'Papua New Guinea' },
  { iso3: 'CHE', iso2: 'CH', name: 'Switzerland' },
];
const now = Date.parse('2026-10-20T12:00:00Z');
const article = (title, age = 0, extra = {}) => ({ title, publishedAt: new Date(now - age * 3600000).toISOString(), source: 'Test', url: `https://example.org/${encodeURIComponent(title)}`, ...extra });
const match = countryMatcher(countries);

test('country recognition handles Spanish, accents, uppercase US and nested country names', () => {
  assert.deepEqual(match(article('Irán e Israel negocian')), ['ISR', 'IRN']);
  assert.deepEqual(match(article('US economy and España')), ['USA', 'ESP']);
  assert.deepEqual(match(article('Papua New Guinea votes')), ['PNG']);
  assert.deepEqual(match(article('Let us discuss inspiring proposals')), []);
  assert.deepEqual(match(article('No place names', 0, { countries: ['IRN', 'IRN', 'XXX'] })), ['IRN']);
});

test('hotspots deduplicate, exclude old/future items, decay and split multi-country stories', () => {
  const a = article('Iran today');
  const b = article('Israel yesterday', 24);
  const c = article('Iran and Israel meet');
  const data = newsHotspots([a, { ...a, url: `${a.url}?utm_source=copy` }, b, c, article('Spain old', 90), article('Spain future', -2), article('Unknown location')], match, countries, new Map([['IRN', [53, 32]], ['ISR', [35, 31]], ['ESP', [-3, 40]]]), 72, now);
  assert.equal(data.total, 4);
  assert.equal(data.unmapped, 1);
  assert.equal(data.hotspots.length, 2);
  assert.equal(data.hotspots[0].iso3, 'IRN');
  assert.equal(data.hotspots[0].score, 1.5);
  assert.equal(data.hotspots[1].score, 1);
  assert.equal(data.hotspots[0].intensity, 1);
});

test('CSV/JSON imports handle quoted multiline cells and reject invalid dates and unsafe links', () => {
  const csv = 'title,url,publishedAt,source,countries\r\n"Iran, latest\nnews",https://example.org/a,2026-10-20T10:00:00Z,Example,IRN|ISR';
  assert.equal(csvRows(csv)[1][0], 'Iran, latest\nnews');
  assert.deepEqual(parseNewsImport(csv)[0].countries, ['IRN', 'ISR']);
  assert.equal(parseNewsImport(JSON.stringify({ articles: [article('Iran')] })).length, 1);
  assert.equal(cleanArticles([article('Unsafe', 0, { url: 'javascript:alert(1)' }), article('Bad date', 0, { publishedAt: 'invalid' })]).length, 0);
  assert.throws(() => parseNewsImport('title,url,publishedAt\nBad,javascript:alert(1),invalid'));
  assert.throws(() => csvRows('title\n"unfinished'));
});

const rss = '<rss><channel><title>Test News</title><item><title>Iran nuclear talks resume</title><link>https://one.example/a</link><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>';
test('shared multi-source service coalesces requests, retains partial results, and caches failures until TTL', async () => {
  let calls = 0; let clock = now;
  const feeds = [{ id: 'one.example', name: 'One', url: 'https://one.example/rss' }, { id: 'two.example', name: 'Two', url: 'https://two.example/rss' }];
  const service = createNewsService({ feeds, now: () => clock, cachePath: null, initial: { articles: [] }, fetcher: async url => {
    calls++;
    if (url.includes('two')) throw new Error('offline');
    return new Response(rss);
  } });
  const results = await Promise.all([service.get(), service.get(), service.get()]);
  assert.equal(calls, 2);
  assert.equal(results[0].articles.length, 1);
  assert.equal(results[0].sources.filter(s => s.status === 'error').length, 1);
  assert.equal(results[0].warnings.length, 1);
  await service.get(); assert.equal(calls, 2);
  clock += 15 * 60_000;
  await service.get(); assert.equal(calls, 4);
  let failures = 0;
  const offline = createNewsService({ feeds, cachePath: null, initial: results[0], now: () => clock, fetcher: async () => { failures++; throw new Error('offline'); } });
  const failed = await offline.get(); await offline.get();
  assert.equal(failures, 2);
  assert.equal(failed.articles.length, 1);
  assert.equal(failed.generatedAt, results[0].generatedAt);
  assert.deepEqual(failed.observations.at(-1).sources, []);
});

test('events cluster multilingual headlines without merging unrelated events in the same country', () => {
  const rows = cleanArticles([
    article('Iran nuclear talks resume', 1, { url: 'https://one.example/a' }),
    article('Irán retoma negociaciones nucleares', 0, { url: 'https://two.example/b' }),
    article('Iran nuclear talks resume', 0, { url: 'https://three.example/c' }),
    article('Iran earthquake destroys housing', 0, { url: 'https://one.example/d' }),
  ]);
  assert.equal(rows.length, 4);
  const events = clusterNews(rows, match);
  assert.equal(events.length, 2);
  assert.equal(events.find(event => event.topic === 'geopolitics').sourceCount, 3);
  assert.equal(newsTopic(article('Let us discuss gaslighting')), 'other');
  assert.equal(newsTopic(article('Militants attack mayor in the West Bank')), 'geopolitics');
  assert.equal(newsTopic(article('Las protestas en Francia generan preocupación económica')), 'economy');
});

test('publisher identity is domain based and repeated one-publisher coverage does not inflate one event', () => {
  assert.equal(publisherId({ url: 'https://www.bbc.com/news/a', sourceId: 'pretend' }), 'bbc');
  const input = ['first', 'second', 'third'].map((word, i) => article(`Iran nuclear talks ${word}`, i, { url: `https://one.example/${i}`, source: `Fake publisher ${i}`, eventId: 'nuclear-talks' }));
  const spots = newsHotspots(input, match, countries, new Map([['IRN', [53, 32]]]), 24, now);
  assert.equal(spots.hotspots[0].events.length, 1);
  assert.equal(spots.hotspots[0].sourceCount, 1);
  assert.equal(spots.hotspots[0].score, 1);
});

test('mentions and event location stay distinct; unsupported locations are not invented', () => {
  const input = article('US and Iran hold nuclear talks in Geneva');
  assert.equal(newsPlaces(input)[0].country, 'CHE');
  assert.equal(newsPlaces(input)[0].basis, 'inferred');
  assert.equal(newsPlaces(article('Geneva officials discuss Iran')).length, 0);
  assert.equal(newsPlaces(article('Earthquake in Iran'), match)[0].country, 'IRN');
  assert.equal(newsPlaces(article('Storm in Papua New Guinea'), match)[0].country, 'PNG');
  const centroids = new Map([['IRN', [53, 32]], ['USA', [-100, 40]], ['CHE', [8, 47]]]);
  const mentioned = newsHotspots([input], match, countries, centroids, 24, now);
  assert.deepEqual(mentioned.hotspots.map(spot => spot.iso3).sort(), ['IRN', 'USA']);
  const occurrence = newsHotspots([input], match, countries, centroids, 24, now, { geography: 'occurrence' });
  assert.equal(occurrence.hotspots[0].iso3, 'CHE');
  assert.deepEqual(occurrence.hotspots[0].coordinates, [6.143, 46.204]);
  assert.equal(newsHotspots([article('Iran nuclear talks')], match, countries, centroids, 24, now, { geography: 'occurrence' }).unmapped, 1);
  assert.equal(newsPlaces(article('Iran nuclear talks in Geneva', 0, { eventCountries: ['ESP'] }))[0].country, 'ESP');
});

test('a surge requires four days of comparable source observations, excludes gaps and future history', () => {
  const observations = Array.from({ length: 4 * 96 }, (_, i) => ({ at: new Date(now - i * 900000).toISOString(), sources: ['one.example', 'two.example'] }));
  assert.equal(comparableHistory(observations, ['one.example', 'two.example'], now), true);
  assert.equal(comparableHistory(observations, ['missing.example'], now), false);
  assert.equal(comparableHistory(observations.filter((_, i) => i < 96), ['one.example'], now), false);
  assert.equal(comparableHistory(observations, ['one.example'], now - 7 * 86400000), false);
  const rows = [];
  for (let day = 1; day <= 3; day++) for (let i = 0; i < 2; i++) rows.push(article(`Iran previous ${day} ${i}`, 24 * day + 1, { eventId: `prior-${day}-${i}` }));
  for (let i = 0; i < 6; i++) rows.push(article(`Iran today ${i}`, i, { url: `https://${i % 2 ? 'one' : 'two'}.example/current-${i}`, eventId: `current-${i}` }));
  const centroids = new Map([['IRN', [53, 32]]]);
  const good = newsHotspots(rows, match, countries, centroids, 24, now, { observations, sources: ['one.example', 'two.example', 'example.org'] });
  assert.equal(good.baselineReady, false);
  const withCohort = observations.map(o => ({ ...o, sources: [...o.sources, 'example.org'] }));
  const ready = newsHotspots(rows, match, countries, centroids, 24, now, { observations: withCohort });
  assert.equal(ready.baselineReady, true);
  assert.equal(Math.round(ready.hotspots[0].trend), 200);
  assert.equal(newsHotspots(rows, match, countries, centroids, 24, now).hotspots[0].trend, null);
});

test('time, topic and source filters cannot leak future articles into a historical view', () => {
  const rows = [article('Iran oil supply', 30, { url: 'https://one.example/a' }), article('Iran oil pipeline', 0, { url: 'https://two.example/b' }), article('Iran earthquake', 30)];
  const spots = newsHotspots(rows, match, countries, new Map([['IRN', [53, 32]]]), 24, now - 24 * 3600000, { topic: 'energy', sources: ['one.example'] });
  assert.equal(spots.total, 1);
  assert.equal(spots.hotspots[0].events[0].title, 'Iran oil supply');
});

test('archive retains first-seen metadata and source failures, prunes old records', () => {
  const old = article('Iran old', 24 * 20);
  const recent = article('Iran current', 2, { firstSeenAt: new Date(now - 3600000).toISOString() });
  const merged = mergeNewsArchive({ articles: [old, recent], observations: [] }, [recent], [{ id: 'one', name: 'One', status: 'ok' }], now);
  assert.equal(merged.articles.length, 1);
  assert.equal(merged.articles[0].firstSeenAt, recent.firstSeenAt);
  assert.equal(merged.observations.length, 1);
});

test('RSS/Atom/RDF parser rejects entities, preserves source credit and skips invalid links', () => {
  assert.equal(parseFeed(rss, { id: 'one', name: 'One' })[0].source, 'One');
  const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Iran</title><link rel="self" href="https://one.example/feed"/><link rel="alternate" href="https://one.example/article"/><updated>2026-10-20T10:00:00Z</updated></entry></feed>';
  assert.equal(parseFeed(atom, { id: 'one', name: 'One' })[0].url, 'https://one.example/article');
  const rdf = '<rdf:RDF xmlns:rdf="urn:rdf" xmlns:dc="urn:dc"><channel><title>DW</title></channel><item><title>Irán</title><link>https://dw.com/a</link><dc:date>2026-10-20T10:00:00Z</dc:date></item></rdf:RDF>';
  assert.equal(parseFeed(rdf, { id: 'dw', name: 'DW' }).length, 1);
  assert.throws(() => parseFeed('<!DOCTYPE rss [<!ENTITY a "bad">]><rss/>', { name: 'One' }));
});

test('persisted cache survives restart without refetching and saves source observations', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wem-news-cache-'));
  const cachePath = join(directory, 'history.json');
  let calls = 0; let clock = now;
  const config = { cachePath, feeds: [{ id: 'one.example', name: 'One', url: 'https://one.example/rss' }], now: () => clock,
    fetcher: async () => { calls++; return new Response(rss); } };
  try {
    await createNewsService({ ...config, initial: { articles: [] } }).get();
    assert.equal(calls, 1);
    const saved = JSON.parse(await readFile(cachePath, 'utf8'));
    assert.deepEqual(saved.observations.at(-1).sources, ['one.example']);
    const restarted = createNewsService(config);
    await restarted.get(); assert.equal(calls, 1);
    clock += 15 * 60000;
    await restarted.get(); assert.equal(calls, 2);
  } finally { await unlink(cachePath).catch(() => {}); await unlink(`${cachePath}.tmp`).catch(() => {}); await rmdir(directory); }
});
