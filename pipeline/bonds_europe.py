"""Official, free European sovereign yield curve providers.

Each provider is independent so callers can retain successful country curves
when another source is unavailable. The providers use observed source tenors
only; they do not interpolate or substitute policy rates.
"""
from __future__ import annotations

import hashlib
import io
import json
import math
import posixpath
import re
import time
import zipfile
from datetime import date, datetime, timedelta
from html import unescape
from pathlib import Path
import xml.etree.ElementTree as ET

import requests


RIKSBANK_URL = 'https://api.riksbank.se/swea/v1/Observations/Latest/ByGroup/7'
NORGES_URL = 'https://www.norges-bank.no/en/topics/Statistics/norwegian-government-securities/generiske-statsrenter/'
SNB_PAGE = 'https://data.snb.ch/en/topics/ziredev/cube/rendeiduebd'
BOE_PAGE = 'https://www.bankofengland.co.uk/statistics/yield-curves'
BOE_ZIP = 'https://www.bankofengland.co.uk/-/media/boe/files/statistics/yield-curves/latest-yield-curve-data.zip'

SUPPORTED_MONTHS = frozenset((3, 6, 12, 24, 36, 60, 84, 120, 180, 240, 300, 360, 480, 600))
_BOE_CACHE = Path(__file__).resolve().parent / '.cache' / 'bonds'
_BOE_MAX_BYTES = 5 * 1024 * 1024


def _number(value):
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else None
    except (TypeError, ValueError):
        return None


def _date_text(value):
    if isinstance(value, datetime):
        value = value.date()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, str):
        return value[:10]
    return None


def sweden(download, curve, today):
    """Fetch Riksbank Swedish government benchmark yields in one API call."""
    series_months = {'SEGVB2YC': 24, 'SEGVB5YC': 60, 'SEGVB7YC': 84, 'SEGVB10YC': 120}
    rows = json.loads(download(RIKSBANK_URL))
    by_date = {}
    for row in rows:
        months = series_months.get(row.get('seriesId'))
        period = row.get('date')
        value = _number(row.get('value'))
        if months is None or not period or period > today.isoformat() or value is None:
            continue
        by_date.setdefault(period, {})[months] = value
    eligible = [(period, values) for period, values in by_date.items()
                if len(values) >= 2]
    if not eligible:
        raise ValueError('Riksbank returned fewer than two dated Swedish government yields')
    period, values = max(eligible, key=lambda item: item[0])
    return {'SWE': curve(
        'SEK', period, 'Sveriges Riksbank · SWEA API', RIKSBANK_URL,
        'Published Swedish government bond yields at 2, 5, 7 and 10 years; exact source tenors, no interpolation.',
        values,
    )}


def norway(download, curve, today):
    """Parse the current generic government yield table published by Norges Bank."""
    html = download(NORGES_URL)
    table_match = re.search(r'<table\b.*?</table>', html, re.IGNORECASE | re.DOTALL)
    if not table_match:
        raise ValueError('Norges Bank generic yields table was not found')

    rows = []
    for row_html in re.findall(r'<tr\b.*?</tr>', table_match.group(0), re.IGNORECASE | re.DOTALL):
        cells = [re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', ' ', cell))).strip()
                 for cell in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row_html,
                                        re.IGNORECASE | re.DOTALL)]
        if cells:
            rows.append(cells)
    if not rows:
        raise ValueError('Norges Bank generic yields table has no rows')

    # Norges Bank documents these as 3m, 6m, 12m Treasury bills and 3y, 5y,
    # 7y, 10y government bonds. The generic yield is the nearest security's
    # effective yield, quoted at the interdealer market mid-yield.
    months_by_column = (3, 6, 12, 36, 60, 84, 120)
    if rows[0] != ['Date', '3-month', '6-month', '12-month', '3-year', '5-year', '7-year', '10-year']:
        raise ValueError('Norges Bank table layout changed; refusing to assign incorrect maturities')
    observations = []
    for cells in rows[1:]:
        if len(cells) < len(months_by_column) + 1:
            continue
        period = cells[0][:10]
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', period) or period > today.isoformat():
            continue
        values = {months: _number(cells[index + 1])
                  for index, months in enumerate(months_by_column)}
        values = {months: value for months, value in values.items() if value is not None}
        if len(values) >= 2:
            observations.append((period, values))
    if not observations:
        raise ValueError('Norges Bank returned no usable dated generic yield curve')
    period, values = max(observations, key=lambda item: item[0])
    return {'NOR': curve(
        'NOK', period, 'Norges Bank · Generic yields', NORGES_URL,
        'Generic effective yields on the government security closest to each stated maturity; market mid-yields at close.',
        values,
    )}


def switzerland(download, curve, today):
    """Fetch SNB daily model-estimated Swiss Confederation spot yields."""
    # A 90-day window bounds the request while spanning weekends and publication
    # gaps. The SNB source returns all selected maturities and their dates in one
    # small JSON response.
    start = (today - timedelta(days=90)).isoformat()
    end = today.isoformat()
    tenor_ids = ('1J', '2J', '3J', '4J', '5J', '6J', '7J', '8J', '9J', '10J', '20J', '30J')
    months_by_id = {f'{years}J': years * 12 for years in (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30)}
    url = ('https://data.snb.ch/api/cube/rendeiduebd/data/json/en?'
           'dimSel=D0(CHF),D1(' + ','.join(tenor_ids) + f')&fromDate={start}&toDate={end}')
    payload = json.loads(download(url))
    by_date = {}
    for series in payload.get('timeseries', []):
        key = series.get('metadata', {}).get('key', '')
        match = re.search(r'\{CHF,([^}]+)\}$', key)
        if not match:
            continue
        months = months_by_id.get(match.group(1))
        if months not in SUPPORTED_MONTHS:
            continue
        for observation in series.get('values', []):
            period = observation.get('date')
            value = _number(observation.get('value'))
            if period and period <= end and value is not None:
                by_date.setdefault(period, {})[months] = value
    eligible = [(period, values) for period, values in by_date.items()
                if len(values) >= 2]
    if not eligible:
        raise ValueError('SNB returned fewer than two dated Swiss Confederation spot yields')
    period, values = max(eligible, key=lambda item: item[0])
    return {'CHE': curve(
        'CHF', period, 'Swiss National Bank · data portal', SNB_PAGE,
        'Daily Swiss Confederation spot yields estimated by the SNB with the Nelson–Siegel–Svensson model; exact published maturities.',
        values,
    )}


def _download_boe_zip(url):
    _BOE_CACHE.mkdir(parents=True, exist_ok=True)
    path = _BOE_CACHE / (hashlib.sha256(url.encode('utf-8')).hexdigest() + '.bin')
    if path.exists() and time.time() - path.stat().st_mtime < 86400:
        return path.read_bytes()

    body = bytearray()
    with requests.get(url, timeout=30, stream=True,
                      headers={'User-Agent': 'WorldEconomicMap/1.0 (official statistics snapshot)'}) as response:
        response.raise_for_status()
        for chunk in response.iter_content(chunk_size=64 * 1024):
            if not chunk:
                continue
            body.extend(chunk)
            if len(body) > _BOE_MAX_BYTES:
                raise ValueError('Bank of England latest yield-curve ZIP exceeded the 5 MiB safety limit')
    path.write_bytes(body)
    return bytes(body)


def _read_xlsx_sheets(data, wanted_names):
    """Read a few value-only sheets from an XLSX using the standard library."""
    main_ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    office_rel_ns = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    package_rel_ns = 'http://schemas.openxmlformats.org/package/2006/relationships'
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        relationships = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        targets = {relation.attrib['Id']: relation.attrib['Target']
                   for relation in relationships.findall(f'{{{package_rel_ns}}}Relationship')}
        shared_strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared_root = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            shared_strings = [''.join(item.itertext())
                              for item in shared_root.findall(f'{{{main_ns}}}si')]

        sheets = {}
        for sheet in workbook.findall(f'.//{{{main_ns}}}sheet'):
            name = sheet.attrib.get('name')
            if name not in wanted_names:
                continue
            target = targets[sheet.attrib[f'{{{office_rel_ns}}}id']]
            target = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
            root = ET.fromstring(archive.read(target))
            rows = []
            for row_element in root.findall(f'.//{{{main_ns}}}row'):
                cells = []
                for cell in row_element.findall(f'{{{main_ns}}}c'):
                    reference = cell.attrib.get('r', '')
                    letters = ''.join(character for character in reference if character.isalpha())
                    column = 0
                    for character in letters:
                        column = column * 26 + ord(character.upper()) - ord('A') + 1
                    column -= 1
                    while len(cells) <= column:
                        cells.append(None)
                    cell_type = cell.attrib.get('t')
                    value_element = cell.find(f'{{{main_ns}}}v')
                    if cell_type == 'inlineStr':
                        value = ''.join(cell.find(f'{{{main_ns}}}is').itertext())
                    elif value_element is None or value_element.text is None:
                        value = None
                    elif cell_type == 's':
                        value = shared_strings[int(value_element.text)]
                    else:
                        raw = value_element.text
                        number = _number(raw)
                        if number is None:
                            value = raw
                        elif column == 0 and number > 30000:
                            value = datetime(1899, 12, 30) + timedelta(days=number)
                        else:
                            value = number
                    cells[column] = value
                rows.append(cells)
            sheets[name] = rows
        missing = set(wanted_names) - set(sheets)
        if missing:
            raise ValueError('Bank of England workbook is missing sheets: ' + ', '.join(sorted(missing)))
        return sheets


def _sheet_values(rows, heading, today, short_end=False):
    headings = None
    for row in rows:
        first = row[0] if row else None
        if isinstance(first, str) and first.strip().lower() == heading:
            headings = row[1:]
            break
    if headings is None:
        raise ValueError(f'Bank of England workbook is missing the {heading} maturity row')

    columns = []
    for raw in headings:
        value = _number(raw)
        if value is None:
            columns.append(None)
            continue
        months = int(round(value if short_end else value * 12))
        exact = abs(value - months) < 1e-6 if short_end else abs(value * 12 - months) < 1e-6
        columns.append(months if exact and months in SUPPORTED_MONTHS else None)

    observations = {}
    for row in rows:
        if not row:
            continue
        period = _date_text(row[0])
        if not period or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', period) or period > today.isoformat():
            continue
        values = {}
        for index, months in enumerate(columns, start=1):
            if months is None or index >= len(row):
                continue
            value = _number(row[index])
            if value is not None:
                values[months] = value
        if values:
            observations[period] = values
    return observations


def united_kingdom(download, curve, today):
    """Read the Bank of England's latest official nominal spot curve workbook."""
    data = _download_boe_zip(BOE_ZIP)
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        filename = 'GLC Nominal daily data current month.xlsx'
        if filename not in archive.namelist():
            raise ValueError('Bank of England ZIP is missing the nominal government curve workbook')
        info = archive.getinfo(filename)
        if info.file_size > 16 * 1024 * 1024:
            raise ValueError('Bank of England nominal workbook exceeded the 16 MiB safety limit')
        workbook_data = archive.read(filename)
    sheets = _read_xlsx_sheets(workbook_data, ('4. spot curve', '3. spot, short end'))
    long_values = _sheet_values(sheets['4. spot curve'], 'years:', today, short_end=False)
    short_values = _sheet_values(sheets['3. spot, short end'], 'months:', today, short_end=True)

    for period, values in long_values.items():
        # Add the 3-month quoted spot yield from the separate short-end tab.
        # All points are taken from the same dated row and the source's exact
        # maturity headings.
        short = short_values.get(period, {})
        if 3 in short:
            values[3] = short[3]
    eligible = [(period, values) for period, values in long_values.items()
                if len(values) >= 2]
    if not eligible:
        raise ValueError('Bank of England workbook returned no usable dated nominal spot curve')
    period, values = max(eligible, key=lambda item: item[0])
    return {'GBR': curve(
        'GBP', period, 'Bank of England · UK nominal yield curve', BOE_PAGE,
        'Fitted nominal gilt spot yields, continuously compounded and annualised by the Bank of England; exact workbook maturities.',
        values,
    )}


def russia(download, curve, today):
    """Read the Bank of Russia's daily zero-coupon government-bond curve."""
    url = 'https://www.cbr.ru/eng/hd_base/zcyc_params/'
    html = download(url)
    table_match = re.search(r'<table\b.*?</table>', html, re.I | re.S)
    if not table_match:
        raise ValueError('Bank of Russia zero-coupon curve table was not found')

    rows = []
    for row_html in re.findall(r'<tr\b.*?</tr>', table_match.group(0), re.I | re.S):
        cells = [re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', ' ', cell))).strip()
                 for cell in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row_html, re.I | re.S)]
        if cells:
            rows.append(cells)

    maturity_headers = None
    for cells in rows:
        if not cells or any(re.fullmatch(r'\d{1,2}(?:[.,]\d+)?', cell) is None for cell in cells):
            continue
        headers = []
        for index, raw in enumerate(cells):
            years = _number(raw.replace(',', '.'))
            if years is None:
                continue
            months = round(years * 12)
            if months in SUPPORTED_MONTHS and math.isclose(years * 12, months, abs_tol=1e-8):
                headers.append((index, months))
        if len(headers) >= 2:
            maturity_headers = (len(cells), headers)
            break
    if maturity_headers is None:
        raise ValueError('Bank of Russia curve tenor headings changed or are unavailable')

    header_count, columns = maturity_headers
    observations = []
    for cells in rows:
        if len(cells) < header_count + 1:
            continue
        try:
            observed = datetime.strptime(cells[0], '%d.%m.%Y').date()
        except ValueError:
            continue
        if observed > today:
            continue
        values = {months: cells[index + 1].replace(',', '.')
                  for index, months in columns if index + 1 < len(cells)
                  and _number(cells[index + 1].replace(',', '.')) is not None}
        if len(values) >= 2:
            observations.append((observed.isoformat(), values))
    if not observations:
        raise ValueError('Bank of Russia page has no dated multi-tenor curve')
    period, values = max(observations, key=lambda item: item[0])
    return {'RUS': curve(
        'RUB', period, 'Bank of Russia · government bond zero-coupon yield curve', url,
        'Daily estimated zero-coupon government-bond spot yields at exact source maturities; only terms in the existing app grid are included.',
        values,
    )}


PROVIDERS = (united_kingdom, sweden, norway, switzerland, russia)


def fetch_europe(download, curve, today):
    """Fetch every available European provider while isolating its failures."""
    result = {}
    for provider in PROVIDERS:
        try:
            result.update(provider(download, curve, today))
        except Exception as error:
            print(f'WARNING {provider.__name__}: {error}')
    return result
