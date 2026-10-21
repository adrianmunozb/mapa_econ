"""Fetch bounded RSS/Atom metadata once, preserving the last snapshot on total failure.

No keys, paid API, article scraping, background loop or LLM. Python standard library.
Run manually, then build the frontend. Feed usage is subject to publisher terms.
"""
import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import json
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FEEDS = json.loads((ROOT / 'app/src/data/news-feeds.json').read_text(encoding='utf-8'))
MAX_BYTES = 2_000_000


def parse_feed(payload, feed_url, source_name=None):
    if re.search(br'<!DOCTYPE|<!ENTITY', payload, re.I):
        raise ValueError('DTD/entity declarations are not accepted')
    root = ET.fromstring(payload)
    # Strip namespaces so RSS and Atom share the same parsing path.
    for node in root.iter():
        node.tag = node.tag.split('}')[-1]
    channel = root.find('channel')
    parent = channel if channel is not None else root
    source = source_name or parent.findtext('title') or feed_url
    output = []
    items = list(root.findall('item')) + list(parent.findall('item')) + list(parent.findall('entry'))
    items = list(dict.fromkeys(items))
    for item in items[:500]:
        title = (item.findtext('title') or '').strip()
        links = item.findall('link')
        url = next((link.get('href') or link.text or '' for link in links if link.get('rel', 'alternate') == 'alternate'), '').strip()
        date = item.findtext('pubDate') or item.findtext('published') or item.findtext('updated') or item.findtext('date')
        if not title or not url.startswith(('https://', 'http://')) or not date:
            continue
        try:
            try:
                stamp = datetime.fromisoformat(date.replace('Z', '+00:00'))
            except ValueError:
                stamp = parsedate_to_datetime(date)
            if stamp.tzinfo is None:
                stamp = stamp.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError, OverflowError):
            continue
        # Keep only headline/link/date/source; do not redistribute full RSS articles.
        output.append(dict(title=re.sub('<[^>]*>', '', title)[:600], url=url,
                           publishedAt=stamp.astimezone(timezone.utc).isoformat(), source=source))
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--feed', action='append', help='HTTPS RSS/Atom URL (repeatable, maximum 8); defaults to the shared five-publisher catalog')
    parser.add_argument('--output', type=Path, default=ROOT / 'app/src/data/news-snapshot.json')
    args = parser.parse_args()
    feeds = [dict(id=urlparse(url).hostname, name=urlparse(url).hostname, url=url) for url in dict.fromkeys(args.feed)] if args.feed else DEFAULT_FEEDS
    if len(feeds) > 8:
        parser.error('Maximum 8 feeds per run')
    articles, warnings, statuses = [], [], []
    now = datetime.now(timezone.utc)
    stamp = now.isoformat()
    try:
        previous = json.loads(args.output.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        previous = dict(articles=[], observations=[])
    for feed in feeds:
        url = feed['url']
        if not url.startswith('https://'):
            parser.error('Feed URLs must use HTTPS')
        try:
            request = Request(url, headers={'User-Agent': 'WorldEconomicMap/1.0 (personal RSS reader)'})
            with urlopen(request, timeout=15) as response:
                payload = response.read(MAX_BYTES + 1)
            if len(payload) > MAX_BYTES:
                raise ValueError('Feed exceeds 2 MB')
            parsed = parse_feed(payload, url, feed['name'])
            if not parsed:
                raise ValueError('Feed contains no valid dated news')
            articles.extend(parsed)
            statuses.append(dict(**feed, status='ok', lastSuccessAt=stamp, count=len(parsed)))
        except Exception as exc:
            warnings.append(f'{feed["name"]}: {type(exc).__name__}; prior archive retained')
            prior_source = next((s for s in previous.get('sources', []) if s['id'] == feed['id']), {})
            statuses.append(dict(**feed, status='error', lastSuccessAt=prior_source.get('lastSuccessAt'), count=0))
    if not articles:
        print('No valid news received; existing snapshot preserved. ' + '; '.join(warnings), file=sys.stderr)
        return 1
    first_seen = {a['url']: a.get('firstSeenAt') or stamp for a in previous.get('articles', [])}
    for article in articles:
        article['firstSeenAt'] = first_seen.get(article['url'], stamp)
    seen = set()
    unique = []
    combined = sorted(articles + previous.get('articles', []), key=lambda article: article['publishedAt'], reverse=True)
    for article in combined:
        date = datetime.fromisoformat(article['publishedAt'].replace('Z', '+00:00'))
        if not -300 <= (now - date).total_seconds() <= 14 * 86400:
            continue
        parsed_url = urlparse(article['url'])
        host = (parsed_url.hostname or '').removeprefix('www.')
        publisher = 'bbc' if host.endswith(('bbc.com', 'bbc.co.uk')) else next((f['id'] for f in DEFAULT_FEEDS if f['id'] in host), host)
        article['sourceId'] = publisher
        query = [(k, v) for k, v in parse_qsl(parsed_url.query) if not k.startswith('utm_') and k not in ('fbclid', 'gclid')]
        article['url'] = urlunparse(parsed_url._replace(query=urlencode(query), fragment=''))
        key = publisher + ':' + article['title'].casefold()
        if key not in seen and article['url'] not in seen:
            seen.update([key, article['url']])
            unique.append(article)
    unique.sort(key=lambda article: article['publishedAt'], reverse=True)
    observations = [o for o in previous.get('observations', []) if (now - datetime.fromisoformat(o['at'].replace('Z', '+00:00'))).total_seconds() <= 14 * 86400]
    observations.append(dict(at=stamp, sources=[s['id'] for s in statuses if s['status'] == 'ok']))
    if len(unique) > 8000:
        warnings.append('Archive limited to 8,000 news articles; historical coverage may be incomplete')
    snapshot = dict(generatedAt=stamp, articles=unique[:8000], warnings=warnings, sources=statuses, observations=observations[-1400:])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix('.tmp')
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding='utf-8')
    temporary.replace(args.output)
    print(f'{len(unique[:8000])} news articles from {sum(s["status"] == "ok" for s in statuses)}/{len(feeds)} feeds saved to {args.output}')
    for warning in warnings:
        print(warning, file=sys.stderr)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
