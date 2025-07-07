'use client';

import EventList from "./compounds/EventList";
import HolidayClock from "./compounds/HolidayClock"
import QuoteLine from "./compounds/QuoteLine";
import WeatherWidget from "./compounds/WeatherWidget";
import ReactPlayer from 'react-player'
import { useEffect, useState } from 'react';
import Player from "./compounds/Player";
type OverlaySettings = {
  enabled: boolean;
  opacity: number;
};
export default function Home() {
 const [settings, setSettings] = useState<OverlaySettings>({ enabled: true, opacity: 0.6 });

  useEffect(() => {
    const fetchOverlay = () => {
      fetch('http://localhost:4000/api/overlay')
        .then(res => res.json())
        .then(data => setSettings(data))
        .catch(err => console.error('Failed to load overlay settings:', err));
    };

    fetchOverlay();
    const interval = setInterval(fetchOverlay, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (!settings.enabled) return null;
  return (
    <div className="fixed inset-0 "   style={{ opacity: settings.opacity }}>
      {/* Top Left */}
      <div className="absolute p-5 top-0 left-0 text-white flex items-center justify-center">
        <HolidayClock/>
      </div>

      {/* Top Center */}
      <div className="absolute top-0 p-5 left-1/3 w-1/3 h-24text-white flex items-center justify-center">
   
      </div>

      {/* Top Right */}
      <div className="absolute top-0 p-5 right-0 text-white flex items-center justify-center">
        <WeatherWidget/>
      </div>

      {/* Bottom Left */}
     <div className="absolute bottom-30 left-5 w-1/5 h-54 rounded-md overflow-hidden flex items-center justify-center">
  <Player/>
</div>


      {/* Bottom Center */}
      <div className="absolute bottom-0 p-5 left-1/3 w-1/3 h-54  text-white flex items-center justify-center">
        <QuoteLine/>
      </div>

      {/* Bottom Right */}
     <div className="fixed inset-0">
  {/* Bottom right: Event List */}
  <div className="absolute bottom-30 right-0 p-5 text-white flex flex-col items-end pr-4">
    <EventList />
  </div>

  {/* Bottom center: White box */}
  <div className="absolute bottom-10 right-5  transform -translate-x-1/2">
    <div className="e text-white px-4 py-2 rounded">
      wifi
    </div>
  </div>
</div>

   
    </div>
  );
}
