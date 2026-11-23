import { memo, useEffect, useRef, useState } from 'react';
import './maritime.css';
import { CHOKEPOINTS, MARITIME_REVIEW_DATE, chokepointColor, type MaritimeChokepoint } from '../data/chokepoints';
import { TRAFFIC, trafficChart, trafficSeries, trafficSummary } from '../data/maritimeTraffic';
import { maritimeMatchTerms, matchesMaritimeSearch } from '../data/maritimeSearch';
import { MaritimeSearch } from './MaritimeSearch';

interface Props {
  chokepoint: MaritimeChokepoint;
  onClose: () => void;
  onSelect: (point: MaritimeChokepoint) => void;
  showRoutes: boolean;
  onToggleRoutes: () => void;
}
const number = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 });
const date = (value: string) => new Date(value.length === 10 ? `${value}T12:00:00Z` : value).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });

export const MaritimeExplorer = memo(function MaritimeExplorer({ chokepoint: point, onClose, onSelect, showRoutes, onToggleRoutes }: Props) {
  const [tab, setTab] = useState<'overview' | 'traffic' | 'compare'>('overview');
  const [filter, setFilter] = useState('');
  const [kind, setKind] = useState('Todos');
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openResult = (result: MaritimeChokepoint) => {
    onSelect(result);
    setTab('overview');
    cardRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('keydown', keydown);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [onClose]);
  const color = `rgb(${chokepointColor(point).join(',')})`;
  const series = trafficSeries(point.id);
  const summary = trafficSummary(series, TRAFFIC.endDate);
  const filtered = CHOKEPOINTS.filter((item) => (kind === 'Todos' || item.kind === kind)
    && matchesMaritimeSearch(item, filter));
  return (
    <section ref={cardRef} className={`chokepoint-card hud${tab === 'compare' ? ' chokepoint-card--search' : ''}`} role="region" aria-label="Explorador de pasos marítimos">
      <div className="chokepoint-card__header">
        <div><span className="maritime-eyebrow">{tab === 'compare' ? 'EXPLORADOR MARÍTIMO' : `COMERCIO MARÍTIMO · ${point.kind}`}</span><h3 ref={headingRef} tabIndex={-1} className="chokepoint-card__name">{tab === 'compare' ? 'Buscar pasos marítimos' : point.name}</h3><span className="chokepoint-card__sub">{tab === 'compare' ? 'Encuentra un paso y ábrelo en el mapa' : point.location}</span></div>
        <button ref={closeRef} type="button" className="panel__close" onClick={onClose} aria-label="Cerrar explorador marítimo">×</button>
      </div>
      {tab !== 'compare' && <><label className="maritime-picker">Explorar paso
        <select value={point.id} onChange={(event) => { const next = CHOKEPOINTS.find((item) => item.id === event.target.value); if (next) onSelect(next); }}>
          {CHOKEPOINTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <div className="chokepoint-card__badges">
        <span className="chokepoint-card__risk" style={{ color, borderColor: color }}>Importancia {point.importance.toLowerCase()}</span>
        <span className="chokepoint-card__control">Estado operativo: sin verificar</span>
      </div></>}
      <nav className="maritime-tabs" aria-label="Contenido marítimo">
        {([['overview', 'Resumen'], ['traffic', 'Tráfico'], ['compare', 'Buscar pasos']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => { setTab(id); cardRef.current?.scrollTo({ top: 0 }); }}>{label}</button>)}
      </nav>
      {tab === 'overview' && <div className="maritime-content">
        <p className="chokepoint-card__desc">{point.description}</p>
        <p className="maritime-muted">{point.importanceReason} Clasificación editorial estructural; no mide la probabilidad de cierre.</p>
        <div className="maritime-tags">{point.goods.map((good) => <span key={good}>{good}</span>)}</div>
        {point.metrics.length ? point.metrics.map((metric) => <article className="maritime-metric" key={metric.label}>
          <span>{metric.label} · {metric.estimated ? 'Estimación' : 'Dato publicado'}</span>
          <strong>{number(metric.value)} <small>{metric.unit}</small></strong>
          <span>{metric.period}</span><p>{metric.scope}</p>
          <a href={metric.sourceUrl} target="_blank" rel="noreferrer">{metric.source} ↗</a>
        </article>) : <p className="maritime-muted">Sin cuota comercial verificada. Consulta los tránsitos en la pestaña Tráfico.</p>}
        <dl className="maritime-details">
          <dt>Ubicación / administración</dt><dd>{point.geography}</dd>
          <dt>Amenazas estructurales</dt><dd>{point.threats.join(' · ')}</dd>
          <dt>Países y cadenas expuestos</dt><dd>{point.exposure}</dd>
          <dt>Alternativas y límites</dt><dd>{point.alternative}</dd>
        </dl>
        <button className="btn maritime-route-toggle" type="button" aria-pressed={showRoutes} onClick={onToggleRoutes}>{showRoutes ? 'Ocultar corredores del mapa' : 'Mostrar corredores en el mapa'}</button>
        <p className="maritime-muted"><span className="maritime-key maritime-key--main" /> Principal · <span className="maritime-key maritime-key--alternative" /> Alternativa. Trazados esquemáticos, sin seguimiento de buques. Los arcos bilaterales no indican rutas marítimas.</p>
        <details><summary>Fuentes y metodología</summary>
          <p className="maritime-muted">Contenido revisado el {date(MARITIME_REVIEW_DATE)}. Los periodos de cada dato pueden ser anteriores. Las relaciones geográficas sin porcentaje son cualitativas.</p>
          <ul>{point.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a></li>)}</ul>
        </details>
      </div>}
      {tab === 'traffic' && <div className="maritime-content">
        <p className="maritime-muted">Instantánea del {date(TRAFFIC.startDate)} al {date(TRAFFIC.endDate)}. Tránsitos estimados a partir de AIS; no es un estado en directo ni una medida del valor de la carga.</p>
        <div className="maritime-traffic-stats">
          <div><span>Último día</span><strong>{summary.latest === null ? 'Sin dato' : number(summary.latest)}</strong><small>buques · {date(TRAFFIC.endDate)}</small></div>
          <div><span>Media de 30 días</span><strong>{summary.current === null ? 'Sin cobertura' : number(summary.current)}</strong><small>buques/día</small></div>
          <div><span>Frente a 30 días previos</span><strong>{summary.change === null ? 'No comparable' : `${summary.change > 0 ? '+' : ''}${number(summary.change)}%`}</strong><small>variación del tráfico</small></div>
        </div>
        <figure className="maritime-chart">
          <svg viewBox="0 0 400 120" role="img" aria-label={`Tránsitos diarios de ${point.name}, ${TRAFFIC.startDate} a ${TRAFFIC.endDate}`}><path d="M10,105 H390" stroke="#475569" /><path d={trafficChart(series, TRAFFIC.startDate, TRAFFIC.endDate)} fill="none" stroke="#5eead4" strokeWidth="2" /></svg>
          <figcaption>{date(TRAFFIC.startDate)} — {date(TRAFFIC.endDate)} · escala 0–{number(Math.max(1, ...series.map((day) => day.vessels ?? 0)))} buques/día</figcaption>
        </figure>
        <details><summary>Ver los 90 días de datos</summary><div className="maritime-table-scroll"><table><caption>{point.name} · tránsitos AIS estimados</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Buques</th></tr></thead><tbody>{series.map((day) => <tr key={day.date}><td>{date(day.date)}</td><td>{day.vessels === null ? 'Sin dato' : number(day.vessels)}</td></tr>)}</tbody></table></div></details>
        <p className="maritime-muted">Los buques sin señal AIS y las revisiones de la fuente limitan la cobertura. Una caída de tráfico no demuestra un cierre. Las medias solo se calculan con todos los días del periodo.</p>
        <p className="maritime-muted">{point.id === 'bosporus' && 'Esta serie mide el Bósforo, no los Dardanelos. '}Descargado el {date(TRAFFIC.retrievedAt)}. Actualización manual, sin consultas al abrir el mapa.</p>
        <a href={TRAFFIC.methodologyUrl} target="_blank" rel="noreferrer">IMF PortWatch / UN Global Platform · metodología ↗</a>{' · '}<a href={TRAFFIC.termsUrl} target="_blank" rel="noreferrer">Condiciones de uso ↗</a>
      </div>}
      {tab === 'compare' && <div className="maritime-content">
        <p className="maritime-search-help">Elige un resultado para abrir su ficha y centrar el mapa.</p>
        <div className="maritime-inputs"><MaritimeSearch value={filter} onChange={setFilter} kind={kind} /><label>Tipo<select value={kind} onChange={(e) => setKind(e.target.value)}>{['Todos', 'Estrecho', 'Canal', 'Ruta alternativa'].map((value) => <option key={value}>{value}</option>)}</select></label></div>
        <div className="maritime-results-summary">
          <p role="status">{filter.trim()
            ? `${filtered.length} ${filtered.length === 1 ? 'paso coincide' : 'pasos coinciden'} con «${filter.trim()}»`
            : `${filtered.length} ${filtered.length === 1 ? 'paso disponible' : 'pasos disponibles'}`}{kind !== 'Todos' ? ` · ${kind}` : ''}</p>
          {(filter || kind !== 'Todos') && <button type="button" onClick={() => { setFilter(''); setKind('Todos'); }}>Limpiar filtros</button>}
        </div>
        {!filter && kind === 'Todos' && <div className="maritime-search-examples"><span>Prueba con:</span>{['Petróleo', 'Sequía', 'Suez'].map((example) => <button key={example} type="button" onClick={() => setFilter(example)}>{example}</button>)}</div>}
        <ul className="maritime-results" aria-label="Pasos que coinciden con la búsqueda">{filtered.map((item) => {
          const stats = trafficSummary(trafficSeries(item.id), TRAFFIC.endDate);
          const matches = maritimeMatchTerms(item, filter);
          return <li key={item.id} className="maritime-result">
            <span className="maritime-result__type">{item.kind} · {item.location}</span>
            <h4>{item.name}</h4>
            {matches.length > 0 && <div className="maritime-match-reasons">{matches.map((match) => <span key={`${match.category}-${match.label}`}>{match.category}: <strong>{match.label}</strong></span>)}</div>}
            <p className="maritime-result__context">{item.importanceReason}</p>
            <button type="button" className="btn maritime-result__open" onClick={() => openResult(item)} aria-label={`Ver ficha y mapa de ${item.name}`}>Ver ficha y mapa <span aria-hidden="true">→</span></button>
            <details><summary>Tráfico observado</summary><div className="maritime-result__traffic"><span><strong>{stats.current === null ? 'Sin dato' : number(stats.current)}</strong> buques/día</span><span>{stats.change === null ? 'Sin comparación' : `${stats.change > 0 ? '+' : ''}${number(stats.change)}% frente a 30 días previos`}</span></div><p className="maritime-muted">Media de los 30 días hasta el {date(TRAFFIC.endDate)}.</p></details>
          </li>;
        })}</ul>
        {filtered.length === 0 && <p className="maritime-empty">No hay coincidencias con estos filtros. Prueba otro término o pulsa «Limpiar filtros» para ver todos los pasos.</p>}
        <details><summary>Cómo interpretar el tráfico</summary><p className="maritime-muted">Media diaria de los 30 días hasta el {date(TRAFFIC.endDate)}. La variación compara con los 30 días anteriores. Los buques no miden valor ni tonelaje. Los tráficos de distintos pasos no son sumables: un buque o una carga pueden atravesar varios.</p></details>
      </div>}
    </section>
  );
});
