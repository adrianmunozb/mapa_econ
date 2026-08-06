import type { MetricMeta } from '../types';
import type { YearMap } from '../lib/timeseries';
import { formatCompact } from '../lib/format';
import { fmt, metricLabel, useLang } from '../i18n';

interface Props {
  history: YearMap;
  metric: MetricMeta;
}

/** Minimal dependency-free SVG line chart of a metric's history. */
export function TrendChart({ history, metric }: Props) {
  const { lang, t } = useLang();
  const points = Object.entries(history)
    .map(([y, v]) => ({ year: Number(y), value: v }))
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => a.year - b.year);
  if (points.length < 2) return null;

  const W = 280;
  const H = 96;
  const padL = 4;
  const padR = 6;
  const padT = 12;
  const padB = 16;

  const years = points.map((p) => p.year);
  const vals = points.map((p) => p.value);
  const minY = Math.min(...vals);
  const maxY = Math.max(...vals);
  const minX = Math.min(...years);
  const maxX = Math.max(...years);
  const spanY = maxY - minY || 1;
  const spanX = maxX - minX || 1;
  const x = (yr: number) => padL + ((yr - minX) / spanX) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - minY) / spanY) * (H - padT - padB);

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ');
  const area = `${line} L${x(maxX).toFixed(1)},${(H - padB).toFixed(1)} L${x(minX).toFixed(1)},${(H - padB).toFixed(1)} Z`;
  const last = points[points.length - 1];

  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={fmt(t.trendAria, { label: metricLabel(metric, lang) })}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f9cf9" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#4f9cf9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendGrad)" />
      <path d={line} fill="none" stroke="#4f9cf9" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(last.year)} cy={y(last.value)} r="3" fill="#38d39f" />
      <text className="trend__lbl" x={padL} y={padT - 3}>{formatCompact(maxY, metric, lang)}</text>
      <text className="trend__lbl" x={padL} y={H - padB - 2}>{formatCompact(minY, metric, lang)}</text>
      <text className="trend__lbl" x={padL} y={H - 3}>{minX}</text>
      <text className="trend__lbl" x={W - padR} y={H - 3} textAnchor="end">{maxX}</text>
    </svg>
  );
}
