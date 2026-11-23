from datetime import date, datetime
import json
import unittest

from bonds_europe import _sheet_values, norway, sweden
from build_bonds import curve


class EuropeParserTests(unittest.TestCase):
    def test_boe_retains_percent_units_zero_and_negative_values_on_exact_tenors(self):
        rows = [
            ['years:', 0.5, 2, 2.25, 10, 40],
            [datetime(2026, 10, 19), 0, -0.2, 99, 5.337, 5.8],
            [datetime(2026, 10, 21), 9, 9, 9, 9, 9],
        ]
        result = _sheet_values(rows, 'years:', date(2026, 10, 20))
        self.assertEqual(result, {'2026-10-19': {6: 0, 24: -0.2, 120: 5.337, 480: 5.8}})

    def test_riksbank_never_combines_different_latest_observation_dates(self):
        data = [
            {'seriesId': 'SEGVB2YC', 'date': '2026-10-19', 'value': 2.7},
            {'seriesId': 'SEGVB5YC', 'date': '2026-10-19', 'value': 2.9},
            {'seriesId': 'SEGVB10YC', 'date': '2026-10-16', 'value': 3.2},
            {'seriesId': 'POLICY', 'date': '2026-10-19', 'value': 99},
        ]
        result = sweden(lambda _: json.dumps(data), curve, date(2026, 10, 20))['SWE']
        self.assertEqual(result['date'], '2026-10-19')
        self.assertEqual(result['points'], [{'months': 24, 'yield': 2.7}, {'months': 60, 'yield': 2.9}])

    def test_norges_rejects_unexpected_column_layout(self):
        html = '<table><tr><th>Date</th><th>Policy</th><th>10-year</th></tr><tr><td>2026-10-19</td><td>2</td><td>4</td></tr></table>'
        with self.assertRaisesRegex(ValueError, 'layout changed'):
            norway(lambda _: html, curve, date(2026, 10, 20))


if __name__ == '__main__':
    unittest.main()
