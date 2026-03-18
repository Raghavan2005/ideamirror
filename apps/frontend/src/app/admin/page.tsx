'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Item = { id: string; title: string };
type OverlaySettings = { enabled: boolean; opacity: number };
type AppSettings = {
  clockFormat: '12h' | '24h';
  muted: boolean;
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
  const [quotes, setQuotes] = useState<Item[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAll = () => {
    const API = getApiUrl();
    Promise.all([
      fetch(`${API}/api/overlay`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/settings`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/events`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/qevents`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/playlist`).then(r => r.json()).catch(() => []),
    ]).then(([overlayData, settingsData, eventsData, quotesData, playlistData]) => {
      if (overlayData) setOverlay(overlayData);
      if (settingsData) setAppSettings(settingsData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
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
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <img src="/images/logo2.png" alt="Idea Mirror" className="h-9" />
        <Link
          href="/admin/rec"
          className="text-xs border border-gray-700 text-gray-400 hover:border-white hover:text-white px-4 py-2 rounded transition-colors"
        >
          Edit →
        </Link>
      </div>

      {/* Auto-refresh progress bar */}
      <div className="h-0.5 bg-gray-900 overflow-hidden">
        <div
          key={refreshKey}
          className="h-full bg-gray-600"
          style={{ animation: 'shrink 30s linear forwards' }}
        />
      </div>

      {/* Screen disabled banner */}
      {overlay && !overlay.enabled && (
        <div className="flex items-center gap-3 px-8 py-3 bg-gray-950 border-b border-gray-800">
          <span className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
          <span className="text-xs uppercase tracking-widest text-gray-500">Screen is disabled</span>
        </div>
      )}

      <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Mirror Status */}
        <section className="bg-gray-900 rounded-lg p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Display</h2>
          {overlay && appSettings ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${overlay.enabled ? 'bg-white text-black' : 'bg-gray-800 text-gray-500'}`}>
                  {overlay.enabled ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Opacity</span>
                <span className="text-sm text-white">{Math.round(overlay.opacity * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sound</span>
                <span className={`text-xs px-2.5 py-1 rounded-full ${appSettings.muted ? 'bg-gray-800 text-gray-500' : 'bg-white text-black font-semibold'}`}>
                  {appSettings.muted ? 'MUTED' : 'ON'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Clock</span>
                <span className="text-xs text-gray-500">{appSettings.clockFormat}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-700 text-sm">Loading...</div>
          )}
        </section>

        {/* Widgets */}
        <section className="bg-gray-900 rounded-lg p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Widgets</h2>
          {appSettings ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(appSettings.widgets).map(([key, enabled]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${enabled ? 'bg-white' : 'bg-gray-700'}`} />
                  <span className={`text-sm ${enabled ? 'text-gray-300' : 'text-gray-700'}`}>{widgetLabels[key]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-700 text-sm">Loading...</div>
          )}
        </section>

        {/* Video */}
        <section className="bg-gray-900 rounded-lg p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Video</h2>
          {video ? (
            <div className="text-gray-400 text-xs break-all">{video.url}</div>
          ) : (
            <div className="text-gray-700 text-sm">No video set</div>
          )}
        </section>

        {/* Events */}
        <section className="bg-gray-900 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-gray-600">Events</h2>
            <span className="text-xs text-gray-700">{events.length} / 10</span>
          </div>
          {events.length === 0 ? (
            <div className="text-gray-700 text-sm">No events</div>
          ) : (
            <ul className="space-y-1.5">
              {events.map((e, i) => (
                <li key={e.id} className={`text-sm truncate ${i === 0 ? 'text-white' : 'text-gray-600'}`}>{e.title}</li>
              ))}
            </ul>
          )}
        </section>

        {/* Quotes */}
        <section className="bg-gray-900 rounded-lg p-5 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-gray-600">Ticker Quotes</h2>
            <span className="text-xs text-gray-700">{quotes.length}</span>
          </div>
          {quotes.length === 0 ? (
            <div className="text-gray-700 text-sm">No quotes</div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {quotes.map(q => (
                <li key={q.id} className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded truncate max-w-xs">{q.title}</li>
              ))}
            </ul>
          )}
        </section>

      </div>

      <div className="text-center pb-8">
        <Link href="/admin/rec" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">
          Edit content & settings →
        </Link>
      </div>
    </div>
  );
}
