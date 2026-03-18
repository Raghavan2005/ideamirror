'use client';

import EventList from "./compounds/EventList";
import HolidayClock from "./compounds/HolidayClock";
import QuoteLine from "./compounds/QuoteLine";
import WeatherWidget from "./compounds/WeatherWidget";
import Player from "./compounds/Player";
import { useEffect, useState } from 'react';

type OverlaySettings = { enabled: boolean; opacity: number };
type AppSettings = {
  clockFormat: '12h' | '24h';
  muted: boolean;
  volume: number;
  videoFullscreen: boolean;
  eventCount: number;
  widgets: { clock: boolean; weather: boolean; events: boolean; quotes: boolean; player: boolean };
};

const DEFAULT_SETTINGS: AppSettings = {
  clockFormat: '12h',
  muted: true,
  volume: 80,
  videoFullscreen: false,
  eventCount: 5,
  widgets: { clock: true, weather: true, events: true, quotes: true, player: true },
};

export default function Home() {
  const [overlay, setOverlay] = useState<OverlaySettings>({ enabled: true, opacity: 1 });
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    // SSE for instant updates from admin
    const es = new EventSource('http://localhost:4000/api/stream');
    es.onmessage = (e) => {
      const { overlay: o, settings: s } = JSON.parse(e.data);
      if (o) setOverlay(o);
      if (s) setAppSettings(s);
      setInitialLoaded(true);
    };

    // Polling as fallback (e.g. if SSE reconnects after backend restart)
    const poll = () => {
      Promise.all([
        fetch('http://localhost:4000/api/overlay').then(r => r.json()).catch(() => null),
        fetch('http://localhost:4000/api/settings').then(r => r.json()).catch(() => null),
      ]).then(([o, s]) => {
        if (o) setOverlay(o);
        if (s) setAppSettings(s);
        setInitialLoaded(true);
      });
    };
    poll();
    const interval = setInterval(poll, 30000);

    return () => { es.close(); clearInterval(interval); };
  }, []);

  if (!initialLoaded) return null;

  if (!overlay.enabled) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <img src="/images/logo2.png" alt="Idea Mirror" className="max-w-xs w-1/3 opacity-60" />
    </div>
  );

  const { widgets, clockFormat, muted, volume, videoFullscreen, eventCount } = appSettings;

  return (
    <div className="fixed inset-0 bg-black" style={{ opacity: overlay.opacity }}>

      {widgets.clock && (
        <div className="absolute top-0 left-0 p-8">
          <HolidayClock clockFormat={clockFormat} />
        </div>
      )}

      {widgets.weather && (
        <div className="absolute top-0 right-0 p-8">
          <WeatherWidget />
        </div>
      )}

      {widgets.player && (
        <div className={videoFullscreen ? 'fixed inset-0 z-50' : 'absolute bottom-8 left-8 w-72 h-44 rounded-2xl overflow-hidden'}>
          <Player muted={muted} volume={volume} />
        </div>
      )}

      {widgets.quotes && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/3">
          <QuoteLine />
        </div>
      )}

      {widgets.events && (
        <div className="absolute bottom-8 right-8 w-72">
          <EventList eventCount={eventCount} />
        </div>
      )}

    </div>
  );
}
