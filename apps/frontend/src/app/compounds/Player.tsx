'use client';
import { useEffect, useState } from 'react';

const DEFAULT_URL = 'https://www.youtube.com/watch?v=tjsNLuKlNso';

type Props = { muted: boolean };

function toEmbedUrl(url: string, muted: boolean): string {
  const videoId = url.match(/[?&]v=([^&]+)/)?.[1] ?? url.split('/').pop() ?? '';
  const mute = muted ? 1 : 0;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${mute}&controls=0&loop=1&playlist=${videoId}&rel=0`;
}

export default function Player({ muted }: Props) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/playlist')
      .then(res => res.json())
      .then(data => {
        const url = Array.isArray(data) && data.length > 0 ? data[0].url : DEFAULT_URL;
        setEmbedUrl(toEmbedUrl(url, muted));
      })
      .catch(() => setEmbedUrl(toEmbedUrl(DEFAULT_URL, muted)));
  }, [muted]);

  if (!embedUrl) return null;

  return (
    <iframe
      src={embedUrl}
      allow="autoplay; encrypted-media"
      allowFullScreen
      style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0.375rem' }}
    />
  );
}
