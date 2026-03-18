'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Item = { id: string; title: string };
type PublicEvent = { id: string; title: string; date: string };
type OverlaySettings = { enabled: boolean; opacity: number };
type AppSettings = {
  clockFormat: '12h' | '24h';
  muted: boolean;
  sleepMode: { enabled: boolean; sleepAt: string; wakeAt: string };
  widgets: { clock: boolean; weather: boolean; events: boolean; quotes: boolean; player: boolean };
};
type Video = { id: number; url: string };

function getApiUrl() {
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `http://${window.location.hostname}:4000`;
}

export default function AdminDashboard() {
  const [overlay, setOverlay] = useState<OverlaySettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [events, setEvents] = useState<Item[]>([]);
  const [publicEvents, setPublicEvents] = useState<PublicEvent[]>([]);
  const [quotes, setQuotes] = useState<Item[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAll = () => {
    const API = getApiUrl();
    Promise.all([
      fetch(`${API}/api/overlay`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/settings`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/events`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/events/public`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/qevents`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/playlist`).then(r => r.json()).catch(() => []),
    ]).then(([overlayData, settingsData, eventsData, pubEventsData, quotesData, playlistData]) => {
      if (overlayData) setOverlay(overlayData);
      if (settingsData) setAppSettings(settingsData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setPublicEvents(Array.isArray(pubEventsData) ? pubEventsData : []);
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      if (Array.isArray(playlistData) && playlistData[0]) setVideo(playlistData[0]);
      setRefreshKey(k => k + 1);
    });
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const widgetLabels: Record<string, string> = {
    clock: 'Clock', weather: 'Weather', events: 'Events', quotes: 'Quotes', player: 'Player',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono">

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <img src="/images/logo2.png" alt="Idea Mirror" className="h-8" />
        <Link
          href="/admin/rec"
          className="text-xs border border-zinc-700 text-zinc-400 hover:border-white hover:text-white px-4 py-2 rounded-lg transition-colors"
        >
          Edit →
        </Link>
      </div>

      {/* Auto-refresh progress bar */}
      <div className="h-px bg-zinc-900 overflow-hidden">
        <div key={refreshKey} className="h-full bg-zinc-600" style={{ animation: 'shrink 30s linear forwards' }} />
      </div>

      {/* Screen disabled banner */}
      {overlay && !overlay.enabled && (
        <div className="flex items-center gap-3 px-6 py-2.5 bg-amber-950/20 border-b border-amber-900/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span className="text-xs uppercase tracking-widest text-amber-500/80">Screen is disabled</span>
        </div>
      )}

      <div className="p-5 max-w-xl mx-auto space-y-3">

        {/* Mirror status card */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          {overlay && appSettings ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${overlay.enabled ? 'bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.4)]' : 'bg-zinc-600'}`} />
                  <span className={`text-base font-semibold tracking-wide ${overlay.enabled ? 'text-white' : 'text-zinc-500'}`}>
                    {overlay.enabled ? 'Mirror Active' : 'Mirror Off'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${appSettings.muted ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-700 text-white'}`}>
                    {appSettings.muted ? '🔇 Muted' : '🔊 Sound'}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400">{appSettings.clockFormat}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Opacity</span>
                  <span className="text-zinc-400">{Math.round(overlay.opacity * 100)}%</span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${overlay.opacity * 100}%` }} />
                </div>
              </div>
              {appSettings.sleepMode?.enabled && (
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                  <span className="text-xs text-zinc-600">Sleep schedule</span>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {appSettings.sleepMode.sleepAt} → {appSettings.sleepMode.wakeAt}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3 animate-pulse">
              <div className="h-5 w-32 bg-zinc-800 rounded-lg" />
              <div className="h-1 bg-zinc-800 rounded-full" />
            </div>
          )}
        </section>

        {/* Widgets */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-zinc-600">Widgets</h2>
          {appSettings ? (
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(appSettings.widgets).map(([key, enabled]) => (
                <div key={key} className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition-colors ${enabled ? 'bg-zinc-800 border-zinc-700' : 'border-zinc-800'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-white' : 'bg-zinc-700'}`} />
                  <span className={`text-xs capitalize ${enabled ? 'text-zinc-300' : 'text-zinc-700'}`}>{key}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 animate-pulse">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-zinc-800/50" />)}
            </div>
          )}
        </section>

        {/* Events + Video */}
        <div className="grid grid-cols-2 gap-3">
          <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-widest text-zinc-600">Events</h2>
              <span className="text-xs text-zinc-700 tabular-nums">{events.length}/10</span>
            </div>
            {events.length === 0 && publicEvents.length === 0 ? (
              <div className="text-zinc-700 text-xs">No events</div>
            ) : (
              <ul className="space-y-2">
                {events.map((e, i) => (
                  <li key={e.id} className="flex items-baseline gap-2">
                    <span className="text-xs text-zinc-700 tabular-nums w-4 flex-shrink-0">{i + 1}</span>
                    <span className={`text-xs truncate ${i === 0 ? 'text-white' : 'text-zinc-600'}`}>{e.title}</span>
                  </li>
                ))}
                {publicEvents.map(e => (
                  <li key={e.id} className="flex items-baseline justify-between gap-2">
                    <span className="text-xs truncate text-amber-500/60">{e.title}</span>
                    <span className="text-xs text-zinc-700 flex-shrink-0">{e.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-zinc-600">Video</h2>
            {video ? (
              <p className="text-xs text-zinc-500 break-all leading-relaxed">{video.url}</p>
            ) : (
              <div className="text-zinc-700 text-xs">No video set</div>
            )}
          </section>
        </div>

        {/* Quotes */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-zinc-600">Ticker Quotes</h2>
            <span className="text-xs text-zinc-700 tabular-nums">{quotes.length}</span>
          </div>
          {quotes.length === 0 ? (
            <div className="text-zinc-700 text-xs">No quotes</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {quotes.map(q => (
                <span key={q.id} className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2.5 py-1 rounded-lg truncate max-w-xs">{q.title}</span>
              ))}
            </div>
          )}
        </section>

        <div className="text-center py-4">
          <Link href="/admin/rec" className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Edit content & settings →
          </Link>
        </div>

      </div>
    </div>
  );
}
