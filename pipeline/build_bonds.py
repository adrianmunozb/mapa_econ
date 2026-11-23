"""Build a free, dated sovereign-yield snapshot. Run manually; never from the UI.

Public official downloads only. Each URL is cached for 24 hours, has a 30s
timeout and no automatic retries. A failed provider preserves its previous
country records. Curves use one observation date per country, never a mixture
of latest observations. No interpolation or policy-rate proxies are generated.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import re
from datetime import date, datetime, timedelta, timezone
from functools import partial
from html import unescape
from pathlib import Path
from urllib.parse import urlencode
import xml.etree.ElementTree as ET

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'app/src/data/bonds-snapshot.json'
CACHE = ROOT / 'pipeline/.cache/bonds'
TODAY = date.today()
SUPPORTED_MONTHS = {3, 6, 12, 24, 36, 60, 84, 120, 180, 240, 300, 360, 480, 600}


def download(url: str) -> str:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.txt')
    if path.exists() and datetime.now().timestamp() - path.stat().st_mtime < 86400:
        return path.read_text(encoding='utf-8')
    response = requests.get(url, timeout=30, headers={'User-Agent': 'WorldEconomicMap/1.0 (official statistics snapshot)'})
    response.raise_for_status()
    text = response.content.decode('utf-8-sig', errors='replace')
    path.write_text(text, encoding='utf-8')
    return text


def download_bytes(url: str) -> bytes:
    """Fetch and cache a public binary source using the same bounded policy."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.bin')
    if path.exists() and datetime.now().timestamp() - path.stat().st_mtime < 86400:
        return path.read_bytes()
    response = requests.get(url, timeout=30, headers={'User-Agent': 'WorldEconomicMap/1.0 (official statistics snapshot)'})
    response.raise_for_status()
    path.write_bytes(response.content)
    return response.content


def download_form(url: str, data: dict[str, str], referer: str) -> str:
    """POST one public result-form request and cache it for 24 hours."""
    CACHE.mkdir(parents=True, exist_ok=True)
    body = urlencode(data)
    key = hashlib.sha256((url + '\n' + body).encode()).hexdigest()
    path = CACHE / (key + '.txt')
    if path.exists() and datetime.now().timestamp() - path.stat().st_mtime < 86400:
        return path.read_text(encoding='utf-8')
    response = requests.post(url, data=data, timeout=30, headers={
        'User-Agent': 'WorldEconomicMap/1.0 (official statistics snapshot)',
        'X-Requested-With': 'XMLHttpRequest', 'Referer': referer,
    })
    response.raise_for_status()
    text = response.content.decode('utf-8-sig', errors='replace')
    path.write_text(text, encoding='utf-8')
    return text


def number(value):
    try:
        value = float(value)
        return value if math.isfinite(value) else None
    except (ValueError, TypeError):
        return None


def curve(currency, period, source, url, method, values, frequency='daily'):
    points = [{'months': int(months), 'yield': value} for months, raw in values.items()
              if int(months) in SUPPORTED_MONTHS and (value := number(raw)) is not None]
    if not points:
        raise ValueError('No valid yield observations')
    if date.fromisoformat(period + '-01' if len(period) == 7 else period) > TODAY:
        raise ValueError('Future observation')
    return dict(currency=currency, date=period, frequency=frequency,
                source={'name': source, 'url': url, 'license': 'Official data; attribution required'},
                method=method, points=sorted(points, key=lambda p: p['months']))


def us():
    url = ('https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml'
           f'?data=daily_treasury_yield_curve&field_tdr_date_value={TODAY.year}')
    rows = []
    for entry in ET.fromstring(download(url)).iter():
        if entry.tag.rsplit('}', 1)[-1] != 'properties':
            continue
        fields = {child.tag.rsplit('}', 1)[-1]: child.text for child in entry}
        period = (fields.get('NEW_DATE') or '')[:10]
        if period and period <= TODAY.isoformat():
            values = {months: fields.get(key) for key, months in {
                'BC_3MONTH': 3, 'BC_6MONTH': 6, 'BC_1YEAR': 12, 'BC_2YEAR': 24,
                'BC_3YEAR': 36, 'BC_5YEAR': 60, 'BC_7YEAR': 84, 'BC_10YEAR': 120,
                'BC_20YEAR': 240, 'BC_30YEAR': 360}.items()}
            if sum(number(v) is not None for v in values.values()) >= 2:
                rows.append((period, values))
    period, values = max(rows)
    return {'USA': curve('USD', period, 'U.S. Treasury', url, 'Treasury par yields at constant maturities.', values)}


def canada():
    series = {f'BD.CDN.{years}YR.DQ.YLD': years * 12 for years in (2, 3, 5, 7, 10)}
    url = f'https://www.bankofcanada.ca/valet/observations/{",".join(series)}/json?recent=10'
    rows = json.loads(download(url))['observations']
    row = max((r for r in rows if r['d'] <= TODAY.isoformat()
               and all(number(r.get(key, {}).get('v')) is not None for key in series)), key=lambda r: r['d'])
    return {'CAN': curve('CAD', row['d'], 'Bank of Canada', url,
                         'Selected Government of Canada benchmark bond closing yields; approximate maturities.',
                         {months: row[key]['v'] for key, months in series.items()})}


def spain():
    url = 'https://www.bde.es/webbe/es/estadisticas/compartido/datos/csv/be2207.csv'
    rows = list(csv.reader(io.StringIO(download(url))))
    series = {'DMPDSTIBEORCFE00912A01277TIRMEP.M': 36,
              'DMPDSTIBEORCFE01643A02007TIRMEP.M': 60,
              'DMPDSTIBEORCFE03467A03832TIRMEP.M': 120,
              'DMPDSTIBEORCFE05292A05657TIRMEP.M': 180,
              'DMPDSTIBEORCFE10737A11132TIRMEP.M': 360}
    columns = {rows[0].index(key): months for key, months in series.items()}
    months = 'ENE FEB MAR ABR MAY JUN JUL AGO SEP OCT NOV DIC'.split()
    observations = []
    for row in rows:
        match = re.fullmatch(r'([A-Z]{3}) (\d{4})', row[0])
        if not match or match[1] not in months:
            continue
        period = f'{match[2]}-{months.index(match[1]) + 1:02d}'
        values = {term: row[column] for column, term in columns.items()}
        if period <= TODAY.strftime('%Y-%m') and all(number(v) is not None for v in values.values()):
            observations.append((period, values))
    period, values = max(observations)
    return {'ESP': curve('EUR', period, 'Banco de España · table 22.7', url,
                         'Monthly weighted secondary-market yields in residual-maturity bands: '
                         '2.5–3.5, 4.5–5.5, 9.5–10.5, 14.5–15.5 and 29.5–30.5 years. Plotted at band centres.',
                         values, 'monthly')}


def france():
    # At most five publication pages, including weekends/holidays; no endless fallback.
    for offset in range(1, 6):
        day = TODAY - timedelta(days=offset)
        url = 'https://www.banque-france.fr/fr/statistiques/taux-et-cours/indices-obligataires-' + day.isoformat()
        try:
            html = download(url)
        except requests.HTTPError as error:
            if error.response.status_code == 404:
                continue
            raise
        table = re.search(r'<table\b.*?</table>', html, re.S)
        if not table:
            continue
        rows = [[unescape(re.sub('<[^>]+>', '', cell)).strip() for cell in
                 re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row, re.S)]
                for row in re.findall(r'<tr\b.*?</tr>', table[0], re.S)]
        dates = [datetime.strptime(v, '%d/%m/%Y').date().isoformat()
                 for v in rows[0] if re.fullmatch(r'\d{2}/\d{2}/\d{4}', v)]
        values = {int(row[0][3:]) * 12: row[-1].replace(',', '.')
                  for row in rows[1:] if row and re.fullmatch(r'TEC\d+', row[0])}
        return {'FRA': curve('EUR', dates[-1], 'Banque de France · CNO-TEC', url,
                             'Constant-maturity actuarial Treasury yields (CNO-TEC; interpolated by the provider).', values)}
    raise ValueError('No recent French publication found')


def germany():
    histories = {}
    for years in (1, 2, 3, 5, 7, 10, 15, 20, 30):
        key = f'D.I.ZST.ZI.EUR.S1311.B.A604.R{years:02d}XX.R.A.A._Z._Z.A'
        url = f'https://api.statistiken.bundesbank.de/rest/download/BBSIS/{key}?format=csv&lang=en'
        histories[years * 12] = {row[0]: number(row[1]) for row in csv.reader(io.StringIO(download(url)))
                                if len(row) > 1 and re.fullmatch(r'\d{4}-\d{2}-\d{2}', row[0])
                                and row[0] <= TODAY.isoformat() and number(row[1]) is not None}
    common = set.intersection(*(set(h) for h in histories.values()))
    period = max(common)
    return {'DEU': curve('EUR', period, 'Deutsche Bundesbank',
                         'https://www.bundesbank.de/en/statistics/money-and-capital-markets/interest-rates-and-yields/daily-term-structure-on-listed-federal-securities-651570',
                         'Estimated zero-coupon spot yields on German federal securities, Svensson method.',
                         {term: history[period] for term, history in histories.items()})}


# OECD 10-year monthly averages via the St. Louis Fed's public CSV download.
OECD = {
    'AU': ('AUS', 'AUD'), 'AT': ('AUT', 'EUR'), 'BE': ('BEL', 'EUR'), 'CZ': ('CZE', 'CZK'),
    'DK': ('DNK', 'DKK'), 'FI': ('FIN', 'EUR'), 'GR': ('GRC', 'EUR'), 'HU': ('HUN', 'HUF'),
    'IE': ('IRL', 'EUR'), 'IT': ('ITA', 'EUR'), 'JP': ('JPN', 'JPY'), 'KR': ('KOR', 'KRW'),
    'NL': ('NLD', 'EUR'), 'NZ': ('NZL', 'NZD'), 'NO': ('NOR', 'NOK'), 'PL': ('POL', 'PLN'),
    'PT': ('PRT', 'EUR'), 'SK': ('SVK', 'EUR'), 'SI': ('SVN', 'EUR'), 'SE': ('SWE', 'SEK'),
    'CH': ('CHE', 'CHF'), 'GB': ('GBR', 'GBP'),
    'LU': ('LUX', 'EUR'), 'IS': ('ISL', 'ISK'), 'IL': ('ISR', 'ILS'), 'ZA': ('ZAF', 'ZAR'),
    'CL': ('CHL', 'CLP'), 'MX': ('MEX', 'MXN'),
}

# FRED's newer OECD identifiers for countries whose monthly series no longer
# follow the legacy IRLTLT01{ISO2}M156N naming convention.
OECD_EXTRA_SERIES = {
    'COLIRLTLT01STM': ('COL', 'COP'),
    'CRIIRLTLT01STM': ('CRI', 'CRC'),
    'INDIRLTLT01STM': ('IND', 'INR'),
    'LVAIRLTLT01STM': ('LVA', 'EUR'),
    'LTUIRLTLT01STM': ('LTU', 'EUR'),
}

EUROSTAT_ADDITIONS = {
    'BG': ('BGR', 'EUR'), 'EE': ('EST', 'EUR'), 'HR': ('HRV', 'EUR'),
    'CY': ('CYP', 'EUR'), 'MT': ('MLT', 'EUR'), 'RO': ('ROU', 'RON'),
}


def oecd():
    result = {}
    # Small bounded batches; an unavailable series cannot erase other providers.
    series = {f'IRLTLT01{code}M156N': info for code, info in OECD.items()}
    series.update(OECD_EXTRA_SERIES)
    items = list(series.items())
    for start in range(0, len(items), 7):
        batch = dict(items[start:start + 7])
        url = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=' + ','.join(batch)
        try:
            rows = list(csv.DictReader(io.StringIO(download(url))))
        except requests.HTTPError as error:
            if error.response.status_code != 404:
                raise
            # A missing OECD series invalidates FRED's whole batch. Isolate
            # each series once, preserving successful countries (no retries).
            rows = []
            for key in batch:
                try:
                    rows.extend(csv.DictReader(io.StringIO(download(
                        'https://fred.stlouisfed.org/graph/fredgraph.csv?id=' + key))))
                except requests.HTTPError as single_error:
                    if single_error.response.status_code != 404:
                        raise
                    print('Unavailable OECD series:', key)
        for key, (iso, currency) in batch.items():
            valid = [(r['observation_date'][:7], r.get(key)) for r in rows
                     if r['observation_date'] <= TODAY.isoformat() and number(r.get(key)) is not None]
            if valid:
                period, value = max(valid)
                result[iso] = curve(currency, period, 'OECD · Main Economic Indicators via FRED',
                                     'https://fred.stlouisfed.org/series/' + key,
                                     '10-year government benchmark yield, monthly average. Other maturities unavailable.',
                                     {120: value}, 'monthly')
    return result


def eurostat():
    """Fetch missing EU 10-year yields from the Eurostat/ECB monthly series."""
    url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/teimf050?lang=en'
    payload = json.loads(download(url))
    dimensions = payload.get('dimension', {})
    ids = payload.get('id', [])
    sizes = payload.get('size', [])
    if 'geo' not in ids or 'time' not in ids or len(ids) != len(sizes):
        raise ValueError('Eurostat teimf050 dimensions changed')

    def category_index(name):
        category = dimensions.get(name, {}).get('category', {}).get('index')
        if not isinstance(category, dict):
            raise ValueError(f'Eurostat teimf050 {name} index is unavailable')
        return category

    geo_index = category_index('geo')
    time_index = category_index('time')
    choices = {
        name: next(iter(category_index(name)))
        for name in ids if name not in ('geo', 'time')
    }
    choices['freq'] = 'M'
    choices['int_rt'] = 'MCBY'
    selected = dict(EUROSTAT_ADDITIONS)
    values = payload.get('value', {})
    result = {}

    for code, (iso, currency) in selected.items():
        if code not in geo_index:
            continue
        observations = []
        for period in time_index:
            if period > TODAY.strftime('%Y-%m'):
                continue
            coordinates = []
            usable = True
            for name in ids:
                if name == 'geo':
                    category, key = geo_index, code
                elif name == 'time':
                    category, key = time_index, period
                else:
                    category, key = category_index(name), choices.get(name)
                if key not in category:
                    usable = False
                    break
                coordinates.append(category[key])
            if not usable:
                continue
            flat_index = 0
            for position, size in zip(coordinates, sizes):
                flat_index = flat_index * size + position
            observation = number(values.get(str(flat_index)))
            if observation is not None:
                observations.append((period, observation))
        if observations:
            period, observation = max(observations, key=lambda item: item[0])
            result[iso] = curve(
                currency, period, 'Eurostat · EMU convergence criterion bond yields', url,
                'Monthly average central-government secondary-market yield, gross of tax, '
                'on bonds with around 10 years’ residual maturity; source: ECB.',
                {120: observation}, 'monthly',
            )
    return result


def peru():
    """Fetch BCRPData's monthly 10-year Peruvian-sovereign yield series."""
    url = (f'https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD31895MM/json/'
           f'2020-1/{TODAY.year}-{TODAY.month}/ing')
    payload = json.loads(download(url))
    month_number = {name: index for index, name in enumerate(
        'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(), start=1)}
    observations = []
    for item in payload.get('periods', []):
        if not isinstance(item, dict):
            continue
        match = re.fullmatch(r'([A-Za-z]{3})\.(\d{4})', str(item.get('name', '')))
        values = item.get('values')
        if not match or match[1] not in month_number or not isinstance(values, list) or not values:
            continue
        period = f'{match[2]}-{month_number[match[1]]:02d}'
        value = number(values[0])
        if period <= TODAY.strftime('%Y-%m') and value is not None:
            observations.append((period, value))
    if not observations:
        raise ValueError('BCRPData returned no dated Peruvian 10-year bond yields')
    period, value = max(observations, key=lambda item: item[0])
    return {'PER': curve(
        'PEN', period, 'BCRPData · Ministry of Economy and Finance', url,
        'Monthly 10-year Peruvian government-bond yield in soles, sourced from the Ministry of Economy and Finance; other maturities unavailable.',
        {120: value}, 'monthly',
    )}


def refresh_providers(previous, providers):
    """Keep providers independent and never let a 10Y fallback erase a curve.

    A successful multi-tenor fetch can replace another method/date wholesale;
    points from different providers or dates are never spliced together.
    """
    countries = dict(previous)
    warnings = []
    for name, fetch in providers:
        try:
            update = fetch()
            for iso, incoming in update.items():
                current = countries.get(iso)
                if current and len(current['points']) > 1 and len(incoming['points']) == 1:
                    continue
                countries[iso] = incoming
            print(name, len(update), 'countries')
        except Exception as error:
            warnings.append(f'{name}: {error}')
            print('WARNING', warnings[-1])
    return countries, warnings


def main():
    from bonds_africa import botswana, tanzania, zambia
    from bonds_asia import PROVIDERS as ASIA_PROVIDERS
    from bonds_europe import PROVIDERS as EUROPE_PROVIDERS
    from bonds_oceania import PROVIDERS as OCEANIA_PROVIDERS

    previous = json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {'countries': {}}
    # Reviewed official-page observations bootstrap sources whose public pages
    # are readable but block the build host's automated requests. Keep the
    # observation date and provenance, and never overwrite a newer saved curve.
    seeds = json.loads((Path(__file__).parent / 'bond-seeds.json').read_text(encoding='utf-8'))
    for iso, seed in seeds.items():
        current = previous['countries'].get(iso)
        if current and current['date'] >= seed['date'] and len(current['points']) > 1:
            continue
        record = curve(seed['currency'], seed['date'], seed['source'], seed['url'], seed['method'], seed['values'])
        record['retrieval'] = seed['retrieval']
        record['retrievedAt'] = seed['retrievedAt']
        previous['countries'][iso] = record
    providers = [(fetch.__name__, fetch) for fetch in (oecd, eurostat, us, canada, spain, france, germany, peru)]
    providers.extend((fetch.__name__, partial(fetch, download, curve, TODAY))
                     for fetch in (*EUROPE_PROVIDERS, *ASIA_PROVIDERS, *OCEANIA_PROVIDERS))
    providers.append(('botswana', partial(botswana, download, download_bytes, curve, TODAY, SUPPORTED_MONTHS)))
    providers.append(('zambia', partial(zambia, download, curve, TODAY, SUPPORTED_MONTHS)))
    providers.append(('tanzania', partial(tanzania, download, download_form, curve, TODAY, SUPPORTED_MONTHS)))
    countries, warnings = refresh_providers(previous['countries'], providers)
    if not countries:
        raise RuntimeError('No data; existing file preserved')
    payload = dict(generatedAt=datetime.now(timezone.utc).isoformat(), countries=countries, warnings=warnings)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Saved', len(countries), 'countries to', OUT)


if __name__ == '__main__':
    main()
