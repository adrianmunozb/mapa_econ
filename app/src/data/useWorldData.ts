import { useEffect, useState } from 'react';
import type { Snapshot, TradeData, TimeseriesIndex, TradeProductsData } from '../types';
import { cachedLoader, loadOne } from './loader';
import type { RegionalCountryData, RegionalIndex } from './regions';

interface WorldData {
  snapshot: Snapshot | null;
  geojson: unknown | null;
  trade: TradeData | null;
  timeseriesIndex: TimeseriesIndex | null;
  products: TradeProductsData | null;
  regionalIndex: RegionalIndex | null;
  regionalGeometry: unknown | null;
  regionalCountryData: RegionalCountryData | null;
  error: string | null;
}

const loadRegionGeometry = cachedLoader<unknown>('regions', (iso3) => `/data/regions/${iso3}.geojson`);
const loadRegionData = cachedLoader<RegionalCountryData>('regional-data', (iso3) => `/data/regional-data/${iso3}.json`);

export function useWorldData(regionalIso3: string | null): WorldData {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [geojson, setGeojson] = useState<unknown | null>(null);
  const [trade, setTrade] = useState<TradeData | null>(null);
  const [timeseriesIndex, setTimeseriesIndex] = useState<TimeseriesIndex | null>(null);
  const [products, setProducts] = useState<TradeProductsData | null>(null);
  const [regionalIndex, setRegionalIndex] = useState<RegionalIndex | null>(null);
  const [regionalResult, setRegionalResult] = useState<{
    iso3: string;
    geometry: unknown;
    country: RegionalCountryData;
  } | null>(null);
  const [regionalError, setRegionalError] = useState<{ iso3: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    // Map + metrics are required.
    Promise.all([
      loadOne<Snapshot>('snapshot', '/data/snapshot.json'),
      loadOne<unknown>('countries', '/data/countries.geojson'),
    ])
      .then(([s, g]) => {
        if (!alive) return;
        setSnapshot(s);
        setGeojson(g);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });

    // Trade + history are optional — their absence must not block the map.
    loadOne<TradeData>('trade', '/data/trade.json')
      .then((t) => alive && setTrade(t))
      .catch(() => {});
    loadOne<TimeseriesIndex>('timeseries-index', '/data/timeseries/index.json')
      .then((t) => alive && setTimeseriesIndex(t))
      .catch(() => {});
    loadOne<TradeProductsData>('products', '/data/trade_products.json')
      .then((p) => alive && setProducts(p))
      .catch(() => {});
    loadOne<RegionalIndex>('regional-index', '/data/regional-index.json')
      .then((index) => alive && setRegionalIndex(index))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!regionalIso3 || !regionalIndex?.countries[regionalIso3]) return;
    Promise.all([
      loadRegionGeometry(regionalIso3),
      loadRegionData(regionalIso3),
    ])
      .then(([geometry, regional]) => {
        if (!alive) return;
        setRegionalResult({ iso3: regionalIso3, geometry, country: regional });
        setRegionalError(null);
      })
      .catch((e) => {
        if (alive) setRegionalError({ iso3: regionalIso3, message: e instanceof Error ? e.message : String(e) });
      });
    return () => { alive = false; };
  }, [regionalIso3, regionalIndex]);

  return {
    snapshot,
    geojson,
    trade,
    timeseriesIndex,
    products,
    regionalIndex,
    regionalGeometry: regionalResult?.iso3 === regionalIso3 ? regionalResult.geometry : null,
    regionalCountryData: regionalResult?.iso3 === regionalIso3 ? regionalResult.country : null,
    error: regionalError?.iso3 === regionalIso3 ? regionalError.message : error,
  };
}
