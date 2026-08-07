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

/**
 * Data embedded into the single-file build via
 * <script type="application/json" id="wem-data-...">. Returns null when the
 * app runs in dev mode / a normal multi-file build (then fetch() is used).
 */
function inlineData<T>(name: string): T | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(`wem-data-${name}`);
  if (!el || !el.textContent) return null;
  try {
    return JSON.parse(el.textContent) as T;
  } catch {
    return null;
  }
}

/** Embedded data if present, otherwise fetch from /data. */
async function loadOne<T>(name: string, path: string): Promise<T> {
  const inline = inlineData<T>(name);
  if (inline !== null) return inline;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** Load snapshot, geometry, trade flows, and 20-year history. */
export function useWorldData(): WorldData {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [geojson, setGeojson] = useState<unknown | null>(null);
  const [trade, setTrade] = useState<TradeData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
  const [products, setProducts] = useState<TradeProductsData | null>(null);
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
    loadOne<TimeseriesData>('timeseries', '/data/timeseries.json')
      .then((t) => alive && setTimeseries(t))
      .catch(() => {});
    loadOne<TradeProductsData>('products', '/data/trade_products.json')
      .then((p) => alive && setProducts(p))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  return { snapshot, geojson, trade, timeseries, products, error };
}
