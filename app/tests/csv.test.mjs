import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { countryCsv, historyCsv, latestCsv, toCsv } from '../src/lib/csv.ts';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const json = (path) => JSON.parse(read(path));

test('browser history CSV is byte-identical to the pipeline export', () => {
  const snapshot = json('../public/data/snapshot.json');
  const index = json('../public/data/timeseries/index.json');
  for (const id of ['gdp_total', 'inflation', 'life_expectancy']) {
    const history = json(`../public/data/timeseries/${id}.json`);
    const fromApp = historyCsv(snapshot.countries, history, index.startYear, index.endYear);
    assert.equal(fromApp, read(`../../data/csv/history/${id}.csv`), id);
  }
});

test('cells with commas, quotes or line breaks are quoted', () => {
  assert.equal(toCsv([['a,b', 'say "hi"', 'x\ny', 3, null]]), '"a,b","say ""hi""","x\ny",3,\n');
});

test('latest and country CSVs carry period, unit, source and licence', () => {
  const source = { name: 'Eurostat', url: 'https://ec.europa.eu', license: 'CC BY 4.0' };
  const metric = { id: 'euro_spread_bund', source };
  const countries = [
    { iso3: 'ITA', name: 'Italia', metrics: { euro_spread_bund: { value: 126.4, year: 2026, period: '2026-10' } } },
    { iso3: 'USA', name: 'Estados Unidos', metrics: {} },
  ];
  assert.equal(latestCsv(metric, 'Prima de riesgo', 'pb', countries),
    'iso3,pais,euro_spread_bund (Prima de riesgo),periodo,unidad,fuente,licencia\nITA,Italia,126.4,2026-10,pb,Eurostat,CC BY 4.0\n');
  assert.equal(countryCsv(countries[0], [metric], () => 'Prima de riesgo', () => 'pb'),
    'id,metrica,valor,unidad,periodo,fuente,licencia\neuro_spread_bund,Prima de riesgo,126.4,pb,2026-10,Eurostat,CC BY 4.0\n');
});
