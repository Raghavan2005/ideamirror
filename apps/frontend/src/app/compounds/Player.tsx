'use client';
import { useEffect, useRef, useState } from 'react';

const DEFAULT_URL = 'https://www.youtube.com/watch?v=tjsNLuKlNso';

type Props = { muted: boolean; volume: number };

function toEmbedUrl(url: string): string {
  const videoId = url.match(/[?&]v=([^&]+)/)?.[1] ?? url.split('/').pop() ?? '';
  // Always start muted so autoplay is allowed; we unmute via postMessage after load
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&rel=0&enablejsapi=1`;
}

export default function Player({ muted, volume }: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  mutedRef.current = muted;
  volumeRef.current = volume;

  useEffect(() => {
    fetch('http://localhost:4000/api/playlist')
      .then(res => res.json())
      .then(data => {
        const url = Array.isArray(data) && data.length > 0 ? data[0].url : DEFAULT_URL;
        setVideoUrl(url);
      })
      .catch(() => setVideoUrl(DEFAULT_URL));
  }, []);

  function sendCmd(func: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }), '*'
    );
  }

  function applyAudio() {
    if (mutedRef.current) {
      sendCmd('mute');
    } else {
      sendCmd('setVolume', [volumeRef.current]);
      sendCmd('unMute');
    }
  }

  // Apply audio once iframe finishes loading
  function handleLoad() {
    readyRef.current = true;
    setTimeout(applyAudio, 500);
  }

  // Reactively apply when muted or volume changes (no remount needed)
  useEffect(() => {
    if (readyRef.current) applyAudio();
  }, [muted, volume]); // eslint-disable-line

  if (!videoUrl) return null;

  return (
    <iframe
      ref={iframeRef}
      key={videoUrl}
      src={toEmbedUrl(videoUrl)}
      allow="autoplay; encrypted-media"
      allowFullScreen
      onLoad={handleLoad}
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
}
