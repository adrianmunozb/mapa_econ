// Vercel serverless function: live RSS headlines for the Actualidad section.
// Reuses the dev-server reader (same feeds, size limits and sanitising in cleanArticles).
// The archive lives in the function's temp dir; a cold start starts from the bundled
// snapshot, so a failing feed never empties the page.
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createNewsService } from '../app/scripts/news-feed.mjs';

const service = createNewsService({ cachePath: join(tmpdir(), 'wem-news-history.json') });

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.end();
    return;
  }
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Browsers and the CDN may reuse a response for 15 minutes, the feeds' refresh interval.
  response.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600');
  try {
    response.end(JSON.stringify(await service.get()));
  } catch {
    response.statusCode = 503;
    response.end(JSON.stringify({ error: 'RSS temporarily unavailable' }));
  }
}
