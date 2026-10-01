import { useEffect, useState } from 'react';
import type { Snapshot, TradeData, TimeseriesData, TradeProductsData } from '../types';
import type { RegionalCountryData, RegionalIndex } from './regions';

interface WorldData {
  snapshot: Snapshot | null;
  geojson: unknown | null;
  trade: TradeData | null;
  timeseries: TimeseriesData | null;
  products: TradeProductsData | null;
  regionalIndex: RegionalIndex | null;
  regionalGeometry: unknown | null;
  regionalCountryData: RegionalCountryData | null;
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

async function inlineGzipData<T>(name: string): Promise<T | null> {
  if (typeof document === 'undefined' || typeof DecompressionStream === 'undefined') return null;
  const element = document.getElementById(`wem-gzip-${name}`);
  const encoded = element?.textContent?.trim();
  if (!encoded) return null;
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text()) as T;
}

/** Embedded data if present, otherwise fetch from /data. */
async function loadOne<T>(name: string, path: string): Promise<T> {
  const inline = inlineData<T>(name);
  if (inline !== null) return inline;
  const compressedInline = await inlineGzipData<T>(name);
  if (compressedInline !== null) return compressedInline;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

const regionalAssetCache = new Map<string, Promise<unknown>>();

function loadRegionalAsset<T>(name: string, path: string): Promise<T> {
  let cached = regionalAssetCache.get(name) as Promise<T> | undefined;
  if (!cached) {
    cached = loadOne<T>(name, path);
    regionalAssetCache.set(name, cached);
    cached.catch(() => regionalAssetCache.delete(name));
  }
  return cached;
}

/** Load snapshot, geometry, trade flows, and 20-year history. */
export function useWorldData(regionalIso3: string | null): WorldData {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [geojson, setGeojson] = useState<unknown | null>(null);
  const [trade, setTrade] = useState<TradeData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesData | null>(null);
  const [products, setProducts] = useState<TradeProductsData | null>(null);
  const [regionalIndex, setRegionalIndex] = useState<RegionalIndex | null>(null);
  const [regionalGeometry, setRegionalGeometry] = useState<unknown | null>(null);
  const [regionalCountryData, setRegionalCountryData] = useState<RegionalCountryData | null>(null);
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
    loadOne<RegionalIndex>('regional-index', '/data/regional-index.json')
      .then((index) => alive && setRegionalIndex(index))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setRegionalGeometry(null);
    setRegionalCountryData(null);
    if (!regionalIso3) return () => { alive = false; };
    Promise.all([
      loadRegionalAsset<unknown>(
        `regions-${regionalIso3}`,
        `/data/regions/${regionalIso3}.geojson`,
      ),
      loadRegionalAsset<RegionalCountryData>(
        `regional-data-${regionalIso3}`,
        `/data/regional-data/${regionalIso3}.json`,
      ),
    ])
      .then(([geometry, regional]) => {
        if (!alive) return;
        setRegionalGeometry(geometry);
        setRegionalCountryData(regional);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });
    return () => { alive = false; };
  }, [regionalIso3]);

  return {
    snapshot,
    geojson,
    trade,
    timeseries,
    products,
    regionalIndex,
    regionalGeometry,
    regionalCountryData,
    error,
  };
}
