"""Deterministic offline stand-in for every remote API the pipeline talks to.

``install()`` patches ``requests.Session.get`` / ``requests.get`` (and ``time.sleep``)
so the whole pipeline can run end to end without network access. Responses mimic the
real payload *shapes* (World Bank, Natural Earth, IMF SDMX, BIS CSV, UN Comtrade,
geoBoundaries, DOSE) with a handful of synthetic countries.
"""

from __future__ import annotations

import json
import time
import zlib
from contextlib import contextmanager
from unittest import mock

import requests

COUNTRIES = {
    # iso3: (iso2, name, region id, region name, income)
    "USA": ("US", "United States", "NAC", "North America", "High income"),
    "DEU": ("DE", "Germany", "ECS", "Europe & Central Asia", "High income"),
    "MAR": ("MA", "Morocco", "MEA", "Middle East, North Africa", "Lower middle income"),
    "XKX": ("XK", "Kosovo", "ECS", "Europe & Central Asia", "Upper middle income"),
}
M49 = {"USA": 840, "DEU": 276, "MAR": 504, "XKX": 412}


def _h(*parts) -> int:
    return zlib.crc32("|".join(map(str, parts)).encode())


def _square(x0, y0, x1, y1):
    return [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]


def _wb_countries():
    rows = [
        {
            "id": iso3, "iso2Code": iso2, "name": name,
            "region": {"id": rid, "value": rname}, "incomeLevel": {"value": income},
        }
        for iso3, (iso2, name, rid, rname, income) in COUNTRIES.items()
    ]
    rows.append({"id": "WLD", "iso2Code": "1W", "name": "World",
                 "region": {"id": "NA", "value": "Aggregates"}, "incomeLevel": {"value": "Aggregates"}})
    return [{"page": 1}, rows]


def _wb_indicator(code, params):
    window = str(params.get("date", ""))
    years = range(2004, 2025) if window else (2022, 2023, 2024)
    rows = []
    for iso3 in [*COUNTRIES, "WLD"]:
        for year in years:
            h = _h(code, iso3, year)
            value = None if h % 5 == 0 else round((h % 100000) / 7.0, 3)
            rows.append({"countryiso3code": iso3, "date": str(year), "value": value})
    rows.append({"countryiso3code": "", "date": "2023", "value": 1.0})
    return [{"page": 1}, rows]


def _natural_earth():
    def feat(a3, name, geom, *, iso_a3=None, eh=None):
        return {"type": "Feature",
                "properties": {"ISO_A3": iso_a3 or a3, "ISO_A3_EH": eh or a3, "ADM0_A3": a3,
                               "NAME": name, "ADMIN": name, "NAME_LONG": name, "EXTRA": 1},
                "geometry": {"type": "Polygon", "coordinates": geom}}
    return {"type": "FeatureCollection", "features": [
        feat("USA", "United States of America", _square(-120, 30, -80, 48)),
        feat("DEU", "Germany", _square(6, 47, 15, 55)),
        # Morocco spans the 27°40'N parallel: exercises the Western Sahara split.
        feat("MAR", "Morocco", _square(-13, 21, -1, 36)),
        feat("SAH", "W. Sahara", _square(-17, 21, -9, 27), iso_a3="ESH", eh="ESH"),
        feat("KOS", "Kosovo", _square(20, 42, 21.5, 43), iso_a3="-99", eh="-99"),
        feat("XXX", "Nowhere", _square(0, 0, 1, 1), iso_a3="-99", eh="-99"),
    ]}


def _imf_cpi():
    dims = {"series": [{"id": "COUNTRY", "values": [{"id": "USA"}, {"id": "UVK"}, {"id": "DEU"}, {"id": "ZZZ"}]},
                       {"id": "FREQ", "values": [{"id": "M"}]}],
            "observation": [{"values": [{"value": "2026-M05"}]}]}
    series = {"0:0": {"observations": {"0": [3.2]}}, "1:0": {"observations": {"0": [1.5]}},
              "2:0": {"observations": {"0": [2.4]}}, "3:0": {"observations": {"0": [None]}}}
    return {"data": {"dataSets": [{"series": series}], "structures": [{"dimensions": dims}]}}


def _bis_csv():
    return ("REF_AREA,OBS_VALUE,TIME_PERIOD\n"
            "US,4.5,2026-06-16\nXM,2.0,2026-06-11\nDE,1.0,2026-06-01\nMA,2.75,2026-03-24\n"
            "GB,4.0,2026-06-18\nHK,5.0,2026-06-17\nXX,not-a-number,2026-06-01\n,3.0,2026-06-01\n")


def _imf_trade(reporter):
    partners = ["G001", "USA", "DEU", "MAR", "XKX", "ZZZ", "G002"]
    dims = {"series": [{"id": "COUNTERPART_COUNTRY", "values": [{"id": p} for p in partners]}],
            "observation": [{"values": [{"value": "2021"}, {"value": "2024"}]}]}
    series = {}
    for i, p in enumerate(partners):
        obs = {"1": [float(_h(reporter, p) % 10_000_000 + 1000)]}
        if p == "ZZZ":
            obs = {"0": [5.0]}  # stale year: filtered out
        series[str(i)] = {"observations": obs}
    return {"data": {"dataSets": [{"series": series}], "structures": [{"dimensions": dims}]}}


def _comtrade_reporters():
    rows = [{"reporterCode": m, "reporterCodeIsoAlpha3": iso, "isGroup": False} for iso, m in M49.items()]
    rows.append({"reporterCode": 97, "reporterCodeIsoAlpha3": "EUR", "isGroup": True})
    return {"results": rows}


def _comtrade_preview(params):
    code, year = int(params["reporterCode"]), int(params["period"])
    if code == M49["XKX"]:
        return {"data": []}  # no data at all for this reporter
    if code == M49["MAR"] and year > 2022:
        return {"data": []}  # only older years: exercises the year fallback
    rows = [{"cmdCode": "TOTAL", "primaryValue": 1e9}]
    for k in range(1, 12):
        rows.append({"cmdCode": f"{k:02d}", "primaryValue": float(_h(code, year, k) % 1_000_000 + 1)})
    rows.append({"cmdCode": "99", "primaryValue": 0})
    return {"data": rows}


GB_META = [
    {"boundaryISO": "USA", "boundaryType": "ADM1", "simplifiedGeometryGeoJSON": "https://fake.geoboundaries/USA.geojson"},
    {"boundaryISO": "DEU", "boundaryType": "ADM1", "simplifiedGeometryGeoJSON": "https://fake.geoboundaries/DEU.geojson"},
    {"boundaryISO": "FRA", "boundaryType": "ADM0", "simplifiedGeometryGeoJSON": "https://fake.geoboundaries/FRA.geojson"},
]


def _gb_geo(iso3):
    names = {"USA": ["Alpha", "Beta Province", "Gamma", "Orphan"], "DEU": ["Nord", "Süd"]}[iso3]
    feats = []
    for i, n in enumerate(names):
        ring = [[i * 3.0, 0.0], [i * 3.0 + 2, 0.0], [i * 3.0 + 2, 1.0], [i * 3.0 + 1, 1.5], [i * 3.0, 1.0], [i * 3.0, 0.0]]
        feats.append({"type": "Feature", "properties": {"shapeName": n, "shapeID": f"{iso3}-{i}"},
                      "geometry": {"type": "Polygon", "coordinates": [ring]}})
    feats.append({"type": "Feature", "properties": {"shapeName": "Multi", "shapeID": f"{iso3}-m"},
                  "geometry": {"type": "MultiPolygon", "coordinates": [_square(50, 0, 51, 1), _square(52, 0, 53, 1)]}})
    return {"type": "FeatureCollection", "features": feats}


def _dose_csv():
    lines = ["GID_0,GID_1,region,year,pop,grp_pc_usd,grp_pc_usd_2015,grp_lcu"]
    for gid, name in [("USA.1", "Alpha"), ("USA.2", "Beta"), ("USA.3", "Gamma"), ("USA.4", "Gamma")]:
        for year in (2018, 2019, 2020):
            lines.append(f"USA,{gid},{name},{year},{1000 + _h(gid, year) % 500},{20000 + _h(gid) % 999},,{5e7}")
    for gid, name in [("DEU.1", "Nord"), ("DEU.2", "Süd")]:
        for year in (2019, 2020):
            lines.append(f"DEU,{gid},{name},{year},,{30000 + _h(gid) % 99},{29000},")
    lines.append("FRA,FRA.1,Seine,2020,100,40000,,")
    return "\n".join(lines) + "\n"


class FakeResponse:
    def __init__(self, url, payload=None, text=None, status=200):
        self.url, self.status_code, self._payload = url, status, payload
        self.text = text if text is not None else json.dumps(payload)
        self.content = self.text.encode("utf-8")

    def json(self):
        return json.loads(self.text)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code} for {self.url}")


def route(url, params=None):
    params = params or {}
    if "api.worldbank.org" in url:
        return FakeResponse(url, _wb_countries() if url.rstrip("/").endswith("/country") else _wb_indicator(url.split("/indicator/")[1], params))
    if "natural-earth-vector" in url:
        return FakeResponse(url, _natural_earth())
    if "IMF.STA/CPI" in url:
        return FakeResponse(url, _imf_cpi())
    if "stats.bis.org" in url:
        return FakeResponse(url, text=_bis_csv())
    if "IMF.STA/IMTS" in url:
        return FakeResponse(url, _imf_trade(url.split("/1.0.0/")[1].split(".")[0]))
    if url.endswith("Reporters.json"):
        return FakeResponse(url, _comtrade_reporters())
    if "comtradeapi.un.org/public" in url:
        return FakeResponse(url, _comtrade_preview(params))
    if "geoboundaries.org/api" in url:
        return FakeResponse(url, GB_META)
    if "fake.geoboundaries" in url:
        return FakeResponse(url, _gb_geo(url.rsplit("/", 1)[1].split(".")[0]))
    if "zenodo.org" in url:
        return FakeResponse(url, text=_dose_csv())
    return FakeResponse(url, status=404, text="not found")


@contextmanager
def install():
    """Patch requests + time.sleep for the duration of the ``with`` block."""
    def session_get(self, url, params=None, **kwargs):
        return route(url, params)

    def plain_get(url, params=None, **kwargs):
        return route(url, params)

    with mock.patch.object(requests.Session, "get", session_get), \
         mock.patch.object(requests, "get", plain_get), \
         mock.patch.object(time, "sleep", lambda *_: None):
        yield
