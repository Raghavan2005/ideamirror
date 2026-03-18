'use client';

import EventList from "./compounds/EventList";
import HolidayClock from "./compounds/HolidayClock";
import QuoteLine from "./compounds/QuoteLine";
import WeatherWidget from "./compounds/WeatherWidget";
import Player from "./compounds/Player";
import { useEffect, useRef, useState, type CSSProperties } from 'react';

type OverlaySettings = { enabled: boolean; opacity: number };
type SleepMode = { enabled: boolean; sleepAt: string; wakeAt: string };
type AppSettings = {
  clockFormat: '12h' | '24h';
  muted: boolean;
  volume: number;
  videoFullscreen: boolean;
  eventCount: number;
  sleepMode: SleepMode;
  widgets: { clock: boolean; weather: boolean; events: boolean; quotes: boolean; player: boolean };
};

const DEFAULT_SETTINGS: AppSettings = {
  clockFormat: '12h',
  muted: true,
  volume: 80,
  videoFullscreen: false,
  eventCount: 5,
  sleepMode: { enabled: true, sleepAt: '21:00', wakeAt: '08:00' },
  widgets: { clock: true, weather: true, events: true, quotes: true, player: true },
};

function checkSleep(mode: SleepMode): boolean {
  if (!mode.enabled) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, smin] = mode.sleepAt.split(':').map(Number);
  const [wh, wmin] = mode.wakeAt.split(':').map(Number);
  const sleepMins = sh * 60 + smin;
  const wakeMins = wh * 60 + wmin;
  // Crosses midnight (e.g. sleep 21:00, wake 08:00)
  return sleepMins > wakeMins
    ? (cur >= sleepMins || cur < wakeMins)
    : (cur >= sleepMins && cur < wakeMins);
}

export default function Home() {
  const [overlay, setOverlay] = useState<OverlaySettings>({ enabled: true, opacity: 1 });
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [sleeping, setSleeping] = useState(false);

  // Always-current ref so the minute-interval closure never goes stale
  const sleepModeRef = useRef(DEFAULT_SETTINGS.sleepMode);
  sleepModeRef.current = appSettings.sleepMode;
  const prevSleepingRef = useRef(false);

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

  // Sleep mode: check every minute, trigger screen-off/on on transitions
  useEffect(() => {
    const check = () => {
      const isAsleep = checkSleep(sleepModeRef.current);
      if (isAsleep !== prevSleepingRef.current) {
        prevSleepingRef.current = isAsleep;
        setSleeping(isAsleep);
        fetch(`http://localhost:4000/api/system/screen-${isAsleep ? 'off' : 'on'}`, { method: 'POST' }).catch(() => {});
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!initialLoaded) return null;

  const { widgets, clockFormat, muted, volume, videoFullscreen, eventCount } = appSettings;

  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const fadeDuration = '0.8s ease';
  const fsEase = `0.55s ${ease}`;

  // Player is rendered outside the mirror opacity group so fullscreen is always full brightness.
  // All size/position properties animate simultaneously for a smooth expand/collapse.
  const playerStyle: CSSProperties = {
    position: 'fixed',
    overflow: 'hidden',
    opacity: overlay.enabled && !sleeping ? 1 : 0,
    transition: `bottom ${fsEase}, left ${fsEase}, width ${fsEase}, height ${fsEase}, border-radius ${fsEase}, opacity ${fadeDuration}`,
    ...(videoFullscreen
      ? { top: 0, left: 0, width: '100%', height: '100%', borderRadius: 0, zIndex: 50 }
      : { bottom: '32px', left: '32px', width: '288px', height: '176px', borderRadius: '16px', zIndex: 10 }
    ),
  };

  return (
    <>
      {/* Logo — fades in when mirror turns off or sleeping */}
      <div
        className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4"
        style={{
          opacity: !overlay.enabled || sleeping ? 1 : 0,
          transition: `opacity ${fadeDuration}`,
          pointerEvents: !overlay.enabled || sleeping ? 'auto' : 'none',
        }}
      >
        <img src="/images/logo2.png" alt="Idea Mirror" className="max-w-xs w-1/3 opacity-60" />
        {sleeping && (
          <p className="text-zinc-700 text-xs font-mono tracking-widest uppercase">
            Wakes at {appSettings.sleepMode.wakeAt}
          </p>
        )}
      </div>

      {/* Mirror content — fades in when mirror is on and not sleeping */}
      <div
        className="fixed inset-0 bg-black"
        style={{
          opacity: overlay.enabled && !sleeping ? overlay.opacity : 0,
          transition: `opacity ${fadeDuration}`,
          pointerEvents: overlay.enabled && !sleeping ? 'auto' : 'none',
        }}
      >
        {widgets.clock && (
          <div className="absolute top-0 left-0 p-8" style={{ animation: `fadeInLeft 0.9s ${ease} both` }}>
            <HolidayClock clockFormat={clockFormat} />
          </div>
        )}

        {widgets.weather && (
          <div className="absolute top-0 right-0 p-8" style={{ animation: `fadeInRight 0.9s ${ease} 0.15s both` }}>
            <WeatherWidget />
          </div>
        )}

        {widgets.quotes && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/3" style={{ animation: `fadeInUp 0.9s ${ease} 0.45s both` }}>
            <QuoteLine />
          </div>
        )}

        {widgets.events && (
          <div className="absolute bottom-8 right-8 w-72" style={{ animation: `fadeInRight 0.9s ${ease} 0.3s both` }}>
            <EventList eventCount={eventCount} />
          </div>
        )}
      </div>

      {/* Player — lives outside the mirror opacity group so fullscreen is always full brightness.
          Expands/collapses from the bottom-left corner using CSS property transitions. */}
      {widgets.player && (
        <div style={playerStyle}>
          <Player muted={muted || sleeping} volume={volume} />
        </div>
      )}
    </>
  );
}
