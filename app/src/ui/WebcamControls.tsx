import { memo, useMemo, useState } from 'react';
import { WEBCAMS, webcamCountryName, webcamDetailLine, type Webcam } from '../data/webcams';
import { CameraIcon } from '../map/WebcamMarkers';

const PAGE_SIZE = 40;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
const SEARCH_INDEX = WEBCAMS.map(camera => ({
  camera,
  text: normalize([camera.name, camera.locality ?? '', camera.area, camera.category, camera.provider, webcamCountryName(camera.country)].join(' ')),
}));

function CameraRows({ cameras, onSelect }: { cameras: Webcam[]; onSelect: (camera: Webcam) => void }) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  return <>
    {cameras.slice(0, limit).map(camera => <button type="button" key={camera.id} onClick={() => onSelect(camera)}>
      <span>{camera.name}<small>{webcamDetailLine(camera)}</small></span><span aria-hidden="true">↗</span>
    </button>)}
    {limit < cameras.length && <button type="button" className="webcam-load-more" onClick={() => setLimit(value => value + PAGE_SIZE)}>
      Mostrar {Math.min(PAGE_SIZE, cameras.length - limit)} más · {limit} de {cameras.length}
    </button>}
  </>;
}

function CountryCameras({ code, cameras, onSelect, initiallyOpen }: {
  code: string; cameras: Webcam[]; onSelect: (camera: Webcam) => void; initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{webcamCountryName(code)} · {cameras.length}</summary>
    {open && <CameraRows cameras={cameras} onSelect={onSelect} />}
  </details>;
}

export const WebcamControls = memo(function WebcamControls({ enabled, onToggle, onSelect, clusterCameras, onSelectClusterCamera, onClearCluster, country }: {
  enabled: boolean;
  onToggle: () => void;
  onSelect: (camera: Webcam) => void;
  clusterCameras?: Webcam[] | null;
  onSelectClusterCamera?: (camera: Webcam) => void;
  onClearCluster?: () => void;
  country?: Webcam['country'];
}) {
  const [query, setQuery] = useState('');
  const search = normalize(query.trim());
  const { countries, count } = useMemo(() => {
    const groups = new Map<string, Webcam[]>();
    let count = 0;
    for (const { camera, text } of SEARCH_INDEX) {
      if ((country && camera.country !== country) || (search && !text.includes(search))) continue;
      const group = groups.get(camera.country);
      if (group) group.push(camera);
      else groups.set(camera.country, [camera]);
      count++;
    }
    return { countries: [...groups].sort(([a], [b]) => webcamCountryName(a).localeCompare(webcamCountryName(b), 'es')), count };
  }, [country, search]);
  return <div className="webcam-controls">
    <button type="button" className={`btn toggle webcam-toggle${enabled ? ' toggle--on' : ''}`} aria-pressed={enabled}
      aria-controls="webcam-list" onClick={onToggle}>
      <CameraIcon /> Cámaras en directo <span>{enabled ? 'ON' : 'OFF'}</span>
    </button>
    {enabled && <div id="webcam-list" className="webcam-list">
      <p>Vídeo en directo · {count} cámaras gratuitas</p>
      <p className="webcam-map-hint">Los números agrupan cámaras cercanas. Pulsa un grupo para acercarte; si coinciden, podrás elegir de una lista.</p>
      {clusterCameras && clusterCameras.length > 0 && <section className="webcam-cluster-selection" aria-labelledby="webcam-cluster-title">
        <div className="webcam-cluster-selection__head">
          <div><h3 id="webcam-cluster-title">{clusterCameras.length} cámaras agrupadas</h3>
            <p>Elige una cámara; el vídeo solo se carga al pulsarla.</p></div>
          {onClearCluster && <button type="button" className="webcam-cluster-selection__close" aria-label="Cerrar lista de cámaras agrupadas" onClick={onClearCluster}>×</button>}
        </div>
        <CameraRows key={clusterCameras.map(camera => camera.id).join(',')} cameras={clusterCameras} onSelect={onSelectClusterCamera ?? onSelect} />
      </section>}
      <label className="webcam-search">
        <input type="search" aria-label="Buscar cámaras por ciudad, estado, país o nombre" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar ciudad, país o cámara…" />
      </label>
      {count === 0 && <p className="webcam-empty" role="status">No hay cámaras que coincidan con «{query}».</p>}
      {countries.map(([code, cameras]) => <CountryCameras key={`${code}:${search}`} code={code} cameras={cameras}
        onSelect={onSelect} initiallyOpen={!!country || (!!search && countries.length <= 3)} />)}
    </div>}
  </div>;
});