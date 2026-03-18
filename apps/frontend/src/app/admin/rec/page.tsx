'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Item = { id: string; title: string };
type OverlaySettings = { enabled: boolean; opacity: number };
type AppSettings = {
  pin: string;
  clockFormat: '12h' | '24h';
  muted: boolean;
  widgets: { clock: boolean; weather: boolean; events: boolean; quotes: boolean; player: boolean };
};
type Video = { id: number; url: string };

function getApiUrl() {
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `http://${window.location.hostname}:4000`;
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 font-mono">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-xs w-full mx-4">
        <div className="text-white text-sm mb-5">{message}</div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-700 text-gray-400 py-2 rounded text-sm hover:border-gray-500 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 bg-white text-black py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PIN Screen ─────────────────────────────────────────────────────────────────
function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [entered, setEntered] = useState('');
  const [shake, setShake] = useState(false);
  const [pin, setPin] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/settings`)
      .then(r => r.json())
      .then(s => setPin(s.pin || '123456'))
      .catch(() => setPin('123456'));
  }, []);

  const press = (digit: string) => {
    if (entered.length >= 6) return;
    const next = entered + digit;
    setEntered(next);
    if (next.length === 6) {
      if (next === pin) {
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

      <div className={`flex gap-4 ${shake ? '[animation:shake_0.4s_ease]' : ''}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full border transition-colors duration-150 ${i < entered.length ? 'bg-white border-white' : 'bg-transparent border-gray-700'}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-56">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} onClick={() => press(d)} className="h-14 rounded-lg border border-gray-800 text-white text-xl hover:bg-gray-900 active:bg-gray-800 transition-colors">
            {d}
          </button>
        ))}
        <button onClick={del} className="h-14 rounded-lg border border-gray-800 text-gray-500 text-sm hover:bg-gray-900 active:bg-gray-800 transition-colors">←</button>
        <button onClick={() => press('0')} className="h-14 rounded-lg border border-gray-800 text-white text-xl hover:bg-gray-900 active:bg-gray-800 transition-colors">0</button>
        <div />
      </div>

      <Link href="/admin" className="text-xs text-gray-700 hover:text-gray-500 transition-colors mt-2">← Back</Link>
    </div>
  );
}

// ── Edit Screen ────────────────────────────────────────────────────────────────
function EditScreen() {
  const [overlay, setOverlay] = useState<OverlaySettings>({ enabled: true, opacity: 1 });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    pin: '123456', clockFormat: '12h', muted: true,
    widgets: { clock: true, weather: true, events: true, quotes: true, player: true },
  });
  const [events, setEvents] = useState<Item[]>([]);
  const [quotes, setQuotes] = useState<Item[]>([]);
  const [video, setVideo] = useState<Video | null>(null);

  const [newEvent, setNewEvent] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const [editingEvent, setEditingEvent] = useState<Item | null>(null);
  const [editingQuote, setEditingQuote] = useState<Item | null>(null);

  const [confirm, setConfirm] = useState<{ action: string; message: string } | null>(null);
  const [feedback, setFeedback] = useState('');

  // Change PIN state
  const [pinSection, setPinSection] = useState(false);
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' });
  const [pinError, setPinError] = useState('');

  const API = getApiUrl();

  const flash = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 2000); };

  const fetchAll = async () => {
    const [overlayData, settingsData, eventsData, quotesData, playlistData] = await Promise.all([
      fetch(`${API}/api/overlay`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/settings`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/events`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/qevents`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/playlist`).then(r => r.json()).catch(() => []),
    ]);
    if (overlayData) setOverlay(overlayData);
    if (settingsData) setAppSettings(settingsData);
    setEvents(Array.isArray(eventsData) ? eventsData : []);
    setQuotes(Array.isArray(quotesData) ? quotesData : []);
    if (Array.isArray(playlistData) && playlistData[0]) setVideo(playlistData[0]);
  };

  useEffect(() => { fetchAll(); }, []);

  // Overlay
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

  // Settings save helper
  const saveSetting = async (patch: Partial<AppSettings>) => {
    const updated = { ...appSettings, ...patch };
    await fetch(`${API}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    setAppSettings(updated);
  };

  const toggleWidget = (key: keyof AppSettings['widgets']) => {
    const updated = { ...appSettings.widgets, [key]: !appSettings.widgets[key] };
    saveSetting({ widgets: updated });
  };

  // Mute toggle
  const toggleMute = async () => {
    await saveSetting({ muted: !appSettings.muted });
    flash(appSettings.muted ? 'Sound ON' : 'Muted');
  };

  // Events
  const addEvent = async () => {
    if (!newEvent.trim()) return;
    await fetch(`${API}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newEvent.trim() }) });
    setNewEvent(''); fetchAll(); flash('Event added');
  };
  const saveEditEvent = async () => {
    if (!editingEvent) return;
    await fetch(`${API}/api/events/${editingEvent.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editingEvent.title }) });
    setEditingEvent(null); fetchAll(); flash('Event updated');
  };
  const deleteEvent = async (id: string) => { await fetch(`${API}/api/events/${id}`, { method: 'DELETE' }); fetchAll(); };

  // Quotes
  const addQuote = async () => {
    if (!newQuote.trim()) return;
    await fetch(`${API}/api/qevents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newQuote.trim() }) });
    setNewQuote(''); fetchAll(); flash('Quote added');
  };
  const saveEditQuote = async () => {
    if (!editingQuote) return;
    await fetch(`${API}/api/qevents/${editingQuote.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editingQuote.title }) });
    setEditingQuote(null); fetchAll(); flash('Quote updated');
  };
  const deleteQuote = async (id: string) => { await fetch(`${API}/api/qevents/${id}`, { method: 'DELETE' }); fetchAll(); };

  // Video
  const updateVideo = async () => {
    if (!newVideoUrl.trim()) return;
    await fetch(`${API}/api/playlist/1`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: newVideoUrl.trim() }) });
    setNewVideoUrl(''); fetchAll(); flash('Video updated');
  };

  // System
  const systemAction = async (action: string) => {
    await fetch(`${API}/api/system/${action}`, { method: 'POST' });
    flash(`${action} triggered`);
  };

  // Change PIN
  const changePIN = async () => {
    if (pinForm.current !== appSettings.pin) { setPinError('Current PIN incorrect'); return; }
    if (!/^\d{6}$/.test(pinForm.next)) { setPinError('New PIN must be 6 digits'); return; }
    if (pinForm.next !== pinForm.confirm) { setPinError('PINs do not match'); return; }
    await saveSetting({ pin: pinForm.next });
    setPinForm({ current: '', next: '', confirm: '' });
    setPinError('');
    setPinSection(false);
    flash('PIN changed');
  };

  const lock = () => { sessionStorage.removeItem('adminUnlocked'); window.location.reload(); };

  const widgetLabels: { key: keyof AppSettings['widgets']; label: string }[] = [
    { key: 'clock', label: 'Clock' },
    { key: 'weather', label: 'Weather' },
    { key: 'events', label: 'Events' },
    { key: 'quotes', label: 'Quotes' },
    { key: 'player', label: 'Player' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {confirm && (
        <ConfirmDialog
          message={`Are you sure you want to ${confirm.message}?`}
          onConfirm={() => { systemAction(confirm.action); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {feedback && (
        <div className="fixed top-4 right-4 bg-white text-black text-xs px-4 py-2 rounded font-mono z-50">{feedback}</div>
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
            <button onClick={toggleOverlay} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${overlay.enabled ? 'bg-white' : 'bg-gray-700'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${overlay.enabled ? 'translate-x-[22px] bg-black' : 'translate-x-0.5 bg-gray-500'}`} />
            </button>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Opacity</span><span>{Math.round(overlay.opacity * 100)}%</span>
            </div>
            <input type="range" min="0.1" max="1" step="0.05" value={overlay.opacity}
              onChange={e => updateOpacity(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer" />
          </div>
        </section>

        {/* Mute / Unmute */}
        <section className="space-y-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Sound</h2>
          <button
            onClick={toggleMute}
            className={`w-full py-4 rounded-lg text-lg font-bold tracking-widest transition-colors ${appSettings.muted ? 'bg-gray-900 border border-gray-700 text-gray-500 hover:border-gray-500' : 'bg-white text-black hover:bg-gray-200'}`}
          >
            {appSettings.muted ? '🔇  MUTED' : '🔊  SOUND ON'}
          </button>
        </section>

        {/* System */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">System</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => systemAction('screen-on')} className="border border-gray-800 text-gray-500 hover:border-gray-500 hover:text-white px-4 py-2.5 rounded text-sm transition-colors">Screen On</button>
            <button onClick={() => systemAction('screen-off')} className="border border-gray-800 text-gray-500 hover:border-gray-500 hover:text-white px-4 py-2.5 rounded text-sm transition-colors">Screen Off</button>
            <button onClick={() => setConfirm({ action: 'restart', message: 'restart the Pi' })} className="border border-gray-800 text-gray-500 hover:border-yellow-600 hover:text-yellow-400 px-4 py-2.5 rounded text-sm transition-colors">Restart</button>
            <button onClick={() => setConfirm({ action: 'shutdown', message: 'shut down the Pi' })} className="border border-gray-800 text-gray-500 hover:border-red-600 hover:text-red-400 px-4 py-2.5 rounded text-sm transition-colors">Shutdown</button>
          </div>
        </section>

        {/* Widgets */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Widgets</h2>
          <div className="space-y-2">
            {widgetLabels.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{label}</span>
                <button onClick={() => toggleWidget(key)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${appSettings.widgets[key] ? 'bg-white' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${appSettings.widgets[key] ? 'translate-x-[22px] bg-black' : 'translate-x-0.5 bg-gray-500'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Clock Format */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Clock Format</h2>
          <div className="flex gap-2">
            {(['12h', '24h'] as const).map(fmt => (
              <button key={fmt} onClick={() => saveSetting({ clockFormat: fmt })}
                className={`flex-1 py-2.5 rounded text-sm font-bold transition-colors ${appSettings.clockFormat === fmt ? 'bg-white text-black' : 'border border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                {fmt}
              </button>
            ))}
          </div>
        </section>

        {/* Events */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Events</h2>
          <div className="flex gap-2">
            <input type="text" value={newEvent} onChange={e => setNewEvent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEvent()} placeholder="Add event..."
              className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-700 px-3 py-2 rounded text-sm focus:outline-none focus:border-gray-600" />
            <button onClick={addEvent} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">Add</button>
          </div>
          <ul className="space-y-1.5">
            {events.length === 0 && <li className="text-gray-700 text-xs">No events</li>}
            {events.map(event => (
              <li key={event.id} className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded">
                {editingEvent?.id === event.id ? (
                  <>
                    <input autoFocus value={editingEvent.title}
                      onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditEvent(); if (e.key === 'Escape') setEditingEvent(null); }}
                      className="flex-1 bg-transparent border-b border-gray-600 text-white text-sm focus:outline-none" />
                    <button onClick={saveEditEvent} className="text-green-500 text-xs hover:text-green-400">✓</button>
                    <button onClick={() => setEditingEvent(null)} className="text-gray-600 text-xs hover:text-gray-400">✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-300 text-sm truncate cursor-pointer hover:text-white" onClick={() => setEditingEvent(event)}>{event.title}</span>
                    <button onClick={() => setEditingEvent(event)} className="text-gray-700 hover:text-gray-400 text-xs transition-colors">✎</button>
                    <button onClick={() => deleteEvent(event.id)} className="text-gray-700 hover:text-red-500 text-xs transition-colors">✕</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Quotes */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Ticker Quotes</h2>
          <div className="flex gap-2">
            <input type="text" value={newQuote} onChange={e => setNewQuote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQuote()} placeholder="Add quote..."
              className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-700 px-3 py-2 rounded text-sm focus:outline-none focus:border-gray-600" />
            <button onClick={addQuote} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">Add</button>
          </div>
          <ul className="space-y-1.5">
            {quotes.length === 0 && <li className="text-gray-700 text-xs">No quotes</li>}
            {quotes.map(quote => (
              <li key={quote.id} className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded">
                {editingQuote?.id === quote.id ? (
                  <>
                    <input autoFocus value={editingQuote.title}
                      onChange={e => setEditingQuote({ ...editingQuote, title: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditQuote(); if (e.key === 'Escape') setEditingQuote(null); }}
                      className="flex-1 bg-transparent border-b border-gray-600 text-white text-sm focus:outline-none" />
                    <button onClick={saveEditQuote} className="text-green-500 text-xs hover:text-green-400">✓</button>
                    <button onClick={() => setEditingQuote(null)} className="text-gray-600 text-xs hover:text-gray-400">✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-300 text-sm truncate cursor-pointer hover:text-white" onClick={() => setEditingQuote(quote)}>{quote.title}</span>
                    <button onClick={() => setEditingQuote(quote)} className="text-gray-700 hover:text-gray-400 text-xs transition-colors">✎</button>
                    <button onClick={() => deleteQuote(quote.id)} className="text-gray-700 hover:text-red-500 text-xs transition-colors">✕</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Video */}
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-600">Video</h2>
          {video && <div className="text-gray-700 text-xs truncate">Current: {video.url}</div>}
          <div className="flex gap-2">
            <input type="text" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && updateVideo()} placeholder="YouTube URL..."
              className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-700 px-3 py-2 rounded text-sm focus:outline-none focus:border-gray-600" />
            <button onClick={updateVideo} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">Update</button>
          </div>
        </section>

        {/* Change PIN */}
        <section className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-gray-600">Change PIN</h2>
            <button onClick={() => { setPinSection(!pinSection); setPinError(''); setPinForm({ current: '', next: '', confirm: '' }); }}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              {pinSection ? 'Cancel' : 'Change →'}
            </button>
          </div>
          {pinSection && (
            <div className="space-y-3">
              {[
                { label: 'Current PIN', key: 'current' as const },
                { label: 'New PIN (6 digits)', key: 'next' as const },
                { label: 'Confirm new PIN', key: 'confirm' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <div className="text-xs text-gray-600 mb-1">{label}</div>
                  <input type="password" inputMode="numeric" maxLength={6} value={pinForm[key]}
                    onChange={e => setPinForm(prev => ({ ...prev, [key]: e.target.value.replace(/\D/g, '') }))}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-gray-600 tracking-widest" />
                </div>
              ))}
              {pinError && <div className="text-red-500 text-xs">{pinError}</div>}
              <button onClick={changePIN} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors">
                Save PIN
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// ── Route ──────────────────────────────────────────────────────────────────────
export default function RecPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem('adminUnlocked') === '1');
  }, []);

  if (unlocked === null) return null;
  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;
  return <EditScreen />;
}
