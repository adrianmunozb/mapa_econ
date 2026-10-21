import { memo, useState, useSyncExternalStore } from 'react';
import { Layer } from '@vis.gl/react-maplibre';
import { nextFill, type FillState } from './interaction';

const query = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const motion = window.matchMedia(query);
  motion.addEventListener('change', notify);
  return () => motion.removeEventListener('change', notify);
};
const reducedMotion = () => window.matchMedia(query).matches;

/** MapLibre cannot transition data-driven colors. Fade two persistent fills
 * instead; geometry and GPU source buffers stay in place when the metric changes. */
export const SmoothFill = memo(function SmoothFill({ id, source, color, opacity }: {
  id: string; source?: string; color: unknown; opacity: number;
}) {
  const reduced = useSyncExternalStore(subscribe, reducedMotion, () => true);
  const [state, setState] = useState<FillState>(() => ({ expression: color, colors: [color, color], active: 0 }));
  if (state.expression !== color) setState(nextFill(state, color));
  return <>{state.colors.map((expression, index) => <Layer
    key={index} id={index === 0 ? id : `${id}-fade`} source={source} type="fill"
    paint={{
      'fill-color': expression as never,
      'fill-color-transition': { duration: 0, delay: 0 },
      'fill-opacity': index === state.active ? opacity : 0,
      'fill-opacity-transition': { duration: reduced ? 0 : 220, delay: 0 },
    }}
  />)}</>;
});
