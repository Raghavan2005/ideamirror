'use client';
import ReactPlayer from 'react-player';
import { useEffect, useState } from 'react';

const DEFAULT_URL = 'https://www.youtube.com/watch?v=tjsNLuKlNso';

type Props = { muted: boolean };

export default function Player({ muted }: Props) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const loadPlaylist = () => {
    setPlaying(false);
    fetch('http://localhost:4000/api/playlist')
      .then(res => res.json())
      .then(data => {
        const url = Array.isArray(data) && data.length > 0 ? data[0].url : DEFAULT_URL;
        setCurrentUrl(url);
      })
      .catch(() => setCurrentUrl(DEFAULT_URL));
  };

  useEffect(() => { loadPlaylist(); }, []);

  return (
    <div className="w-full h-full">
      {currentUrl ? (
        <ReactPlayer
          url={currentUrl}
          playing={playing}
          onReady={() => setPlaying(true)}
          muted={muted}
          controls={false}
          width="100%"
          height="100%"
          style={{ borderRadius: '0.375rem' }}
          onEnded={loadPlaylist}
        />
      ) : (
        <div className="text-white text-center p-10 font-mono text-xl">Loading video...</div>
      )}
    </div>
  );
}
