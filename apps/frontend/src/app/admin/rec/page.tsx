'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const PIN = '123456';

type Item = { id: string; title: string };
type OverlaySettings = { enabled: boolean; opacity: number };
type Video = { id: number; url: string };

function getApiUrl() {
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `http://${window.location.hostname}:4000`;
}

// ── PIN Screen ────────────────────────────────────────────────────────────────
function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [entered, setEntered] = useState('');
  const [shake, setShake] = useState(false);

  const press = (digit: string) => {
    if (entered.length >= 6) return;
    const next = entered + digit;
    setEntered(next);
    if (next.length === 6) {
      if (next === PIN) {
        sessionStorage.setItem('adminUnlocked', '1');
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => { setEntered(''); setShake(false); }, 600);
      }
    }
  };

  const del = () => setEntered(prev => prev.slice(0, -1));

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 font-mono">
      <div className="text-xs uppercase tracking-widest text-gray-600">Enter PIN</div>

      {/* Dots */}
      <div className={`flex gap-4 transition-transform ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border transition-colors duration-150 ${
              i < entered.length ? 'bg-white border-white' : 'bg-transparent border-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-56">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button
            key={d}
            onClick={() => press(d)}
            className="h-14 rounded-lg border border-gray-800 text-white text-xl hover:bg-gray-900 active:bg-gray-800 transition-colors"
          >
            {d}
          </button>
        ))}
        <button
          onClick={del}
          className="h-14 rounded-lg border border-gray-800 text-gray-500 text-sm hover:bg-gray-900 active:bg-gray-800 transition-colors"
        >
          ←
        </button>
        <button
          onClick={() => press('0')}
          className="h-14 rounded-lg border border-gray-800 text-white text-xl hover:bg-gray-900 active:bg-gray-800 transition-colors"
        >
          0
        </button>
        <div />
      </div>

      <Link href="/admin" className="text-xs text-gray-700 hover:text-gray-500 transition-colors mt-2">
        ← Back
      </Link>
    </div>
  );
}

// ── Edit Screen ───────────────────────────────────────────────────────────────
function EditScreen() {
  const [overlay, setOverlay] = useState<OverlaySettings>({ enabled: true, opacity: 1 });
  const [events, setEvents] = useState<Item[]>([]);
  const [quotes, setQuotes] = useState<Item[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [newEvent, setNewEvent] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [feedback, setFeedback] = useState('');

  const API = getApiUrl();

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2000);
  };

  const fetchAll = async () => {
    const [overlayData, eventsData, quotesData, playlistData] = await Promise.all([
      fetch(`${API}/api/overlay`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/events`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/qevents`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/playlist`).then(r => r.json()).catch(() => []),
    ]);
    if (overlayData) setOverlay(overlayData);
    setEvents(Array.isArray(eventsData) ? eventsData : []);
    setQuotes(Array.isArray(quotesData) ? quotesData : []);
    if (Array.isArray(playlistData) && playlistData[0]) setVideo(playlistData[0]);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleOverlay = async () => {
    const updated = { ...overlay, enabled: !overlay.enabled };
    await fetch(`${API}/api/overlay`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    setOverlay(updated);
  };

  const updateOpacity = async (opacity: number) => {
    const updated = { ...overlay, opacity };
    await fetch(`${API}/api/overlay`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    setOverlay(updated);
  };

  const addEvent = async () => {
    if (!newEvent.trim()) return;
    await fetch(`${API}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newEvent.trim() }) });
    setNewEvent(''); fetchAll(); flash('Event added');
  };

  const deleteEvent = async (id: string) => {
    await fetch(`${API}/api/events/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const addQuote = async () => {
    if (!newQuote.trim()) return;
    await fetch(`${API}/api/qevents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newQuote.trim() }) });
    setNewQuote(''); fetchAll(); flash('Quote added');
  };

  const deleteQuote = async (id: string) => {
    await fetch(`${API}/api/qevents/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const updateVideo = async () => {
    if (!newVideoUrl.trim()) return;
    await fetch(`${API}/api/playlist/1`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: newVideoUrl.trim() }) });
    setNewVideoUrl(''); fetchAll(); flash('Video updated');
  };

  const systemAction = async (action: string) => {
    await fetch(`${API}/api/system/${action}`, { method: 'POST' });
    flash(`${action} triggered`);
  };

  const lock = () => {
    sessionStorage.removeItem('adminUnlocked');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {feedback && (
        <div className="fixed top-4 right-4 bg-white text-black text-xs px-4 py-2 rounded font-mono z-50">
          {feedback}
        </div>
      )}

      <div className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <Link href="/admin" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">← Dashboard</Link>
        <h1 className="text-xl font-bold tracking-widest">EDIT</h1>
        <button onClick={lock} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Lock</button>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

        {/* Display */}
        <section className="space-y-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Display</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Mirror Active</span>
            <button
              onClick={toggleOverlay}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${overlay.enabled ? 'bg-white' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${overlay.enabled ? 'translate-x-[22px] bg-black' : 'translate-x-0.5 bg-gray-500'}`} />
            </button>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Opacity</span>
              <span>{Math.round(overlay.opacity * 100)}%</span>
            </div>
            <input
              type="range" min="0.1" max="1" step="0.05"
              value={overlay.opacity}
              onChange={e => updateOpacity(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </section>

        {/* System */}
        <section className="space-y-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">System</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Screen On', action: 'screen-on' },
              { label: 'Screen Off', action: 'screen-off' },
              { label: 'Restart', action: 'restart' },
              { label: 'Shutdown', action: 'shutdown' },
            ].map(({ label, action }) => (
              <button
                key={action}
                onClick={() => systemAction(action)}
                className="border border-gray-800 text-gray-500 hover:border-gray-500 hover:text-white px-4 py-2.5 rounded text-sm transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Events */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Events</h2>
          <div className="flex gap-2">
            <input
              type="text" value={newEvent} onChange={e => setNewEvent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEvent()} placeholder="Add event..."
              className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-700 px-3 py-2 rounded text-sm focus:outline-none focus:border-gray-600"
            />
            <button onClick={addEvent} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">Add</button>
          </div>
          <ul className="space-y-1.5">
            {events.length === 0 && <li className="text-gray-700 text-xs">No events</li>}
            {events.map(event => (
              <li key={event.id} className="flex items-center justify-between bg-gray-900 px-3 py-2 rounded">
                <span className="text-gray-300 text-sm truncate">{event.title}</span>
                <button onClick={() => deleteEvent(event.id)} className="text-gray-700 hover:text-red-500 transition-colors ml-3 flex-shrink-0 text-xs">✕</button>
              </li>
            ))}
          </ul>
        </section>

        {/* Quotes */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Ticker Quotes</h2>
          <div className="flex gap-2">
            <input
              type="text" value={newQuote} onChange={e => setNewQuote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQuote()} placeholder="Add quote..."
              className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-700 px-3 py-2 rounded text-sm focus:outline-none focus:border-gray-600"
            />
            <button onClick={addQuote} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">Add</button>
          </div>
          <ul className="space-y-1.5">
            {quotes.length === 0 && <li className="text-gray-700 text-xs">No quotes</li>}
            {quotes.map(quote => (
              <li key={quote.id} className="flex items-center justify-between bg-gray-900 px-3 py-2 rounded">
                <span className="text-gray-300 text-sm truncate">{quote.title}</span>
                <button onClick={() => deleteQuote(quote.id)} className="text-gray-700 hover:text-red-500 transition-colors ml-3 flex-shrink-0 text-xs">✕</button>
              </li>
            ))}
          </ul>
        </section>

        {/* Video */}
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Video</h2>
          {video && <div className="text-gray-700 text-xs truncate">Current: {video.url}</div>}
          <div className="flex gap-2">
            <input
              type="text" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && updateVideo()} placeholder="YouTube URL..."
              className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-700 px-3 py-2 rounded text-sm focus:outline-none focus:border-gray-600"
            />
            <button onClick={updateVideo} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">Update</button>
          </div>
        </section>

      </div>
    </div>
  );
}

// ── Route ─────────────────────────────────────────────────────────────────────
export default function RecPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem('adminUnlocked') === '1');
  }, []);

  if (unlocked === null) return null; // avoid flash on hydration
  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;
  return <EditScreen />;
}
