const cache = new Map<string, Intl.NumberFormat>();
/** Reuse formatters while always formatting the current value. Bounded cache. */
export function numberFormatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify([locale, options]);
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    if (cache.size >= 32) cache.delete(cache.keys().next().value!);
    cache.set(key, formatter);
  }
  return formatter;
}
