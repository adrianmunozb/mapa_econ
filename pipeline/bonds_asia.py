"""Official, free Asia-Pacific sovereign-yield sources for build_bonds.

Each provider accepts the shared cached ``download`` and ``curve`` helpers and
returns one ISO-3 country record. Sources are read-only; there are no API keys,
paid services, retries, or unbounded fallback loops.
"""
from __future__ import annotations

import csv
from datetime import date, datetime, timedelta
from html import unescape
from html.parser import HTMLParser
import io
import json
import math
import re
import requests


SUPPORTED_MONTHS = {
    3, 6, 12, 24, 36, 60, 84, 120, 180, 240, 300, 360, 480, 600,
}


def _number(value):
    try:
        parsed = float(str(value).strip())
        return parsed if math.isfinite(parsed) else None
    except (TypeError, ValueError):
        return None


def _curve_record(curve, currency, period, source, url, method, values):
    if len(values) < 2:
        raise ValueError('Fewer than two valid tenor yields')
    return curve(currency, period, source, url, method, values)


def parse_japan_csv(text: str, today: date):
    """Return the latest complete-enough MOF JGB observation as (date, values)."""
    rows = list(csv.reader(io.StringIO(text.lstrip('\ufeff'))))
    header_index = next((i for i, row in enumerate(rows)
                         if row and row[0].strip().lower() == 'date'), None)
    if header_index is None:
        raise ValueError('Japanese MOF CSV has no Date header')

    terms = {}
    for column, label in enumerate(rows[header_index][1:], start=1):
        match = re.fullmatch(r'\s*(\d+)\s*Y\s*', label, re.I)
        if match:
            months = int(match[1]) * 12
            if months in SUPPORTED_MONTHS:
                terms[column] = months
    observations = []
    for row in rows[header_index + 1:]:
        if not row:
            continue
        try:
            observed = datetime.strptime(row[0].strip(), '%Y/%m/%d').date()
        except ValueError:
            continue
        if observed > today:
            continue
        values = {months: row[column].strip()
                  for column, months in terms.items() if column < len(row)
                  and _number(row[column]) is not None}
        if len(values) >= 2:
            observations.append((observed, values))
    if not observations:
        raise ValueError('Japanese MOF CSV has no dated multi-tenor JGB yields')
    observed, values = max(observations, key=lambda item: item[0])
    return observed.isoformat(), values


class _TargetTableParser(HTMLParser):
    """Collect rows and cell classes from one identified HTML table."""

    def __init__(self, table_id: str):
        super().__init__(convert_charrefs=True)
        self.table_id = table_id
        self.table_depth = 0
        self.target_depth = None
        self.rows = []
        self.row = None
        self.cell = None

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == 'table':
            next_depth = self.table_depth + 1
            if self.target_depth is None and attributes.get('id') == self.table_id:
                self.target_depth = next_depth
            self.table_depth = next_depth
            return
        if self.target_depth is None or self.table_depth != self.target_depth:
            return
        if tag == 'tr':
            self.row = []
        elif tag in ('td', 'th') and self.row is not None:
            classes = tuple(attributes.get('class', '').split())
            self.cell = {'classes': classes, 'text': ''}

    def handle_data(self, data):
        if self.cell is not None:
            self.cell['text'] += data

    def handle_endtag(self, tag):
        if self.target_depth is not None and self.table_depth == self.target_depth:
            if tag in ('td', 'th') and self.cell is not None:
                self.cell['text'] = self.cell['text'].strip()
                self.row.append(self.cell)
                self.cell = None
            elif tag == 'tr' and self.row is not None:
                self.rows.append(self.row)
                self.row = None
        if tag == 'table':
            self.table_depth = max(0, self.table_depth - 1)
            if self.target_depth is not None and self.table_depth < self.target_depth:
                self.target_depth = None


def parse_singapore_html(text: str, today: date):
    """Read MAS daily SGS benchmark yields, keeping the page's labelled terms."""
    parser = _TargetTableParser('ContentPlaceHolder1_ClosingLevelsTable')
    parser.feed(text)
    # The first two yields are sovereign 6-month and 1-year Treasury bills;
    # the remaining values are benchmark SGS bonds in the displayed order.
    months_by_yield_column = (6, 12, 24, 60, 120, 180, 240, 360, 600)
    observations = []
    for row in parser.rows:
        date_cell = next((cell for cell in row if 'date' in cell['classes']), None)
        if date_cell is None:
            continue
        try:
            observed = datetime.strptime(date_cell['text'], '%d %b %Y').date()
        except ValueError:
            continue
        if observed > today:
            continue
        yields = [cell['text'] for cell in row if 'yield' in cell['classes']]
        if len(yields) != len(months_by_yield_column):
            raise ValueError('MAS yield-column layout changed; refusing to assign incorrect maturities')
        values = {months: yields[index] for index, months in enumerate(months_by_yield_column)
                  if index < len(yields) and _number(yields[index]) is not None}
        if len(values) >= 2:
            observations.append((observed, values))
    if not observations:
        raise ValueError('MAS page has no dated multi-tenor SGS benchmark yields')
    observed, values = max(observations, key=lambda item: item[0])
    return observed.isoformat(), values


def parse_malaysia_html(text: str, today: date):
    """Read Bank Negara Malaysia's dated conventional MGS benchmark closes."""
    parser = _TargetTableParser('mgs-table')
    parser.feed(text)
    plain = re.sub(r'<[^>]+>', ' ', text)
    date_match = re.search(r'Trading\s+Date:\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})', plain, re.I)
    if not date_match:
        raise ValueError('BNM benchmark-yields page has no trading date')
    observed = datetime.strptime(date_match[1], '%d %b %Y').date()
    if observed > today:
        raise ValueError('BNM benchmark-yields page has a future trading date')

    values = {}
    for row in parser.rows:
        tenor = next((cell['text'] for cell in row if 'tenor' in cell['classes']), None)
        close = next((cell['text'] for cell in row if 'tra_yie_close' in cell['classes']), None)
        match = re.fullmatch(r'(\d+)\s*Y', tenor or '', re.I)
        if not match or close is None:
            continue
        months = int(match[1]) * 12
        # Asterisks identify last-traded observations on BNM's page.
        value = _number(close.replace('*', '').strip())
        if months in SUPPORTED_MONTHS and value is not None:
            values[months] = value
    if len(values) < 2:
        raise ValueError('BNM page has fewer than two valid MGS benchmark yields')
    return observed.isoformat(), values


def parse_china_json(text: str, today: date):
    """Read exact tenor points from the official MOF-China/ChinaBond curve."""
    payload = json.loads(text)
    if not isinstance(payload, list):
        raise ValueError('ChinaBond curve response is not a list')
    observations = []
    for record in payload:
        if not isinstance(record, dict):
            continue
        try:
            observed = date.fromisoformat(str(record.get('worktime', ''))[:10])
        except ValueError:
            continue
        if observed > today:
            continue
        values = {}
        for point in record.get('seriesData', []):
            if not isinstance(point, (list, tuple)) or len(point) < 2:
                continue
            years, yield_value = _number(point[0]), _number(point[1])
            if years is None or yield_value is None:
                continue
            months = round(years * 12)
            # Keep only tenors explicitly present in the official curve grid;
            # this avoids generating interpolated points locally.
            if months in SUPPORTED_MONTHS and math.isclose(years, months / 12, abs_tol=1e-9):
                values[months] = yield_value
        if len(values) >= 2:
            observations.append((observed, values))
    if not observations:
        raise ValueError('ChinaBond response has no dated exact multi-tenor points')
    observed, values = max(observations, key=lambda item: item[0])
    return observed.isoformat(), values


def japan(download, curve, today: date):
    url = 'https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv'
    period, values = parse_japan_csv(download(url), today)
    return {'JPN': _curve_record(
        curve, 'JPY', period, 'Ministry of Finance Japan · JGB interest-rate information', url,
        'Daily Japanese Government Bond yields at labelled constant maturities; '
        'selected exact tenors only.', values,
    )}


def singapore(download, curve, today: date):
    url = 'https://eservices.mas.gov.sg/Statistics/fdanet/SgsBenchmarkIssuePrices.aspx'
    period, values = parse_singapore_html(download(url), today)
    return {'SGP': _curve_record(
        curve, 'SGD', period, 'Monetary Authority of Singapore · Daily SGS Prices', url,
        'Daily closing bid yields quoted by SGS primary dealers. Includes 6-month and '
        '1-year Government Treasury Bills, then SGS benchmark bonds at labelled '
        '2-, 5-, 10-, 15-, 20-, 30- and 50-year tenors.', values,
    )}


def malaysia(download, curve, today: date):
    url = 'https://financialmarkets.bnm.gov.my/benchmark-yields'
    period, values = parse_malaysia_html(download(url), today)
    return {'MYS': _curve_record(
        curve, 'MYR', period, 'Bank Negara Malaysia · Benchmark Yields', url,
        'Daily closing trading yields for conventional Malaysian Government Securities '
        'benchmarks at provider-labelled 3-, 5-, 7- and 10-year terms. Asterisked '
        'values on the source page are last-traded observations.', values,
    )}


def china(download, curve, today: date):
    url = 'https://yield.chinabond.com.cn/cbweb-czb-web/czb/czbChartSearch'
    period, values = parse_china_json(download(url), today)
    return {'CHN': _curve_record(
        curve, 'CNY', period, 'MOF-China Government Bond Yield Curve · ChinaBond', url,
        'Official China Government Bond curve; points are the provider’s estimated '
        'curve yields at exact displayed tenors, not individual-security quotes.', values,
    )}


def thailand(download, curve, today: date):
    """Read ThaiBMA's public daily government curve at supported tenors."""
    page = 'https://www.thaibma.or.th/EN/Market/YieldCurve/Government.aspx'
    endpoint = 'https://www.thaibma.or.th/yieldcurve/gov/'
    for offset in range(6):
        period = (today - timedelta(days=offset)).isoformat()
        url = endpoint + period
        try:
            payload = json.loads(download(url))
        except requests.HTTPError as error:
            if error.response is not None and error.response.status_code in (400, 404):
                continue
            raise
        if not isinstance(payload, dict):
            continue

        by_date = {}
        for row in payload.get('Curve', []):
            if not isinstance(row, dict):
                continue
            observed = str(row.get('Asof', ''))[:10]
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', observed) or observed > today.isoformat():
                continue
            years, value = _number(row.get('X')), _number(row.get('Y'))
            if years is None or value is None:
                continue
            months = round(years * 12)
            if months in SUPPORTED_MONTHS and math.isclose(years, months / 12, abs_tol=0.005):
                by_date.setdefault(observed, {})[months] = value

        eligible = [(observed, values) for observed, values in by_date.items()
                    if len(values) >= 2]
        if eligible:
            observed, values = max(eligible, key=lambda item: item[0])
            return {'THA': _curve_record(
                curve, 'THB', observed, 'ThaiBMA · Government bond yield curve', page,
                'Daily provider-published government yield curve based on primary-dealer '
                'bid quotes, trimmed at both tails; provider points are matched to the '
                'nearest supported standard tenor within 0.005 years. Short Treasury-bill '
                'yields use the provider’s bond-equivalent conversion.',
                values,
            )}
    raise ValueError('ThaiBMA returned no recent daily government yield curve')


def parse_hong_kong_html(text: str, today: date):
    """Read HKMA's latest published 10-year government-bond yield."""
    observations = []
    for row in re.findall(r'<tr\b.*?</tr>', text, re.I | re.S):
        cells = [re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', ' ', cell))).strip()
                 for cell in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row, re.I | re.S)]
        if len(cells) < 4:
            continue
        label = re.sub(r'^\*+\s*', '', cells[0]).strip().casefold()
        if label != 'government bond yield - 10-year':
            continue
        try:
            observed = datetime.strptime(cells[2], '%b/%y')
        except ValueError as error:
            raise ValueError('HKMA 10-year row has an unknown observation month') from error
        period = observed.strftime('%Y-%m')
        if period <= today.strftime('%Y-%m'):
            value = _number(cells[3])
            if value is not None:
                observations.append((period, value))
    if not observations:
        raise ValueError('HKMA page has no dated 10-year government-bond yield')
    return max(observations, key=lambda item: item[0])


def hong_kong(download, curve, today: date):
    url = 'https://www.hkma.gov.hk/eng/data-publications-and-research/data-and-statistics/economic-financial-data-for-hong-kong'
    period, value = parse_hong_kong_html(download(url), today)
    return {'HKG': curve(
        'HKD', period, 'Hong Kong Monetary Authority', url,
        'Monthly reported government-bond yield at the provider-labelled 10-year term, in percent per annum; other maturities unavailable.',
        {120: value}, 'monthly',
    )}


def parse_taiwan_json(text: str, today: date):
    """Read CBC's monthly secondary-market 10-year government-bond rate."""
    payload = json.loads(text)
    data = payload.get('data', {})
    labels = data.get('structure', {}).get('Table1')
    rows = data.get('dataSets')
    if not isinstance(labels, list) or not isinstance(rows, list):
        raise ValueError('Taiwan CBC response has no Table1 labels or observations')
    target = "Bond market-10-year gov't bond rates in secondary market"
    column = next((index for index, item in enumerate(labels)
                   if isinstance(item, dict) and item.get('data') == target), None)
    if column is None:
        raise ValueError('Taiwan CBC response has no secondary-market 10-year series')

    observations = []
    for row in rows:
        if not isinstance(row, list) or len(row) <= column + 1:
            continue
        match = re.fullmatch(r'(\d{4})M(\d{2})', str(row[0]))
        if not match:
            continue
        period = f'{match[1]}-{match[2]}'
        value = _number(row[column + 1])
        if period <= today.strftime('%Y-%m') and value is not None:
            observations.append((period, value))
    if not observations:
        raise ValueError('Taiwan CBC response has no dated secondary-market 10-year yields')
    return max(observations, key=lambda item: item[0])


def taiwan(download, curve, today: date):
    url = 'https://cpx.cbc.gov.tw/API/DataAPI/Get?FileName=EG43M01en'
    period, value = parse_taiwan_json(download(url), today)
    return {'TWN': curve(
        'TWD', period, 'Central Bank of the Republic of China (Taiwan) · statistical database', url,
        'Monthly secondary-market 10-year government-bond rate. The central bank defines its long-term yield as the weighted average yield on the most actively traded 10-year government bonds; other maturities unavailable.',
        {120: value}, 'monthly',
    )}


def parse_bangladesh_html(text: str, today: date):
    """Read Bangladesh Bank's latest standard-tenor government-bond yields."""
    block = re.search(
        r'Cut-off and Standard Tenor Yield of T-Bonds\s*<br\s*/?>\s*'
        r'(\d{1,2}\s+[A-Za-z]{3},\s*\d{4}).*?<table[^>]*>(.*?)</table>',
        text, re.I | re.S,
    )
    if not block:
        raise ValueError('Bangladesh Bank standard-tenor yield table was not found')
    try:
        period = datetime.strptime(block[1].strip(), '%d %b, %Y').date()
    except ValueError as error:
        raise ValueError('Bangladesh Bank standard-tenor date was not recognized') from error
    if period > today:
        raise ValueError('Bangladesh Bank standard-tenor yield date is in the future')

    values = {}
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', block[2], re.I | re.S):
        cells = [unescape(re.sub(r'<[^>]+>', '', cell)).strip()
                 for cell in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row, re.I | re.S)]
        if len(cells) != 4:
            continue
        try:
            months = round(float(cells[2]) * 12)
            value = _number(cells[3])
        except ValueError:
            continue
        if months in SUPPORTED_MONTHS and value is not None:
            values[months] = value
    if len(values) < 2:
        raise ValueError('Bangladesh Bank returned fewer than two standard-tenor yields')
    return period.isoformat(), values


def bangladesh(download, curve, today: date):
    url = 'https://www.bb.org.bd/en/index.php/monetaryactivity/treasury'
    period, values = parse_bangladesh_html(download(url), today)
    return {'BGD': curve(
        'BDT', period, 'Bangladesh Bank · Cut-off and Standard Tenor Yield of T-Bonds', url,
        'Standard-tenor Treasury-bond yields (2, 5, 10, 15 and 20 years) published with Bangladesh Bank auction results.',
        values, 'auction',
    )}


PROVIDERS = (japan, singapore, china, malaysia, thailand, hong_kong, taiwan, bangladesh)
