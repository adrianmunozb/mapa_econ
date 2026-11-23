"""Build a bounded, offline PortWatch snapshot. No API key or paid service.

Default: reuse the existing snapshot. --refresh deliberately performs two GETs,
with no retries or polling. A failed/partial fetch never replaces the last snapshot.
"""
import argparse
from datetime import date, datetime, timedelta, timezone
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'app/src/data/chokepoint-traffic.json'
SERVICE = 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query'
PORTS = dict(zip(
    ['hormuz', 'malacca', 'suez', 'mandeb', 'panama', 'bosporus', 'gibraltar', 'good_hope', 'taiwan_strait'],
    ['chokepoint6', 'chokepoint5', 'chokepoint1', 'chokepoint4', 'chokepoint2', 'chokepoint3', 'chokepoint8', 'chokepoint7', 'chokepoint11'],
))


def query(**params):
    url = SERVICE + '?' + urlencode(dict(f='json', returnGeometry='false', **params))
    with urlopen(Request(url, headers={'User-Agent': 'WorldEconomicMap/1.1 (manual static snapshot)'}), timeout=30) as response:
        payload = json.load(response)
    if 'error' in payload:
        raise ValueError(f"PortWatch error: {payload['error']}")
    return payload


def validate_rows(rows, start, end):
    """Null observations remain missing; zeros are valid observed counts."""
    seen = set()
    result = {key: [] for key in PORTS}
    reverse = {value: key for key, value in PORTS.items()}
    for row in rows:
        day = date.fromisoformat(row['date'][:10])
        port = row['portid']
        value = row['n_total']
        if port not in reverse or not start <= day <= end:
            raise ValueError('Unexpected port or date')
        if (port, day) in seen:
            raise ValueError('Duplicate port/date')
        seen.add((port, day))
        if value is not None and (type(value) is not int or value < 0):
            raise ValueError('Invalid transit count')
        result[reverse[port]].append({'date': day.isoformat(), 'vessels': value})
    expected_days = (end - start).days + 1
    if any(len(series) != expected_days for series in result.values()):
        raise ValueError('Missing chokepoint/day: retaining previous snapshot')
    return {key: sorted(series, key=lambda row: row['date']) for key, series in result.items()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    if OUTPUT.exists() and not args.refresh:
        print(f'Reusing {OUTPUT.name}; use --refresh for two public API requests.')
        return
    latest = query(where="portid = 'chokepoint1'", outFields='date', orderByFields='date DESC', resultRecordCount=1)
    end = min(date.fromisoformat(latest['features'][0]['attributes']['date'][:10]), datetime.now(timezone.utc).date())
    start = end - timedelta(days=89)
    ids = ','.join(f"'{value}'" for value in PORTS.values())
    payload = query(where=f"portid IN ({ids}) AND date >= DATE '{start}' AND date <= DATE '{end}'",
                    outFields='date,portid,n_total', orderByFields='date ASC,portid ASC', resultRecordCount=1000)
    if payload.get('exceededTransferLimit'):
        raise ValueError('Truncated response: retaining previous snapshot')
    series = validate_rows([feature['attributes'] for feature in payload['features']], start, end)
    snapshot = dict(source='IMF PortWatch / UN Global Platform', sourceUrl='https://portwatch.imf.org/',
                    methodologyUrl='https://portwatch.imf.org/pages/data-and-methodology',
                    termsUrl='https://www.imf.org/external/terms.htm', serviceUrl=SERVICE,
                    retrievedAt=datetime.now(timezone.utc).isoformat(), startDate=str(start), endDate=str(end), series=series)
    temp = OUTPUT.with_suffix('.tmp')
    temp.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    temp.replace(OUTPUT)
    print(f'Saved {sum(map(len, series.values()))} observations, {start} to {end}; 2 GETs, no retries.')


if __name__ == '__main__':
    main()
