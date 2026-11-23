"""Official daily sovereign bond-yield series for Australia and New Zealand.

Provider functions accept the shared text downloader and curve normalizer so
the snapshot builder can isolate each source's failures.
"""
from __future__ import annotations

import csv
import io
import math
import re
from datetime import date, datetime
from html import unescape


RBA_F2_URL = 'https://www.rba.gov.au/statistics/tables/csv/f2-data.csv'
RBNZ_B2_URL = 'https://www.rbnz.govt.nz/statistics/series/%20exchange-and-interest-rates/wholesale-interest-rates'


def _number(value):
    try:
        parsed = float(str(value).strip().replace(',', '.'))
        return parsed if math.isfinite(parsed) else None
    except (TypeError, ValueError):
        return None


def _parse_date(value, formats):
    value = str(value or '').strip()
    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            pass
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def australia(download, curve, today):
    """Read RBA F2 interpolated daily Australian Government bond yields."""
    rows = list(csv.reader(io.StringIO(download(RBA_F2_URL))))
    titles = descriptions = None
    for row in rows:
        if row and row[0].strip().casefold() == 'title':
            titles = row
        elif row and row[0].strip().casefold() == 'description':
            descriptions = row
        if titles and descriptions:
            break
    if not titles or not descriptions:
        raise ValueError('RBA F2 title/description metadata not found')

    columns = {}
    for index, title in enumerate(titles[1:], 1):
        match = re.fullmatch(r'Australian Government\s+(\d+)\s+year bond', title.strip(), re.I)
        if not match:
            continue
        months = int(match.group(1)) * 12
        description = descriptions[index].strip().casefold() if index < len(descriptions) else ''
        if months in {24, 36, 60, 120} and 'yields on australian government bonds' in description:
            columns[months] = index
    if len(columns) < 2:
        raise ValueError('RBA F2 contains fewer than two supported government-bond tenors')

    observations = []
    for row in rows:
        if not row:
            continue
        period = _parse_date(row[0], ('%d-%b-%Y', '%d-%B-%Y'))
        if period is None or period > today:
            continue
        values = {months: row[index] if index < len(row) else None
                  for months, index in columns.items()}
        if sum(_number(value) is not None for value in values.values()) >= 2:
            observations.append((period, values))
    if not observations:
        raise ValueError('No dated RBA F2 observations with multiple supported tenors')

    period, values = max(observations, key=lambda item: item[0])
    return {'AUS': curve(
        'AUD', period.isoformat(), 'Reserve Bank of Australia · Statistical Table F2',
        RBA_F2_URL,
        'RBA-assessed closing yields on Australian Government bonds, interpolated at '
        '2, 3, 5 and 10 years; daily observations.',
        values,
    )}


def _cell_text(markup):
    text = unescape(re.sub(r'<[^>]+>', ' ', markup))
    return ' '.join(text.replace('\xa0', ' ').split())


def _html_tables(document):
    tables = []
    for table in re.findall(r'<table\b[^>]*>(.*?)</table>', document, re.I | re.S):
        rows = []
        for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', table, re.I | re.S):
            cells = [_cell_text(cell) for cell in
                     re.findall(r'<t[hd]\b[^>]*>(.*?)</t[hd]>', row, re.I | re.S)]
            if cells:
                rows.append(cells)
        if rows:
            tables.append(rows)
    return tables


def _parse_rbnz_date(value):
    return _parse_date(value, ('%d %b %Y', '%d %B %Y', '%d-%b-%Y', '%d/%m/%Y'))


def new_zealand(download, curve, today):
    """Read only the RBNZ B2 government-bond section of its daily HTML table.

    RBNZ's B2 publication also contains bank-bill, cash-rate and swap series.
    This parser requires the government-bond section label adjacent to the
    maturity headers and never treats those other sections as bond yields.
    """
    document = download(RBNZ_B2_URL)
    tenors = {'1 year': 12, '2 year': 24, '5 year': 60, '10 year': 120}
    observations = []
    for rows in _html_tables(document):
        for header_index, header in enumerate(rows):
            normalized = [re.sub(r'\s+', ' ', cell.strip().casefold()) for cell in header]
            if 'date' not in normalized:
                continue
            date_index = normalized.index('date')
            columns = {months: normalized.index(label) for label, months in tenors.items()
                       if label in normalized}
            if len(columns) != len(tenors):
                continue
            context = ' '.join(cell.casefold()
                               for previous in rows[max(0, header_index - 2):header_index]
                               for cell in previous)
            if 'secondary market government bond closing yields' not in context:
                continue

            for row in rows[header_index + 1:]:
                if max([date_index, *columns.values()]) >= len(row):
                    continue
                period = _parse_rbnz_date(row[date_index])
                if period is None or period > today:
                    continue
                values = {months: row[index] for months, index in columns.items()}
                if sum(_number(value) is not None for value in values.values()) >= 2:
                    observations.append((period, values))
    if not observations:
        raise ValueError('No RBNZ B2 table rows with a government-bond header and multiple tenors')

    period, values = max(observations, key=lambda item: item[0])
    return {'NZL': curve(
        'NZD', period.isoformat(), 'Reserve Bank of New Zealand · Wholesale Interest Rates (B2)',
        RBNZ_B2_URL,
        'NZFMA indicative 5:10pm closing yields on benchmark New Zealand Government bonds '
        'at 1, 2, 5 and 10 years; daily, published with a one-business-day lag.',
        values,
    )}


PROVIDERS = (australia, new_zealand)
