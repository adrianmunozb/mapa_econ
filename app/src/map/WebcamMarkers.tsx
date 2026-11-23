import { memo, useEffect, useMemo, useState } from 'react';
import { Marker, useMap } from '@vis.gl/react-maplibre';
import { WEBCAMS, type Webcam } from '../data/webcams';
import { clusterWebcams } from './webcamClusters';

export function CameraIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M8 5 6 8H3v12h18V8h-3l-2-3Z" /><circle cx="12" cy="14" r="4" /></svg>;
}

export const WebcamMarkers = memo(function WebcamMarkers({ onSelect, onSelectCluster, country }: {
  onSelect: (camera: Webcam) => void;
  onSelectCluster: (cameras: Webcam[]) => void;
  country?: Webcam['country'];
}) {
  const { current: map } = useMap();
  const [viewportRevision, setViewportRevision] = useState(0);
  useEffect(() => {
    if (!map) return;
    let frame: number | null = null;
    const update = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => { frame = null; setViewportRevision(revision => revision + 1); });
    };
    // moveend includes zoomend; coalesce resize and moveend into one calculation.
    map.on('moveend', update);
    map.on('resize', update);
    return () => {
      map.off('moveend', update);
      map.off('resize', update);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [map]);
  const available = useMemo(() => country ? WEBCAMS.filter(camera => camera.country === country) : WEBCAMS, [country]);
  const groups = useMemo(() => {
    if (!map) return [];
    const { clientWidth, clientHeight } = map.getContainer();
    const longitude = map.getCenter().lng;
    return clusterWebcams(available, ([lng, lat]) => map.project([lng + 360 * Math.round((longitude - lng) / 360), lat]), clientWidth, clientHeight);
  // MapLibre mutates its transform in place; this revision invalidates projection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, available, viewportRevision]);

  return <>{groups.map(group => {
    const multiple = group.cameras.length > 1;
    const camera = group.cameras[0];
    const label = multiple ? `Ver ${group.cameras.length} cámaras agrupadas` : `Abrir cámara: ${camera.name}`;
    return <Marker key={group.id} longitude={group.center[0]} latitude={group.center[1]} anchor="center" style={{ zIndex: 3 }}>
      <button type="button" className={`webcam-marker${multiple ? ' webcam-marker--cluster' : ''}`} aria-label={label}
        title={multiple ? `${group.cameras.length} cámaras · Acerca el mapa para separarlas` : camera.name}
        onDoubleClick={event => event.stopPropagation()}
        onClick={event => {
          event.stopPropagation();
          if (!multiple) { onSelect(camera); return; }
          if (!map) return;
          const coincident = group.cameras.every(item => item.coordinates[0] === camera.coordinates[0] && item.coordinates[1] === camera.coordinates[1]);
          if (coincident || map.getZoom() >= map.getMaxZoom() - 0.01) { onSelectCluster(group.cameras); return; }
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          map.flyTo({ center: group.center, zoom: Math.min(map.getMaxZoom(), map.getZoom() + 2.5), duration: reducedMotion ? 0 : 600 });
        }}>
        {multiple ? <><span className="webcam-marker__count">{group.cameras.length}</span><span className="webcam-marker__caption">cámaras</span></> : <CameraIcon />}
      </button>
    </Marker>;
  })}</>;
});
