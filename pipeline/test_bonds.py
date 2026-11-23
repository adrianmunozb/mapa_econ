"""Offline regression tests for multi-provider refresh and tenor normalization."""
import unittest
from datetime import date
from build_bonds import TODAY, curve, refresh_providers
from bonds_oceania import australia, new_zealand


def sample(values, day=None):
    return curve('EUR', day or TODAY.isoformat(), 'Test source', 'https://example.org', 'Test method', values)


class RefreshTests(unittest.TestCase):
    def test_australia_uses_government_bond_columns_and_skips_future_rows(self):
        csv = ('Title,Australian Government 2 year bond,Australian Government 10 year bond,Cash rate\n'
               'Description,Yields on Australian Government bonds,Yields on Australian Government bonds,Policy\n'
               '19-Oct-2026,4.1,4.8,99\n21-Oct-2026,9,9,9\n')
        result = australia(lambda _: csv, curve, date(2026, 10, 20))['AUS']
        self.assertEqual(result['date'], '2026-10-19')
        self.assertEqual(result['points'], [{'months': 24, 'yield': 4.1}, {'months': 120, 'yield': 4.8}])

    def test_new_zealand_excludes_cash_bank_bill_and_swap_columns(self):
        html = ('<table><tr><th>Cash rate</th><th>Secondary market government bond closing yields</th></tr>'
                '<tr><th>Date</th><th>OCR</th><th>90 days</th><th>1 year</th><th>2 year</th><th>5 year</th><th>10 year</th><th>Swap spread</th></tr>'
                '<tr><td>19 Oct 2026</td><td>99</td><td>88</td><td>3.25</td><td>3.91</td><td>4.49</td><td>5.01</td><td>62</td></tr></table>')
        result = new_zealand(lambda _: html, curve, date(2026, 10, 20))['NZL']
        self.assertEqual(result['date'], '2026-10-19')
        self.assertEqual([point['yield'] for point in result['points']], [3.25, 3.91, 4.49, 5.01])

    def test_failed_provider_cannot_erase_previous_curve_via_fallback(self):
        prior = sample({24: 2.0, 120: 3.0})

        def unavailable():
            raise RuntimeError('Unavailable official download')

        updated, warnings = refresh_providers({'GBR': prior}, [
            ('oecd', lambda: {'GBR': sample({120: 4.0})}),
            ('uk', unavailable),
            ('other', lambda: {'NOR': sample({36: 4.2, 120: 4.4})}),
        ])
        self.assertEqual(updated['GBR'], prior)
        self.assertEqual(len(updated['NOR']['points']), 2)
        self.assertEqual(warnings, ['uk: Unavailable official download'])

    def test_success_replaces_whole_curve_and_never_mixes_dates(self):
        previous = sample({24: 2.0, 120: 3.0}, '2026-01-01')
        incoming = sample({36: 2.2, 120: 3.2})
        updated, warnings = refresh_providers({'GBR': previous}, [('uk', lambda: {'GBR': incoming})])
        self.assertEqual(updated['GBR'], incoming)
        self.assertNotIn(24, [point['months'] for point in updated['GBR']['points']])
        self.assertFalse(warnings)

    def test_only_selectable_tenors_survive_and_missing_is_not_zero(self):
        result = sample({24: 0, 48: 5, 120: -0.2, 480: 1.5, 600: 2, 60: None})
        self.assertEqual(result['points'], [
            {'months': 24, 'yield': 0}, {'months': 120, 'yield': -0.2},
            {'months': 480, 'yield': 1.5}, {'months': 600, 'yield': 2},
        ])


if __name__ == '__main__':
    unittest.main()
