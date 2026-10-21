import unittest
from build_news import parse_feed


class NewsFeedTests(unittest.TestCase):
    def test_rss_ignores_invalid_and_undated_entries(self):
        payload = b'''<rss><channel><title>Test News</title><item><title>Iran update</title><link>https://example.org/a</link><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate></item><item><title>No date</title><link>https://example.org/b</link></item><item><title>Unsafe</title><link>javascript:bad</link><pubDate>bad</pubDate></item></channel></rss>'''
        rows = parse_feed(payload, 'https://example.org/rss')
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['source'], 'Test News')
        self.assertEqual(rows[0]['publishedAt'], '2026-10-20T10:00:00+00:00')

    def test_namespaced_atom_uses_alternate_link(self):
        payload = b'''<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom News</title><entry><title>Iran update</title><link rel="self" href="https://example.org/feed/a"/><link rel="alternate" href="https://example.org/a"/><updated>2026-10-20T10:00:00Z</updated></entry></feed>'''
        rows = parse_feed(payload, 'https://example.org/rss')
        self.assertEqual(rows[0]['url'], 'https://example.org/a')

    def test_rdf_items_are_siblings_of_channel_and_use_dc_date(self):
        payload = b'''<rdf:RDF xmlns:rdf="urn:rdf" xmlns:dc="urn:dc"><channel><title>DW</title></channel><item><title>Iran</title><link>https://dw.com/a</link><dc:date>2026-10-20T10:00:00Z</dc:date></item></rdf:RDF>'''
        rows = parse_feed(payload, 'https://example.org/rss')
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['source'], 'DW')

    def test_rejects_dtd(self):
        with self.assertRaises(ValueError):
            parse_feed(b'<!DOCTYPE rss [<!ENTITY a "bad">]><rss/>', 'https://example.org/rss')


if __name__ == '__main__':
    unittest.main()
