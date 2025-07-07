'use client';
import ReactPlayer from 'react-player';
import { useEffect, useRef, useState } from 'react';

type Video = {
  id: number;
  url: string;
};

export default function Player() {
  const [playlist, setPlaylist] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const defaultVideo: Video = {
    id: 0,
    url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
  };

  const loadPlaylist = () => {
    fetch('http://localhost:4000/api/playlist')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlaylist(data);
          setCurrentIndex(0);
          currentIndexRef.current = 0;
          setCurrentUrl(null);
          setTimeout(() => {
            setCurrentUrl(data[0].url);
          }, 100);
        } else {
          setPlaylist([]);
          setCurrentUrl(null);
          setTimeout(() => {
            setCurrentUrl(defaultVideo.url);
          }, 100);
        }
        setReady(true);
      })
      .catch((err) => {
        console.error('Failed to load playlist:', err);
        setPlaylist([]);
        setCurrentUrl(defaultVideo.url);
        setReady(true);
      });
  };

  useEffect(() => {
    loadPlaylist(); // load on mount
  }, []);

  const handleVideoEnd = () => {
    // Re-fetch playlist when video ends (simulating one-video rotation)
    loadPlaylist();
  };

  return (
    <div className="w-full h-screen">
      {ready && currentUrl ? (
        <ReactPlayer
          src={currentUrl}
          playing
          muted
          controls={false}
          width="100%"
          height="100%"
          style={{ borderRadius: '0.375rem' }}
          onEnded={handleVideoEnd}
        />
      ) : (
        <div className="text-white text-center p-10 font-mono text-xl">
          Loading video...
        </div>
      )}
    </div>
  );
}
