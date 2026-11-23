// Data loading shared by all hooks: embedded data (single-file build) first, else fetch().

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
export async function loadOne<T>(name: string, path: string): Promise<T> {
  const inline = inlineData<T>(name);
  if (inline !== null) return inline;
  const compressedInline = await inlineGzipData<T>(name);
  if (compressedInline !== null) return compressedInline;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** Memoises loads that are requested repeatedly (per country / per metric). */
export function cachedLoader<T>(prefix: string, pathFor: (key: string) => string): (key: string) => Promise<T> {
  const cache = new Map<string, Promise<T>>();
  return (key) => {
    let hit = cache.get(key);
    if (!hit) {
      hit = loadOne<T>(`${prefix}-${key}`, pathFor(key));
      cache.set(key, hit);
      hit.catch(() => cache.delete(key));
    }
    return hit;
  };
}
