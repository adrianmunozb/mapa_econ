import { useEffect, useState } from 'react';
import type { Snapshot, TradeData, TimeseriesData, TradeProductsData } from '../types';

interface WorldData {
  snapshot: Snapshot | null;
  geojson: unknown | null;
  trade: TradeData | null;
  timeseries: TimeseriesData | null;
  products: TradeProductsData | null;
  error: string | null;
}

/** Load snapshot, geometry, trade flows, and 20-year history from /public/data. */
export function useWorldData(): WorldData {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [geojson, setGeojson] = useState<unknown | null>(null);
  const [trade, setTrade] = useState<TradeData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
  const [products, setProducts] = useState<TradeProductsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async (path: string) => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
      return res.json();
    };

    // Map + metrics are required.
    Promise.all([load('/data/snapshot.json'), load('/data/countries.geojson')])
      .then(([s, g]) => {
        if (!alive) return;
        setSnapshot(s as Snapshot);
        setGeojson(g);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });

    // Trade + history are optional — their absence must not block the map.
    load('/data/trade.json')
      .then((t) => alive && setTrade(t as TradeData))
      .catch(() => {});
    load('/data/timeseries.json')
      .then((t) => alive && setTimeseries(t as TimeseriesData))
      .catch(() => {});
    load('/data/trade_products.json')
      .then((p) => alive && setProducts(p as TradeProductsData))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  return { snapshot, geojson, trade, timeseries, products, error };
}
