import { Marker } from '@vis.gl/react-maplibre';
import { newsHeatColor, type NewsHotspot } from '../data/news';

export function NewsMarkers({ hotspots, selected, onSelect }: { hotspots: NewsHotspot[]; selected: string | null; onSelect: (iso: string) => void }) {
  return <>{hotspots.map(spot => {
    const size = 22 + 32 * spot.intensity;
    const surge = spot.isNew || (spot.trend ?? 0) >= 50;
    const fresh = spot.fresh;
    return <Marker key={spot.id} longitude={spot.coordinates[0]} latitude={spot.coordinates[1]} anchor="center">
      <button className={`news-marker${surge ? ' news-marker--surge' : ''}${selected === spot.id ? ' news-marker--selected' : ''}${fresh ? ' news-marker--fresh' : ''}`} type="button"
        style={{ width: size, height: size, backgroundColor: newsHeatColor(spot.intensity) }}
        title={`${spot.name} · ${spot.events.length} acontecimientos · ${spot.sourceCount} medios · ${spot.trend == null ? spot.isNew ? 'Foco emergente' : 'Sin aumento confirmado' : `${Math.round(spot.trend)} % de atención`}`} aria-label={`Noticias en ${spot.name}: ${spot.events.length} acontecimientos`} aria-pressed={selected === spot.id}
        onDoubleClick={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onSelect(spot.id); }} />
    </Marker>;
  })}</>;
}
