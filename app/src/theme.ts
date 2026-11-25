// Map colours shared by the landing globe and the world map, so both read as one product.
// Keep in sync with the --map-* tokens in index.css.
export const MAP_THEME = {
  ocean: '#0a1638',
  land: '#16275a',
  border: '#5a76c2',
  /** Countries in sections without a metric legend. */
  neutral: '#1d3170',
} as const;
