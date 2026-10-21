import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';

export function HlsWebcamPlayer({ streamUrl, title }: { streamUrl: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | undefined;
    let failed = false;

    const fail = () => {
      if (failed) return;
      failed = true;
      setError('Esta emisión no está disponible ahora. Prueba la fuente original o elige otra cámara.');
      hls?.destroy();
      hls = undefined;
    };

    video.addEventListener('error', fail);
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) fail();
      });
      hls.attachMedia(video);
      hls.loadSource(streamUrl);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else {
      fail();
    }

    return () => {
      video.removeEventListener('error', fail);
      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [streamUrl]);

  return <>
    <div className="webcam-dialog__player-frame">
      <video ref={videoRef} className="webcam-dialog__player" title={title}
        autoPlay muted playsInline controls preload="none" />
    </div>
    {error && <p className="webcam-dialog__stream-error" role="status">{error}</p>}
  </>;
}
