"""Deterministic parser checks for the Asia-Pacific bond providers."""
from datetime import date
import json
import unittest

from pipeline.bonds_asia import (
    parse_china_json,
    parse_japan_csv,
    parse_singapore_html,
)


class AsiaBondParserTests(unittest.TestCase):
    def test_japan_uses_latest_nonfuture_mof_curve_and_supported_tenors(self):
        text = '''Interest Rate (October 2026),,,,,
Date,1Y,2Y,3Y,4Y,5Y
2026/10/19,1.6,1.8,2.0,2.1,2.2
2026/10/21,9,9,9,9,9
'''
        period, values = parse_japan_csv(text, date(2026, 10, 20))
        self.assertEqual(period, '2026-10-19')
        self.assertEqual(values, {12: '1.6', 24: '1.8', 36: '2.0', 60: '2.2'})

    def test_singapore_reads_daily_yields_not_prices(self):
        text = '''<table id="ContentPlaceHolder1_ClosingLevelsTable">
          <tr><td class="date">19 Oct 2026</td>
            <td class="yield">1.88</td><td class="yield">1.91</td>
            <td class="price">101.75</td><td class="yield">1.87</td>
            <td class="price">97.72</td><td class="yield">2.14</td>
            <td class="price">98.14</td><td class="yield">2.36</td>
            <td class="price">98.14</td><td class="yield">2.41</td>
            <td class="price">100.10</td><td class="yield">2.37</td>
            <td class="price">117.13</td><td class="yield">2.40</td>
            <td class="price">110.33</td><td class="yield">2.61</td></tr>
          <tr><td class="date">21 Oct 2026</td><td class="yield">9</td><td class="yield">9</td></tr>
        </table>'''
        period, values = parse_singapore_html(text, date(2026, 10, 20))
        self.assertEqual(period, '2026-10-19')
        self.assertEqual(values, {
            6: '1.88', 12: '1.91', 24: '1.87', 60: '2.14', 120: '2.36',
            180: '2.41', 240: '2.37', 360: '2.40', 600: '2.61',
        })

    def test_china_uses_returned_worktime_and_only_exact_source_points(self):
        text = json.dumps([
            {'worktime': '2026-10-19', 'seriesData': [
                [0.25, 1.2], [0.5, 1.3], [1.0, 1.4], [0.225, 99],
            ]},
            {'worktime': '2026-10-21', 'seriesData': [[0.25, 9], [0.5, 9]]},
        ])
        period, values = parse_china_json(text, date(2026, 10, 20))
        self.assertEqual(period, '2026-10-19')
        self.assertEqual(values, {3: 1.2, 6: 1.3, 12: 1.4})


if __name__ == '__main__':
    unittest.main()
