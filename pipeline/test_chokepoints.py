from datetime import date
import unittest
from build_chokepoints import PORTS, validate_rows


class SnapshotValidation(unittest.TestCase):
    def setUp(self):
        self.day = date(2026, 10, 1)
        self.rows = [dict(date=str(self.day), portid=port, n_total=0) for port in PORTS.values()]

    def test_zero_and_null_remain_distinct(self):
        self.rows[0]['n_total'] = None
        result = validate_rows(self.rows, self.day, self.day)
        self.assertIsNone(result['hormuz'][0]['vessels'])
        self.assertEqual(result['malacca'][0]['vessels'], 0)

    def test_invalid_or_partial_response_rejected(self):
        for rows in [self.rows[:-1], self.rows + [self.rows[0]],
                     [{**row, 'n_total': -1} for row in self.rows],
                     [{**row, 'date': '2026-10-02'} for row in self.rows]]:
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                validate_rows(rows, self.day, self.day)


if __name__ == '__main__':
    unittest.main()
