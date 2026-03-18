'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Item = { id: string; title: string };
type OverlaySettings = { enabled: boolean; opacity: number };
type AppSettings = {
  pin: string;
  clockFormat: '12h' | '24h';
  muted: boolean;
  volume: number;
  videoFullscreen: boolean;
  widgets: { clock: boolean; weather: boolean; events: boolean; quotes: boolean; player: boolean };
};
type Video = { id: number; url: string };

function getApiUrl() {
  if (typeof window === 'undefined') return 'http://localhost:4000';
  return `http://${window.location.hostname}:4000`;
}

// ── Toggle ──────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? 'bg-white' : 'bg-zinc-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${on ? 'translate-x-5 bg-black' : 'bg-zinc-500'}`} />
    </button>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 font-mono px-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-xs w-full shadow-2xl">
        <div className="text-white text-sm mb-6 leading-relaxed">{message}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 border border-zinc-700 text-zinc-400 py-2.5 rounded-xl text-sm hover:border-zinc-500 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-colors">
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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-10 font-mono">
      <img src="/images/logo2.png" alt="Idea Mirror" className="h-8 opacity-60" />

      <div className="space-y-6 flex flex-col items-center">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Enter PIN</p>
        <div className={`flex gap-3.5 ${shake ? '[animation:shake_0.4s_ease]' : ''}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${i < entered.length ? 'bg-white scale-110' : 'bg-zinc-800 border border-zinc-700'}`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 w-52">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} onClick={() => press(d)}
            className="h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-xl font-light hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all">
            {d}
          </button>
        ))}
        <button onClick={del}
          className="h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-sm hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all">
          ←
        </button>
        <button onClick={() => press('0')}
          className="h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-xl font-light hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all">
          0
        </button>
        <div />
      </div>

      <Link href="/admin" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">← Back</Link>
    </div>
  );
}

// ── Edit Screen ────────────────────────────────────────────────────────────────
function EditScreen() {
  const [overlay, setOverlay] = useState<OverlaySettings>({ enabled: true, opacity: 1 });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    pin: '123456', clockFormat: '12h', muted: true, volume: 80, videoFullscreen: false,
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
  const [quotesExpanded, setQuotesExpanded] = useState(false);

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

  const inputCls = "flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors";
  const addBtnCls = "bg-white text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-100 active:scale-95 transition-all";

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono">
      {confirm && (
        <ConfirmDialog
          message={`Are you sure you want to ${confirm.message}?`}
          onConfirm={() => { systemAction(confirm.action); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {feedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-5 py-2.5 rounded-full font-mono z-50 shadow-lg">
          {feedback}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/admin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Back</Link>
        <img src="/images/logo2.png" alt="Idea Mirror" className="h-7" />
        <button onClick={lock} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Lock</button>
      </div>

      <div className="p-5 max-w-xl mx-auto space-y-3">

        {/* Mirror + Sound */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-zinc-600">Display</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Mirror Active</span>
            <Toggle on={overlay.enabled} onChange={toggleOverlay} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-600">
              <span>Opacity</span><span className="text-zinc-400">{Math.round(overlay.opacity * 100)}%</span>
            </div>
            <input type="range" min="0.1" max="1" step="0.05" value={overlay.opacity}
              onChange={e => updateOpacity(parseFloat(e.target.value))}
              className="w-full accent-white cursor-pointer h-1 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className="text-sm text-zinc-300">Sound</span>
            <Toggle on={!appSettings.muted} onChange={toggleMute} />
          </div>
          <div className={`space-y-2 transition-opacity duration-200 ${appSettings.muted ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="flex justify-between text-xs text-zinc-600">
              <span>Volume</span>
              <span className="text-zinc-400">{appSettings.volume}%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={appSettings.volume}
              onChange={e => saveSetting({ volume: parseInt(e.target.value) })}
              className="w-full accent-white cursor-pointer h-1 rounded-full" />
          </div>
        </section>

        {/* Widgets */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-zinc-600">Widgets</h2>
          <div className="space-y-3">
            {widgetLabels.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className={`text-sm transition-colors ${appSettings.widgets[key] ? 'text-zinc-300' : 'text-zinc-600'}`}>{label}</span>
                <Toggle on={appSettings.widgets[key]} onChange={() => toggleWidget(key)} />
              </div>
            ))}
          </div>
        </section>

        {/* Clock format */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-zinc-600">Clock Format</h2>
          <div className="flex gap-2 bg-zinc-800 p-1 rounded-xl">
            {(['12h', '24h'] as const).map(fmt => (
              <button key={fmt} onClick={() => saveSetting({ clockFormat: fmt })}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${appSettings.clockFormat === fmt ? 'bg-white text-black shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {fmt}
              </button>
            ))}
          </div>
        </section>

        {/* Events */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-zinc-600">Events</h2>
            <span className="text-xs text-zinc-700 tabular-nums">{events.length}/10</span>
          </div>
          <div className="flex gap-2">
            <input type="text" value={newEvent} onChange={e => setNewEvent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEvent()} placeholder="Add event…"
              className={inputCls} />
            <button onClick={addEvent} className={addBtnCls}>Add</button>
          </div>
          {events.length === 0 && <p className="text-zinc-700 text-xs">No events yet</p>}
          <ul className="space-y-1.5">
            {events.map(event => (
              <li key={event.id} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700/50 px-3 py-2.5 rounded-xl">
                {editingEvent?.id === event.id ? (
                  <>
                    <input autoFocus value={editingEvent.title}
                      onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditEvent(); if (e.key === 'Escape') setEditingEvent(null); }}
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none border-b border-zinc-600" />
                    <button onClick={saveEditEvent} className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors px-1">✓</button>
                    <button onClick={() => setEditingEvent(null)} className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors px-1">✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-zinc-300 text-sm truncate cursor-pointer hover:text-white transition-colors" onClick={() => setEditingEvent(event)}>{event.title}</span>
                    <button onClick={() => setEditingEvent(event)} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors px-1">✎</button>
                    <button onClick={() => deleteEvent(event.id)} className="text-zinc-700 hover:text-red-400 text-xs transition-colors px-1">✕</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Quotes */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-zinc-600">Ticker Quotes</h2>
            <button onClick={() => setQuotesExpanded(v => !v)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <span className="tabular-nums">{quotes.length} quotes</span>
              <span className={`transition-transform duration-200 ${quotesExpanded ? 'rotate-180' : ''}`}>↓</span>
            </button>
          </div>
          <div className="flex gap-2">
            <input type="text" value={newQuote} onChange={e => setNewQuote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQuote()} placeholder="Add quote…"
              className={inputCls} />
            <button onClick={addQuote} className={addBtnCls}>Add</button>
          </div>
          {quotesExpanded && (
            <>
              {quotes.length === 0 && <p className="text-zinc-700 text-xs">No quotes yet</p>}
              <ul className="space-y-1.5">
                {quotes.map(quote => (
                  <li key={quote.id} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700/50 px-3 py-2.5 rounded-xl">
                    {editingQuote?.id === quote.id ? (
                      <>
                        <input autoFocus value={editingQuote.title}
                          onChange={e => setEditingQuote({ ...editingQuote, title: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditQuote(); if (e.key === 'Escape') setEditingQuote(null); }}
                          className="flex-1 bg-transparent text-white text-sm focus:outline-none border-b border-zinc-600" />
                        <button onClick={saveEditQuote} className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors px-1">✓</button>
                        <button onClick={() => setEditingQuote(null)} className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors px-1">✕</button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-zinc-300 text-sm truncate cursor-pointer hover:text-white transition-colors" onClick={() => setEditingQuote(quote)}>{quote.title}</span>
                        <button onClick={() => setEditingQuote(quote)} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors px-1">✎</button>
                        <button onClick={() => deleteQuote(quote.id)} className="text-zinc-700 hover:text-red-400 text-xs transition-colors px-1">✕</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Video */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-zinc-600">Video</h2>
          {video && <p className="text-zinc-600 text-xs truncate">Current: {video.url}</p>}
          <div className="flex gap-2">
            <input type="text" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && updateVideo()} placeholder="YouTube URL…"
              className={inputCls} />
            <button onClick={updateVideo} className={addBtnCls}>Set</button>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className="text-sm text-zinc-300">Fullscreen on mirror</span>
            <Toggle on={appSettings.videoFullscreen} onChange={() => saveSetting({ videoFullscreen: !appSettings.videoFullscreen })} />
          </div>
        </section>

        {/* System */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-zinc-600">System</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => systemAction('screen-on')} className="border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white py-2.5 rounded-xl text-sm transition-colors">Screen On</button>
            <button onClick={() => systemAction('screen-off')} className="border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white py-2.5 rounded-xl text-sm transition-colors">Screen Off</button>
            <button onClick={() => setConfirm({ action: 'restart', message: 'restart the Pi' })} className="border border-zinc-800 text-zinc-500 hover:border-amber-700 hover:text-amber-400 py-2.5 rounded-xl text-sm transition-colors">Restart</button>
            <button onClick={() => setConfirm({ action: 'shutdown', message: 'shut down the Pi' })} className="border border-zinc-800 text-zinc-500 hover:border-red-800 hover:text-red-400 py-2.5 rounded-xl text-sm transition-colors">Shutdown</button>
          </div>
        </section>

        {/* Change PIN */}
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest text-zinc-600">Security</h2>
            <button onClick={() => { setPinSection(!pinSection); setPinError(''); setPinForm({ current: '', next: '', confirm: '' }); }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              {pinSection ? 'Cancel' : 'Change PIN →'}
            </button>
          </div>
          {pinSection && (
            <div className="space-y-3 pt-1">
              {[
                { label: 'Current PIN', key: 'current' as const },
                { label: 'New PIN (6 digits)', key: 'next' as const },
                { label: 'Confirm new PIN', key: 'confirm' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <div className="text-xs text-zinc-600 mb-1.5">{label}</div>
                  <input type="password" inputMode="numeric" maxLength={6} value={pinForm[key]}
                    onChange={e => setPinForm(prev => ({ ...prev, [key]: e.target.value.replace(/\D/g, '') }))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 tracking-widest transition-colors" />
                </div>
              ))}
              {pinError && <p className="text-red-400 text-xs">{pinError}</p>}
              <button onClick={changePIN} className="bg-white text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-100 active:scale-95 transition-all">
                Save PIN
              </button>
            </div>
          )}
        </section>

        <div className="pb-6" />
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
