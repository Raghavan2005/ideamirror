'use client';

import EventList from "./compounds/EventList";
import HolidayClock from "./compounds/HolidayClock";
import QuoteLine from "./compounds/QuoteLine";
import WeatherWidget from "./compounds/WeatherWidget";
import Player from "./compounds/Player";
import { useEffect, useState } from 'react';

type OverlaySettings = {
  enabled: boolean;
  opacity: number;
};

export default function Home() {
  const [settings, setSettings] = useState<OverlaySettings>({ enabled: true, opacity: 1 });

  useEffect(() => {
    const fetchOverlay = () => {
      fetch('http://localhost:4000/api/overlay')
        .then(res => res.json())
        .then(data => setSettings(data))
        .catch(err => console.error('Failed to load overlay settings:', err));
    };

    fetchOverlay();
    const interval = setInterval(fetchOverlay, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!settings.enabled) return null;

  return (
    <div className="fixed inset-0 bg-black" style={{ opacity: settings.opacity }}>

      {/* Top Left — Clock & Holidays */}
      <div className="absolute top-0 left-0 p-8">
        <HolidayClock />
      </div>

      {/* Top Right — Weather */}
      <div className="absolute top-0 right-0 p-8">
        <WeatherWidget />
      </div>

      {/* Bottom Left — Video Player */}
      <div className="absolute bottom-8 left-8 w-72 h-44 rounded-lg overflow-hidden">
        <Player />
      </div>

      {/* Bottom Center — Quote Ticker */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/3">
        <QuoteLine />
      </div>

      {/* Bottom Right — Events */}
      <div className="absolute bottom-8 right-8 w-72">
        <EventList />
      </div>

    </div>
  );
}
