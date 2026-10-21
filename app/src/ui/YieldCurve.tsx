import { useState } from 'react';
import { bondPoint, bondSpread, isRecentBondCurve, tenorLabel, type BondCurve } from '../data/bonds';
import './bonds.css';

export function YieldCurve({ curve, countryName, months, onPickMaturity }: {
  curve?: BondCurve;
  countryName: string;
  months: number;
  onPickMaturity: (months: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const points = (curve?.points ?? []).filter(p => Number.isFinite(p.yield)).slice().sort((a, b) => a.months - b.months);
  const selected = bondPoint(curve, hovered ?? months);
  const spread = bondSpread(curve);
  const min = Math.min(...points.map(p => p.yield));
  const max = Math.max(...points.map(p => p.yield));
  const padding = Math.max((max - min) * 0.2, 0.15);
  const low = min - padding;
  const high = max + padding;
  const first = points[0]?.months ?? 0;
  const last = points.at(-1)?.months ?? 1;
  const x = (m: number) => 40 + (m - first) / (last - first || 1) * 260;
  const y = (v: number) => 18 + (high - v) / (high - low || 1) * 126;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.months)},${y(p.yield)}`).join(' ');

  return <section className="panel__group bond-curve" aria-label={`Yield curve · ${countryName}`}>
    <h3 className="panel__group-title">Government bond yield curve</h3>
    <p className="bond-curve__intro">Yield (%) by remaining maturity</p>
    {!curve || !points.length ? <p className="muted">No sovereign bond observations available for this country. The central bank policy rate is a separate indicator.</p> : <>
      <div className="bond-curve__summary">
        <span>{curve.currency} · {curve.date} · {curve.frequency === 'monthly' ? 'Monthly average' : curve.frequency === 'auction' ? 'Auction results' : 'Daily observation'}</span>
        <strong>{selected ? `${tenorLabel(selected.months)} · ${selected.yield.toFixed(2)}%` : `${tenorLabel(months)} · No data`}</strong>
      </div>
      {!isRecentBondCurve(curve) && <p className="bond-curve__notice">Historical observation, over 180 days old. Excluded from the current map and ranking.</p>}
      {points.length > 1 ? <svg viewBox="0 0 320 182" role="img" aria-label={`${countryName}: bond yields by maturity, ${curve.date}. Values are listed below.`}>
        {[low, (low + high) / 2, high].map(v => <g key={v}>
          <line x1="40" x2="300" y1={y(v)} y2={y(v)} className="bond-curve__grid" />
          <text x="34" y={y(v) + 3} textAnchor="end">{v.toFixed(1)}%</text>
        </g>)}
        <path d={line} fill="none" stroke="#57d9ce" strokeWidth="2.5" />
        {points.map((point, index) => <g key={point.months}>
          <circle cx={x(point.months)} cy={y(point.yield)} r={selected?.months === point.months ? 5 : 3} fill={selected?.months === point.months ? '#f4cf77' : '#57d9ce'} />
          <circle cx={x(point.months)} cy={y(point.yield)} r="12" fill="transparent"
            onMouseEnter={() => setHovered(point.months)} onMouseLeave={() => setHovered(null)}>
            <title>{tenorLabel(point.months)}: {point.yield.toFixed(2)}%</title>
          </circle>
          {(points.length <= 6 || index === 0 || index === points.length - 1 || point.months === 120 || point.months === 60) &&
            <text x={x(point.months)} y="165" textAnchor="middle">{tenorLabel(point.months)}</text>}
        </g>)}
      </svg> : <p className="bond-curve__notice">Only one maturity is available. At least two maturities are needed to draw a curve.</p>}
      {spread !== null && <p className={`bond-curve__slope${spread < 0 ? ' bond-curve__slope--inverted' : ''}`}>
        10Y − 2Y: {spread >= 0 ? '+' : ''}{spread.toFixed(0)} bp · {spread < 0 ? 'Inverted between 2Y and 10Y' : spread === 0 ? 'Flat between 2Y and 10Y' : 'Positive slope between 2Y and 10Y'}
      </p>}
      <div className="bond-curve__points" aria-label="Observed yields; select a maturity to colour the map">
        {points.map(point => <button key={point.months} type="button" className={months === point.months ? 'bond-point bond-point--active' : 'bond-point'}
          aria-pressed={months === point.months} onClick={() => onPickMaturity(point.months)}>
          <span>{tenorLabel(point.months)}</span><strong>{point.yield.toFixed(2)}%</strong>
        </button>)}
      </div>
      <p className="bond-curve__method">{curve.method}</p>
      <a className="bond-curve__source" href={curve.source.url} target="_blank" rel="noreferrer">Source: {curve.source.name} ↗</a>
      <p className="bond-curve__method">Snapshot data, not live quotes. Lines connect reported tenors; no intermediate yields are estimated by this app.</p>
    </>}
  </section>;
}
