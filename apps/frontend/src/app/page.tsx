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
  widgets: { clock: boolean; weather: boolean; events: boolean; quotes: boolean; player: boolean };
};

const DEFAULT_SETTINGS: AppSettings = {
  clockFormat: '12h',
  muted: true,
  widgets: { clock: true, weather: true, events: true, quotes: true, player: true },
};

export default function Home() {
  const [overlay, setOverlay] = useState<OverlaySettings>({ enabled: true, opacity: 1 });
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    const loadData = () => {
      Promise.all([
        fetch('http://localhost:4000/api/overlay').then(r => r.json()).catch(() => null),
        fetch('http://localhost:4000/api/settings').then(r => r.json()).catch(() => null),
      ]).then(([overlayData, settingsData]) => {
        if (overlayData) setOverlay(overlayData);
        if (settingsData) setAppSettings(settingsData);
        setInitialLoaded(true);
      });
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!initialLoaded) return null;
  if (!overlay.enabled) return null;

  const { widgets, clockFormat, muted } = appSettings;

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
        <div className="absolute bottom-8 left-8 w-72 h-44 rounded-lg overflow-hidden">
          <Player muted={muted} />
        </div>
      )}

      {widgets.quotes && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/3">
          <QuoteLine />
        </div>
      )}

      {widgets.events && (
        <div className="absolute bottom-8 right-8 w-72">
          <EventList />
        </div>
      )}

    </div>
  );
}
