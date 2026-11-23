import { useMemo, useState } from 'react';
import { NEWS_TOPICS, parseNewsImport, publisherId, newsTopic, type NewsArticle, type NewsHotspot, type NewsSnapshot, type NewsTopic, type NewsGeography } from '../data/news';
import './news.css';

export function NewsControls({ enabled, onToggle, snapshot, hotspots, total, unmapped, hours, onHours, selected, onSelect, onImport, onReset, automatic, now,
  eventCount, sourceCount, baselineReady, topic, onTopic, geography, onGeography, sources, onSources, offset, onOffset,
}: {
  enabled: boolean; onToggle: () => void; snapshot: NewsSnapshot; hotspots: NewsHotspot[]; total: number; unmapped: number;
  hours: number; onHours: (hours: number) => void; selected: string | null; onSelect: (id: string | null) => void;
  onImport: (articles: NewsArticle[]) => void; onReset: () => void; automatic: boolean; now: number;
  eventCount: number; sourceCount: number; baselineReady: boolean;
  topic: NewsTopic | 'all'; onTopic: (topic: NewsTopic | 'all') => void;
  geography: NewsGeography; onGeography: (geography: NewsGeography) => void;
  sources: string[]; onSources: (sources: string[]) => void; offset: number; onOffset: (offset: number) => void;
}) {
  const [message, setMessage] = useState('');
  const active = hotspots.find(spot => spot.id === selected);
  const reference = now - offset * 3_600_000;
  const availableSources = useMemo(() => {
    const feeds = new Map((snapshot.sources ?? []).map(source => [source.id, source]));
    for (const article of snapshot.articles) {
      const id = publisherId(article);
      if (!feeds.has(id)) feeds.set(id, { id, name: article.source, url: new URL(article.url).origin, status: 'ok' });
    }
    return [...feeds.values()];
  }, [snapshot]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const end = now - (6 - i) * 86_400_000;
    return { end, count: snapshot.articles.filter(article => {
      const stamp = Date.parse(article.publishedAt);
      return stamp > end - 86_400_000 && stamp <= end && (!sources.length || sources.includes(publisherId(article))) && (topic === 'all' || newsTopic(article) === topic);
    }).length };
  }), [snapshot.articles, now, sources, topic]);
  const stale = snapshot.generatedAt && now - Date.parse(snapshot.generatedAt) > 86_400_000;
  const trendText = (spot: NewsHotspot) => spot.isNew ? 'Foco emergente' : spot.trend != null ? `${spot.trend >= 0 ? '+' : ''}${Math.round(spot.trend)} % de atención` : baselineReady ? 'Sin señal suficiente' : 'Historial insuficiente';

  return <section className="news-controls" aria-label="Noticias y focos geográficos">
    <button type="button" className={`btn toggle news-toggle${enabled ? ' toggle--on' : ''}`} aria-pressed={enabled} aria-controls="news-content" onClick={onToggle}>
      <span className="news-dot" aria-hidden="true" /> Radar de noticias <span>{enabled ? 'ON' : 'OFF'}</span>
    </button>
    {enabled && <div id="news-content">
      <div className="news-heading"><strong>Qué está cambiando</strong><span>{offset ? 'HISTÓRICO' : 'ACTUALIDAD'}</span></div>
      <div className="news-stats"><span><b>{eventCount}</b> acontecimientos</span><span><b>{sourceCount}</b> medios</span><span><b>{hotspots.length}</b> focos</span></div>
      <div className="news-filters">
        <label className="news-window">Periodo<select value={hours} onChange={event => onHours(Number(event.target.value))}>
          <option value={24}>24 horas</option><option value={72}>3 días</option><option value={168}>7 días</option>
        </select></label>
        <label className="news-window">Tema<select value={topic} onChange={event => onTopic(event.target.value as NewsTopic | 'all')}>
          {Object.entries(NEWS_TOPICS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
      </div>
      <label className="news-window news-geography">Ubicación<select value={geography} onChange={event => onGeography(event.target.value as NewsGeography)}>
        <option value="mentioned">Países mencionados</option><option value="occurrence">Lugar del suceso</option>
      </select></label>
      <p className="news-caption">{geography === 'mentioned' ? 'Los puntos señalan países de los que se habla; pueden ser participantes y no el lugar del suceso.' : 'Solo ubicaciones explícitas o ciudades detectadas en el titular. Los lugares inferidos son aproximados; no se fuerza una ubicación.'}</p>

      <div className="news-history"><div className="news-heading"><strong>Evolución de la cobertura</strong><button type="button" className="btn" disabled={offset === 0} onClick={() => onOffset(0)}>Ahora</button></div>
        <div className="news-days">{days.map((day, i) => <button type="button" key={day.end} title={`${new Date(day.end).toLocaleDateString('es-ES')}: ${day.count} noticias en las 24 h anteriores`} aria-label={`Ver hace ${6 - i} días, ${day.count} noticias`} onClick={() => onOffset((6 - i) * 24)}>
          <i style={{ height: `${5 + 29 * day.count / Math.max(1, ...days.map(day => day.count))}px` }} /><small>{i === 6 ? 'Hoy' : `−${6 - i}d`}</small>
        </button>)}</div>
        <label className="news-caption" htmlFor="news-history-offset">{offset ? `Hace ${offset} horas · ${new Date(reference).toLocaleString('es-ES')}` : 'Ahora · mueve el control para explorar los últimos 7 días'}</label>
        <input id="news-history-offset" type="range" min="0" max="168" step="6" value={offset} onChange={event => onOffset(Number(event.target.value))} aria-label="Horas atrás en el mapa de noticias" />
        <small className="news-caption">Barras: noticias por 24 h. Archivo por fecha de publicación; una barra vacía también puede indicar falta de recogida.</small>
      </div>

      <div className="news-key"><span><i className="news-key__volume" />Amarillo → naranja → rojo: más cobertura</span><span><i className="news-key__surge" />Borde claro: subida o foco emergente</span><span><i className="news-key__new" />Halo: recién recibido</span></div>
      <p className="news-caption">{baselineReady ? 'Cambio: acontecimientos de las últimas 24 h frente a la media diaria de los 3 días anteriores, con las mismas fuentes. Señal: al menos 3 acontecimientos recientes y 2 medios.' : 'Historial insuficiente para medir subidas: se necesitan 4 días de recogida comparable. El color refleja la cobertura relativa, de amarillo a rojo.'} Mide atención, no gravedad. Agrupación y temas aproximados.</p>

      <details className="news-source-panel"><summary>Fuentes y estado · {availableSources.length}</summary>
        <button type="button" className="btn" onClick={() => onSources([])}>Todos los medios</button>
        {availableSources.map(source => <div className="news-source" key={source.id}>
          <label><input type="checkbox" checked={!sources.length || sources.includes(source.id)} onChange={event => {
            const current = sources.length ? sources : availableSources.map(source => source.id);
            const next = event.target.checked ? [...new Set([...current, source.id])] : current.filter(id => id !== source.id);
            if (next.length) onSources(next);
          }} />{source.name}</label>
          <span className={source.status === 'error' ? 'news-source--error' : ''}>{source.status === 'error' ? 'Sin actualizar' : automatic ? 'Recibido' : 'En archivo'}</span>
          <small>{source.language?.toUpperCase()} {source.region} {source.lastSuccessAt ? `· ${new Date(source.lastSuccessAt).toLocaleString('es-ES')}` : ''}</small>
          <a href={source.url} target="_blank" rel="noopener noreferrer">Fuente ↗</a>
        </div>)}
        <p className="news-caption">Los medios son editores distintos según el dominio, no una garantía de independencia ni de veracidad.</p>
      </details>
      {!!snapshot.warnings?.length && <p className="news-warning" role="status">{snapshot.warnings.join(' · ')}</p>}
      <p className="news-caption">{snapshot.generatedAt ? `Última carga: ${new Date(snapshot.generatedAt).toLocaleString('es-ES')}` : 'Sin fuentes cargadas.'} {stale ? 'Carga antigua.' : ''} {automatic ? 'RSS cada 15 min con la capa activa.' : 'Archivo estático o importado.'}</p>
      <details className="news-import-panel"><summary>Importar una hoja o un feed</summary>
        <div className="news-import"><label className="btn">CSV / JSON / RSS<input type="file" accept=".csv,.json,.xml,.rss,.atom,text/csv,application/json,application/xml,text/xml" onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
          try {
            if (file.size > 5_000_000) throw new Error('El límite es de 5 MB por archivo.');
            const articles = parseNewsImport(await file.text()); onImport(articles); setMessage(`${articles.length} noticias importadas en este dispositivo.`);
          } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo importar.'); }
        }} /></label><button className="btn" type="button" onClick={() => { onReset(); setMessage('Fuentes originales restauradas.'); }}>Restablecer</button></div>
        <p className="news-caption">Columnas: title,url,publishedAt,source,countries. Fecha ISO con zona horaria. Opcionales: eventCountries para el lugar del suceso (CHE), eventId para agrupar, topic (geopolitics/economy/energy/disasters/other). countries contiene los participantes (IRN|USA). Los archivos permanecen en memoria al importar.</p>
      </details>
      {message && <p className="news-caption" role="status">{message}</p>}
      <p className="news-caption">{total} noticias · {unmapped} sin ubicación {geography === 'occurrence' ? 'del suceso' : 'reconocida'}.</p>
      {!total && <p className="news-empty">No hay noticias con estos filtros. Amplía el periodo, vuelve a Ahora o importa datos recientes.</p>}
      {total > 0 && !hotspots.length && <p className="news-empty">Hay noticias, pero ninguna tiene una ubicación reconocida en esta vista.</p>}
      <div className="news-ranking">{hotspots.map(spot => <button type="button" key={spot.id} className={selected === spot.id ? 'news-country news-country--active' : 'news-country'} onClick={() => onSelect(spot.id)}>
        <span>{spot.name}<small>{spot.events.length} acontecimientos · {spot.sourceCount} medios</small><small className={spot.isNew || (spot.trend ?? 0) >= 50 ? 'news-trend--up' : ''}>{trendText(spot)}</small></span><span className="news-meter"><i style={{ width: `${spot.intensity * 100}%` }} /></span><b>{spot.articles.length}</b>
      </button>)}</div>
      {active && <div className="news-stories"><div className="news-heading"><strong>{active.name}</strong><button type="button" className="btn" aria-label="Cerrar noticias del foco" onClick={() => onSelect(null)}>×</button></div>
        {active.events.map(event => <details className="news-event" key={event.id} open={active.events.length === 1}>
          <summary><span>{event.title}</span><small>{event.articles.length} noticias · {event.sourceCount} medios · {NEWS_TOPICS[event.topic]}</small></summary>
          <p className="news-caption">Países mencionados: {event.countries.join(', ') || 'sin detectar'}. Lugar: {event.places.map(place => `${place.name} (${place.basis === 'explicit' ? 'explícito' : 'inferido del titular'})`).join(' · ') || 'sin confirmar'}.</p>
          {event.articles.map(article => <article key={article.url}><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title} ↗</a><small>{article.source} · {new Date(article.publishedAt).toLocaleString('es-ES')}</small></article>)}
        </details>)}
      </div>}
    </div>}
  </section>;
}
