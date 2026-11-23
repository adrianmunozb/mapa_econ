import { useEffect, useRef, useState } from 'react';
import { webcamCountryName, webcamDetailLine, webcamPlayerUrl, webcamSourceUrl, type Webcam } from '../data/webcams';
import { HlsWebcamPlayer } from './HlsWebcamPlayer';

export function WebcamModal({ camera, onClose }: { camera: Webcam; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    const syncOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    return () => {
      element?.close();
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return <dialog ref={dialog} className="webcam-dialog" aria-labelledby="webcam-title" aria-describedby="webcam-description"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="webcam-dialog__content">
      <header className="webcam-dialog__header">
        <div><span className="webcam-dialog__eyebrow">VÍDEO EN DIRECTO · {webcamCountryName(camera.country).toUpperCase()}</span>
          <h2 id="webcam-title">{camera.name}</h2><p>{webcamDetailLine(camera)} · ubicación aproximada</p></div>
        <button type="button" className="panel__close" aria-label="Cerrar cámara" onClick={onClose} autoFocus>×</button>
      </header>
      {online ? camera.videoId ? <iframe key={camera.id} className="webcam-dialog__player" src={webcamPlayerUrl(camera)}
        title={`Cámara en directo de ${camera.name}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        : camera.streamUrl ? <HlsWebcamPlayer key={camera.id} streamUrl={camera.streamUrl} title={`Cámara en directo de ${camera.name}`} />
          : <div className="webcam-dialog__offline" role="status">Esta cámara no tiene una dirección de vídeo disponible.</div>
        : <div className="webcam-dialog__offline" role="status">Conéctate a internet para ver esta cámara.</div>}
      {camera.attribution && <p className="webcam-dialog__attribution">{camera.attribution}{' '}
        <a href={webcamSourceUrl(camera)} target="_blank" rel="noopener noreferrer">Emisión original ↗</a></p>}
      <p id="webcam-description">{camera.videoId
        ? 'Emisión de vídeo en directo, con el retraso habitual del streaming. Si has retrocedido, pulsa «EN DIRECTO» en el reproductor para volver al momento actual.'
        : 'Emisión HLS pública del operador, con el retraso habitual del streaming. La disponibilidad depende de la fuente.'}</p>
      <a href={webcamSourceUrl(camera)} target="_blank" rel="noopener noreferrer">
        {camera.videoId ? 'Abrir directo en YouTube ↗' : 'Abrir stream HLS ↗'}
      </a>
      <footer>Fuente: <a href={camera.sourceUrl} target="_blank" rel="noopener noreferrer">{camera.provider}</a>
        {' · '}Si la emisión se interrumpe, abre la fuente o elige otra cámara.</footer>
    </div>
  </dialog>;
}
