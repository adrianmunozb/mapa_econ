import { useState } from 'react';
import { formatPercentEs } from '../lib/format';
import { bondPoint, bondSpread, isRecentBondCurve, tenorLabel, type BondCurve } from '../data/bonds';
import './bonds.css';

export function YieldCurve({ curve, asOf, countryName, months, onPickMaturity }: {
  curve?: BondCurve;
  asOf: number;
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

  return <section className="panel__group bond-curve" aria-label={`Curva de tipos · ${countryName}`}>
    <h3 className="panel__group-title">Curva de tipos de la deuda pública</h3>
    <p className="bond-curve__intro">Rentabilidad (%) según el plazo hasta el vencimiento</p>
    {!curve || !points.length ? <p className="muted">No hay observaciones de deuda pública para este país. El tipo oficial del banco central es otro indicador.</p> : <>
      <div className="bond-curve__summary">
        <span>{curve.currency} · {curve.date} · {curve.frequency === 'monthly' ? 'Media mensual' : curve.frequency === 'auction' ? 'Resultado de subasta' : 'Observación diaria'}</span>
        <strong>{selected ? `${tenorLabel(selected.months)} · ${formatPercentEs(selected.yield)}` : `${tenorLabel(months)} · sin dato`}</strong>
      </div>
      {!isRecentBondCurve(curve, asOf) && <p className="bond-curve__notice">Observación histórica, con más de 180 días al generar los datos. No entra en el mapa ni en el ranking.</p>}
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
            <title>{tenorLabel(point.months)}: {formatPercentEs(point.yield)}</title>
          </circle>
          {(points.length <= 6 || index === 0 || index === points.length - 1 || point.months === 120 || point.months === 60) &&
            <text x={x(point.months)} y="165" textAnchor="middle">{tenorLabel(point.months)}</text>}
        </g>)}
      </svg> : <p className="bond-curve__notice">Solo hay un plazo disponible; hacen falta al menos dos para dibujar una curva.</p>}
      {spread !== null && <p className={`bond-curve__slope${spread < 0 ? ' bond-curve__slope--inverted' : ''}`}>
        10A − 2A: {spread >= 0 ? '+' : ''}{spread.toFixed(0)} pb · {spread < 0 ? 'Invertida entre 2 y 10 años' : spread === 0 ? 'Plana entre 2 y 10 años' : 'Pendiente positiva entre 2 y 10 años'}
      </p>}
      <div className="bond-curve__points" aria-label="Rentabilidades observadas; elige un plazo para colorear el mapa">
        {points.map(point => <button key={point.months} type="button" className={months === point.months ? 'bond-point bond-point--active' : 'bond-point'}
          aria-pressed={months === point.months} onClick={() => onPickMaturity(point.months)}>
          <span>{tenorLabel(point.months)}</span><strong>{formatPercentEs(point.yield)}</strong>
        </button>)}
      </div>
      <p className="bond-curve__method"><span className="sr-label">Método según la fuente (en inglés): </span><span lang="en">{curve.method}</span></p>
      <a className="bond-curve__source" href={curve.source.url} target="_blank" rel="noreferrer">Fuente: {curve.source.name} ↗</a>
      <p className="bond-curve__method">Datos de una descarga fechada, no cotizaciones en vivo. Las líneas unen plazos publicados; la app no estima rentabilidades intermedias.</p>
    </>}
  </section>;
}
