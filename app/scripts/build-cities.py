"""Rebuild the bundled city-light locations. One download; no runtime API.

Source: Natural Earth v5.1.2 populated places, public domain.
Population values are historical cartographic estimates, not current statistics.
Run from any directory with: python scripts/build-cities.py
"""
import json
from pathlib import Path
from urllib.request import urlopen

SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_populated_places_simple.geojson'
with urlopen(SOURCE, timeout=40) as response:
    dataset = json.load(response)

cities = []
for feature in dataset['features']:
    properties = feature['properties']
    if (properties.get('pop_max') or 0) >= 100_000 or (properties.get('scalerank') or 0) <= 4:
        longitude, latitude = feature['geometry']['coordinates'][:2]
        cities.append([
            properties['name'], round(longitude, 4), round(latitude, 4),
            properties.get('pop_max') or 0,
        ])

target = Path(__file__).resolve().parents[1] / 'src' / 'data' / 'cities.json'
target.write_text(json.dumps(cities, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'Bundled {len(cities)} city locations in {target}')
