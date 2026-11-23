import type { CountryData } from '../types';

export interface NewsArticle { title: string; url: string; source: string; publishedAt: string; summary?: string; countries?: string[]; sourceId?: string; eventCountries?: string[]; eventId?: string; topic?: string; firstSeenAt?: string }
export interface NewsSource { id: string; name: string; url: string; language?: string; region?: string; status: 'ok' | 'error'; lastSuccessAt?: string; count?: number }
export interface NewsObservation { at: string; sources: string[] }
export interface NewsSnapshot { generatedAt: string | null; articles: NewsArticle[]; warnings?: string[]; sources?: NewsSource[]; observations?: NewsObservation[] }
export interface NewsHotspot { id: string; iso3: string; name: string; coordinates: [number, number]; articles: NewsArticle[]; events: NewsEvent[]; score: number; intensity: number; trend: number | null; isNew: boolean; sourceCount: number; fresh: boolean }
export interface NewsEvent { id: string; title: string; articles: NewsArticle[]; countries: string[]; topic: NewsTopic; places: NewsPlace[]; occurredIn: string[]; latestAt: number; sourceCount: number; tokens: string[] }
export interface NewsPlace { name: string; country: string; coordinates?: [number, number]; basis: 'explicit' | 'inferred' }
export type NewsTopic = 'geopolitics' | 'economy' | 'energy' | 'disasters' | 'other';
export type NewsGeography = 'mentioned' | 'occurrence';
export type NewsCountryMatcher = ((article: NewsArticle) => string[]) & { places?: (article: NewsArticle) => NewsPlace[] };
export const NEWS_TOPICS: Record<NewsTopic | 'all', string> = { all: 'Todos los temas', geopolitics: 'Geopolítica', economy: 'Economía', energy: 'Energía', disasters: 'Desastres', other: 'Otros' };
/** Undo the size's square-root scale so low coverage stays yellow: yellow → orange → red. */
export function newsHeatColor(intensity: number) {
  const weight = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) ** 2 : 0;
  const yellow = [255, 226, 58]; const orange = [255, 140, 32]; const red = [239, 44, 44];
  const low = weight < 0.5 ? yellow : orange; const high = weight < 0.5 ? orange : red;
  const blend = weight < 0.5 ? weight * 2 : (weight - 0.5) * 2;
  return `rgb(${low.map((channel, i) => Math.round(channel + (high[i] - channel) * blend)).join(', ')})`;
}
const DAY = 86_400_000;
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ALIASES: Record<string, string[]> = {
  IRN: ['Iran', 'Iranian', 'Iraní', 'Tehran', 'Teherán'], ISR: ['Israel', 'Israeli', 'Israelí', 'Tel Aviv'],
  PSE: ['Palestine', 'Palestina', 'Palestinian', 'Gaza', 'West Bank', 'Cisjordania'],
  RUS: ['Russia', 'Rusia', 'Russian', 'Moscow', 'Moscú'], UKR: ['Ukraine', 'Ucrania', 'Ukrainian', 'Kyiv', 'Kiev'],
  USA: ['United States', 'Estados Unidos', 'U.S.', 'USA', 'EEUU', 'Washington'],
  GBR: ['United Kingdom', 'Reino Unido', 'Britain', 'British', 'London', 'Londres'],
  CHN: ['China', 'Chinese', 'Beijing', 'Pekín'], TWN: ['Taiwan', 'Taiwán', 'Taipei'],
  KOR: ['South Korea', 'Corea del Sur', 'Seoul'], PRK: ['North Korea', 'Corea del Norte', 'Pyongyang'],
  SAU: ['Saudi Arabia', 'Arabia Saudí', 'Arabia Saudita', 'Riyadh'], ARE: ['United Arab Emirates', 'Emiratos Árabes Unidos', 'Dubai', 'Abu Dhabi'],
  ESP: ['España', 'Spain', 'Spanish', 'Madrid'], FRA: ['France', 'Francia', 'French', 'Paris'],
  DEU: ['Germany', 'Alemania', 'German', 'Berlin'], LBN: ['Lebanon', 'Líbano', 'Lebanese', 'Beirut'],
  CAN: ['Canada', 'Canadian'], AUS: ['Australia', 'Australian'], JPN: ['Japan', 'Japanese', 'Japón', 'Tokyo'],
  IND: ['India', 'Indian'], PAK: ['Pakistan', 'Pakistani'], AFG: ['Afghanistan', 'Afghan'],
  ITA: ['Italy', 'Italian', 'Italia'], BRA: ['Brazil', 'Brazilian', 'Brasil'], TUR: ['Turkey', 'Türkiye', 'Turkish', 'Turquía'],
};

export function countryMatcher(countries: CountryData[]) {
  const displays = ['en', 'es'].map(lang => new Intl.DisplayNames([lang], { type: 'region' }));
  const entries = countries.map(country => {
    const names = [country.name, ...(ALIASES[country.iso3] ?? [])];
    const nouns = [country.name, ALIASES[country.iso3]?.[0] ?? ''];
    if (country.iso2 && /^[A-Z]{2}$/.test(country.iso2)) for (const display of displays) names.push(display.of(country.iso2) ?? '');
    if (country.iso2 && /^[A-Z]{2}$/.test(country.iso2)) for (const display of displays) nouns.push(display.of(country.iso2) ?? '');
    return { iso3: country.iso3, aliases: [...new Set(names.map(normalize).filter(name => name.length > 2))], nouns: [...new Set(nouns.map(normalize).filter(name => name.length > 2))] };
  });
  const matches = entries.flatMap(e => e.aliases.map(alias => ({ iso3: e.iso3, alias }))).sort((a, b) => b.alias.length - a.alias.length);
  const matcher = (article: NewsArticle) => {
    // Explicit ISO3 geography in an imported sheet overrides heuristic detection.
    if (article.countries?.length) return [...new Set(article.countries.filter(iso => entries.some(e => e.iso3 === iso)))];
    let text = ` ${normalize(`${article.title} ${article.summary ?? ''}`.replace(/\b(?:US|U\.S\.)\b/g, 'United States').replace(/\bUK\b/g, 'United Kingdom'))} `;
    // Prevent Korea/Guinea and similar nested names producing two country matches.
    const result = new Set<string>();
    for (const match of matches) if (text.includes(` ${match.alias} `)) {
      result.add(match.iso3);
      text = text.split(` ${match.alias} `).join(' ');
    }
    return [...result];
  };
  const locationPatterns = entries.flatMap(entry => entry.nouns.map(name => ({ country: entry.iso3, name, pattern: new RegExp(`\\b(?:in|near|en|cerca de|desde) (?:the |el |la )?${name}\\b`) }))).sort((a, b) => b.name.length - a.name.length);
  return Object.assign(matcher, { places: (article: NewsArticle): NewsPlace[] => {
    let text = normalize(article.title); const found: NewsPlace[] = [];
    for (const location of locationPatterns) if (location.pattern.test(text)) {
      if (!found.some(place => place.country === location.country)) found.push({ name: location.country, country: location.country, basis: 'inferred' });
      text = text.replace(location.pattern, ' ');
    }
    return found;
  } });
}

export function safeNewsUrl(value: string) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url : null; } catch { return null; }
}

export function publisherId(article: Pick<NewsArticle, 'url' | 'sourceId'>) {
  // Publisher identity comes from the link, never a user-editable source label.
  const host = safeNewsUrl(article.url)?.hostname.toLowerCase().replace(/^www\./, '') ?? 'unknown';
  if (/(^|\.)bbc\.(com|co\.uk)$/.test(host)) return 'bbc';
  if (/(^|\.)theguardian\.com$/.test(host)) return 'guardian';
  if (/(^|\.)dw\.com$/.test(host)) return 'dw';
  if (/(^|\.)france24\.com$/.test(host)) return 'france24';
  if (/(^|\.)aljazeera\.(com|net)$/.test(host)) return 'aljazeera';
  return host;
}

export function cleanArticles(rows: unknown[]): NewsArticle[] {
  const seen = new Set<string>();
  const output: NewsArticle[] = [];
  for (const row of rows.slice(0, 8000)) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    if (typeof item.title !== 'string' || typeof item.url !== 'string' || typeof item.publishedAt !== 'string') continue;
    const url = safeNewsUrl(item.url);
    const date = Date.parse(item.publishedAt);
    const title = item.title.trim().slice(0, 600);
    if (!url || !title || !Number.isFinite(date)) continue;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/.test(key)) url.searchParams.delete(key);
    const key = `${publisherId({ url: url.href })}:${normalize(title)}`;
    if (seen.has(key) || seen.has(url.href)) continue;
    seen.add(key); seen.add(url.href);
    const codes = Array.isArray(item.countries) ? item.countries : typeof item.countries === 'string' ? item.countries.split(/[|;, ]+/) : [];
    const parseCodes = (value: unknown) => (Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[|;, ]+/) : []).filter((code): code is string => typeof code === 'string').map(code => code.trim().toUpperCase()).filter(code => /^[A-Z]{3}$/.test(code));
    output.push({ title, url: url.href, publishedAt: new Date(date).toISOString(),
      source: typeof item.source === 'string' ? item.source.slice(0, 120) : url.hostname,
      summary: typeof item.summary === 'string' ? item.summary.slice(0, 1500) : undefined,
      countries: codes.filter((code): code is string => typeof code === 'string').map(code => code.trim().toUpperCase()).filter(Boolean),
      sourceId: publisherId({ url: url.href }), eventCountries: parseCodes(item.eventCountries),
      eventId: typeof item.eventId === 'string' ? item.eventId.slice(0, 120) : undefined,
      topic: typeof item.topic === 'string' && item.topic in NEWS_TOPICS && item.topic !== 'all' ? item.topic : undefined,
      firstSeenAt: typeof item.firstSeenAt === 'string' && Number.isFinite(Date.parse(item.firstSeenAt)) ? item.firstSeenAt : undefined,
    });
  }
  return output;
}

const TOPIC_WORDS: Record<Exclude<NewsTopic, 'other'>, string[]> = {
  energy: ['oil', 'petroleo', 'gas', 'energy', 'energia', 'opec', 'crude', 'crudo', 'pipeline', 'oleoducto', 'electricity', 'electricidad'],
  disasters: ['earthquake', 'terremoto', 'flood', 'inundacion', 'inundaciones', 'hurricane', 'huracan', 'wildfire', 'incendio', 'tsunami', 'drought', 'sequia', 'volcano', 'volcan'],
  economy: ['economy', 'economia', 'economic', 'economico', 'economica', 'economicas', 'financiero', 'financiera', 'inflation', 'inflacion', 'tariff', 'tariffs', 'arancel', 'aranceles', 'trade', 'comercio', 'gdp', 'pib', 'bank', 'banco', 'markets', 'mercados', 'stocks', 'bolsa', 'unemployment', 'desempleo'],
  geopolitics: ['war', 'guerra', 'attack', 'ataque', 'attacks', 'strikes', 'missile', 'misil', 'nuclear', 'talks', 'negociaciones', 'ceasefire', 'tregua', 'election', 'elecciones', 'electoral', 'president', 'presidente', 'military', 'militar', 'sanctions', 'sanciones', 'diplomatic', 'diplomacia', 'parliament', 'parlamento', 'protest', 'protests', 'protestas', 'protesta', 'manifestaciones', 'unrest', 'riots', 'disturbios', 'curfew', 'curfews', 'saqueos', 'looting', 'looters', 'militants', 'manifestantes', 'huelgas', 'gobierno', 'government'],
};
const STOP_WORDS = new Set('the a an and or of to in on at for by with from after before over as is are was were has have had will says said say new latest live news update updates about how what why this that into amid en el la los las un una y o de del al por para con sin desde tras sobre que es son ha han dice nuevo nueva noticias ultima hoy iran irani iranian israel israeli russia russian ukraine ukrainian china chinese united states us uk'.split(' '));
const TOKEN_EQUIVALENTS: Record<string, string> = {
  negociaciones: 'talk', negotiations: 'talk', talks: 'talk', negocian: 'talk', conversa: 'talk',
  nuclear: 'nuclear', nucleares: 'nuclear', ceasefire: 'ceasefire', tregua: 'ceasefire',
  petroleo: 'oil', crudo: 'oil', crude: 'oil', energia: 'energy',
  attack: 'attack', attacks: 'attack', ataque: 'attack', ataques: 'attack', atacan: 'attack',
  elecciones: 'election', elections: 'election', terremoto: 'earthquake', inundaciones: 'flood',
  sanctions: 'sanction', sanciones: 'sanction', inflation: 'inflation', inflacion: 'inflation',
  aranceles: 'tariff', tariffs: 'tariff', acuerdo: 'deal', acuerdoes: 'deal', agreement: 'deal',
  curfews: 'curfew', disturbios: 'unrest', riots: 'unrest', riot: 'unrest', violencia: 'unrest', violence: 'unrest',
  protestas: 'protest', protests: 'protest', manifestaciones: 'protest', saqueos: 'looting', looters: 'looting',
  gobierno: 'government', ciudades: 'city', cities: 'city', calma: 'calm', calm: 'calm', impone: 'impose',
};

export function newsTopic(article: NewsArticle): NewsTopic {
  if (article.topic && article.topic in NEWS_TOPICS && article.topic !== 'all') return article.topic as NewsTopic;
  const words = new Set(normalize(article.title).replace(/\bwest bank\b/g, 'cisjordania').split(' '));
  let best: NewsTopic = 'other'; let count = 0;
  for (const [topic, terms] of Object.entries(TOPIC_WORDS)) {
    const score = terms.filter(term => words.has(term)).length;
    if (score > count) { count = score; best = topic as NewsTopic; }
  }
  return best;
}

const PLACES: { names: string[]; country: string; coordinates: [number, number] }[] = [
  { names: ['Geneva', 'Ginebra'], country: 'CHE', coordinates: [6.143, 46.204] },
  { names: ['Vienna', 'Viena'], country: 'AUT', coordinates: [16.374, 48.208] },
  { names: ['Tehran', 'Teheran'], country: 'IRN', coordinates: [51.389, 35.689] },
  { names: ['Gaza'], country: 'PSE', coordinates: [34.45, 31.5] },
  { names: ['Kyiv', 'Kiev'], country: 'UKR', coordinates: [30.523, 50.45] },
  { names: ['Moscow', 'Moscu'], country: 'RUS', coordinates: [37.617, 55.756] },
  { names: ['Beirut'], country: 'LBN', coordinates: [35.502, 33.894] },
  { names: ['Baghdad', 'Bagdad'], country: 'IRQ', coordinates: [44.366, 33.315] },
  { names: ['Tel Aviv'], country: 'ISR', coordinates: [34.782, 32.085] },
  { names: ['Paris'], country: 'FRA', coordinates: [2.352, 48.857] },
  { names: ['London', 'Londres'], country: 'GBR', coordinates: [-0.128, 51.507] },
  { names: ['Madrid'], country: 'ESP', coordinates: [-3.704, 40.417] },
  { names: ['Washington'], country: 'USA', coordinates: [-77.037, 38.907] },
  { names: ['Doha'], country: 'QAT', coordinates: [51.531, 25.285] },
];

export function newsPlaces(article: NewsArticle, match?: NewsCountryMatcher): NewsPlace[] {
  if (article.eventCountries?.length) return [...new Set(article.eventCountries)].map(country => ({ name: country, country, basis: 'explicit' }));
  const text = ` ${normalize(article.title)} `;
  const cities: NewsPlace[] = PLACES.flatMap(place => {
    const name = place.names.find(name => new RegExp(`\\b(?:in|near|en|cerca de|desde) (?:the |el |la )?${normalize(name)}\\b`).test(text));
    return name ? [{ name, country: place.country, coordinates: place.coordinates, basis: 'inferred' as const }] : [];
  });
  return [...cities, ...(match?.places?.(article) ?? []).filter(place => !cities.some(city => city.country === place.country))];
}

function eventTokens(title: string) {
  return [...new Set(normalize(title).replace(/\btoques? de queda\b/g, 'curfew').split(' ').filter(word => word.length > 2 && !STOP_WORDS.has(word)).map(word => TOKEN_EQUIVALENTS[word] ?? word))];
}
const EVENT_ANCHORS = new Set(['nuclear', 'talk', 'ceasefire', 'curfew', 'unrest', 'earthquake', 'flood', 'tariff', 'sanction', 'election', 'looting', 'missile']);

/** Conservative grouping against the first headline, avoiding transitive topic chains. */
export function clusterNews(articles: NewsArticle[], match: NewsCountryMatcher): NewsEvent[] {
  const groups: NewsEvent[] = [];
  const inverted = new Map<string, Set<NewsEvent>>();
  const explicitGroups = new Map<string, NewsEvent>();
  for (const article of [...articles].sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt) || a.url.localeCompare(b.url))) {
    const countries = match(article); const places = newsPlaces(article, match); const topic = newsTopic(article);
    const tokens = eventTokens(article.title); const stamp = Date.parse(article.publishedAt);
    const candidates = new Set(tokens.flatMap(token => [...(inverted.get(token) ?? [])]));
    let group = article.eventId ? explicitGroups.get(article.eventId) : undefined;
    let best = 0;
    if (!article.eventId) for (const candidate of candidates) {
      if (candidate.articles[0].eventId || candidate.topic !== topic || Math.abs(stamp - Date.parse(candidate.articles[0].publishedAt)) > 36 * 3_600_000) continue;
      if (!countries.some(country => candidate.countries.includes(country))) continue;
      if (places.length && candidate.places.length && !places.some(place => candidate.occurredIn.includes(place.country))) continue;
      const overlap = tokens.filter(token => candidate.tokens.includes(token)).length;
      const similarity = overlap / new Set([...tokens, ...candidate.tokens]).size;
      const anchors = tokens.filter(token => EVENT_ANCHORS.has(token) && candidate.tokens.includes(token)).length;
      if (overlap >= 2 && (similarity >= 0.24 || anchors >= 2 && similarity >= 0.14) && similarity > best) { group = candidate; best = similarity; }
    }
    if (!group) {
      group = { id: article.eventId ? `explicit:${article.eventId}` : article.url, title: article.title, articles: [], countries: [], topic, places: [], occurredIn: [], latestAt: stamp, sourceCount: 0, tokens };
      groups.push(group);
      for (const token of tokens) { const entries = inverted.get(token) ?? new Set(); entries.add(group); inverted.set(token, entries); }
      if (article.eventId) explicitGroups.set(article.eventId, group);
    }
    group.articles.push(article);
    group.latestAt = Math.max(group.latestAt, stamp);
    group.countries = [...new Set([...group.countries, ...countries])];
    for (const place of places) if (!group.places.some(p => p.name === place.name && p.country === place.country)) group.places.push(place);
    group.occurredIn = [...new Set(group.places.map(place => place.country))];
    group.sourceCount = new Set(group.articles.map(publisherId)).size;
  }
  for (const group of groups) group.articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return groups.sort((a, b) => b.latestAt - a.latestAt);
}

export interface NewsOptions { topic?: NewsTopic | 'all'; sources?: string[]; baselineSources?: string[]; geography?: NewsGeography; observations?: NewsObservation[] }

/** Successful collection samples cover the preceding 15 min only; gaps stay unknown. */
export function comparableHistory(observations: NewsObservation[], sources: string[], now: number) {
  if (!sources.length) return false;
  const fraction = (start: number, end: number, source: string) => {
    const ranges = observations.filter(o => o.sources.includes(source)).map(o => Date.parse(o.at)).filter(at => at <= now && Number.isFinite(at)).map(at => [Math.max(start, at - 15 * 60_000), Math.min(end, at)]).filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
    let covered = 0; let through = start;
    for (const [a, b] of ranges) { covered += Math.max(0, b - Math.max(a, through)); through = Math.max(through, b); }
    return covered / (end - start);
  };
  return sources.every(source => [0, 1, 2, 3].every(day => fraction(now - (day + 1) * DAY, now - day * DAY, source) >= 0.8));
}

export function newsHotspots(articles: NewsArticle[], match: (article: NewsArticle) => string[], countries: CountryData[], centroids: Map<string, [number, number]>, hours: number, now = Date.now(), options: NewsOptions = {}) {
  const geography = options.geography ?? 'mentioned';
  const archive = cleanArticles(articles).filter(article => {
    const age = now - Date.parse(article.publishedAt);
    return age >= -300_000 && age <= Math.max(hours * 3_600_000, 4 * DAY) && (!options.sources?.length || options.sources.includes(publisherId(article))) && (!options.topic || options.topic === 'all' || newsTopic(article) === options.topic);
  });
  const events = clusterNews(archive, match);
  const visibleEvents = events.filter(event => event.articles.some(article => now - Date.parse(article.publishedAt) <= hours * 3_600_000));
  const sources = options.sources?.length ? options.sources : options.baselineSources?.length ? options.baselineSources : [...new Set(archive.map(publisherId))];
  const baselineReady = comparableHistory(options.observations ?? [], sources, now);
  const groups = new Map<string, NewsHotspot>();
  const current = new Map<string, number>(); const previous = new Map<string, number>();
  let unmapped = 0;
  const total = archive.filter(article => now - Date.parse(article.publishedAt) <= hours * 3_600_000).length;
  for (const event of events) {
    const locations: { id: string; iso3: string; name: string; coordinates: [number, number] }[] = geography === 'occurrence'
      ? event.places.filter(place => centroids.has(place.country)).map(place => ({ id: `${place.country}:${normalize(place.name)}`, iso3: place.country, name: place.coordinates ? place.name : countries.find(c => c.iso3 === place.country)?.name ?? place.country, coordinates: place.coordinates ?? centroids.get(place.country)! }))
      : event.countries.filter(iso => centroids.has(iso)).map(iso3 => ({ id: iso3, iso3, name: countries.find(c => c.iso3 === iso3)?.name ?? iso3, coordinates: centroids.get(iso3)! }));
    const visibleArticles = event.articles.filter(article => now - Date.parse(article.publishedAt) <= hours * 3_600_000);
    if (!locations.length) unmapped += visibleArticles.length;
    // Each event counts once for the baseline, even when a later article repeats it.
    const age = now - Date.parse(event.articles[event.articles.length - 1].publishedAt);
    for (const location of locations) {
      if (age < 4 * DAY) {
        const bucket = age < DAY ? current : previous;
        bucket.set(location.id, (bucket.get(location.id) ?? 0) + 1 / locations.length);
      }
      if (!visibleArticles.length) continue;
      const hotspot = groups.get(location.id) ?? { ...location, articles: [], events: [], score: 0, intensity: 0, trend: null, isNew: false, sourceCount: 0, fresh: false };
      const visibleEvent = { ...event, articles: visibleArticles, sourceCount: new Set(visibleArticles.map(publisherId)).size };
      hotspot.events.push(visibleEvent); hotspot.articles.push(...visibleArticles);
      hotspot.fresh ||= visibleArticles.some(article => article.firstSeenAt && now - Date.parse(article.firstSeenAt) >= 0 && now - Date.parse(article.firstSeenAt) < 15 * 60_000 && now - Date.parse(article.publishedAt) < 3_600_000);
      // Repeated coverage by one publisher does not amplify one event.
      hotspot.score += Math.pow(0.5, Math.max(0, now - event.latestAt) / DAY) * (1 + Math.log2(Math.min(4, visibleEvent.sourceCount))) / locations.length;
      groups.set(location.id, hotspot);
    }
  }
  const hotspots = [...groups.values()].sort((a, b) => b.score - a.score);
  const max = hotspots[0]?.score ?? 1;
  for (const hotspot of hotspots) {
    hotspot.intensity = Math.sqrt(hotspot.score / max);
    hotspot.articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    hotspot.sourceCount = new Set(hotspot.articles.map(publisherId)).size;
    const dailyAverage = (previous.get(hotspot.id) ?? 0) / 3;
    const recent = current.get(hotspot.id) ?? 0;
    // Minimum evidence prevents one headline becoming a dramatic surge.
    const recentPublishers = new Set(hotspot.articles.filter(article => now - Date.parse(article.publishedAt) < DAY).map(publisherId)).size;
    if (baselineReady && dailyAverage >= 1 && recent >= 3 && recentPublishers >= 2) hotspot.trend = Math.max(-100, (recent / dailyAverage - 1) * 100);
    hotspot.isNew = baselineReady && dailyAverage === 0 && recent >= 3 && recentPublishers >= 2;
  }
  return { hotspots, unmapped, total, eventCount: visibleEvents.length, baselineReady, sourceCount: new Set(archive.filter(article => now - Date.parse(article.publishedAt) <= hours * 3_600_000).map(publisherId)).size };
}

/** RFC4180 quotes, commas/semicolons, escaped quotes and multiline cells. */
export function csvRows(text: string): string[][] {
  const delimiter = text.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && char === delimiter) { row.push(cell); cell = ''; }
    else if (!quoted && char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (quoted) throw new Error('CSV con comillas sin cerrar.');
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

export function parseNewsImport(text: string): NewsArticle[] {
  const trimmed = text.trim().replace(/^\uFEFF/, '');
  let rows: unknown[];
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const data = JSON.parse(trimmed);
    rows = Array.isArray(data) ? data : data.articles;
    if (!Array.isArray(rows)) throw new Error('JSON: se esperaba una lista o { articles: [...] }.');
  } else if (trimmed.startsWith('<')) {
    const xml = new DOMParser().parseFromString(trimmed, 'text/xml');
    if (xml.querySelector('parsererror')) throw new Error('RSS/Atom no válido.');
    const source = xml.querySelector('channel > title, feed > title')?.textContent ?? 'RSS';
    rows = [...xml.querySelectorAll('item, entry')].slice(0, 5000).map(item => ({
      title: item.querySelector('title')?.textContent,
      url: item.querySelector('link[href]')?.getAttribute('href') ?? item.querySelector('link')?.textContent,
      publishedAt: item.querySelector('pubDate, published, updated')?.textContent,
      source, summary: (item.querySelector('description, summary')?.textContent ?? '').replace(/<[^>]*>/g, ' '),
    }));
  } else {
    const [headers, ...values] = csvRows(trimmed);
    if (!headers) throw new Error('El archivo está vacío.');
    rows = values.map(values => Object.fromEntries(headers.map((key, i) => [key.trim(), values[i] ?? ''])));
  }
  const articles = cleanArticles(rows.slice(0, 5000));
  if (!articles.length) throw new Error('No hay noticias válidas. Campos necesarios: title, url, publishedAt (fecha ISO).');
  return articles;
}
