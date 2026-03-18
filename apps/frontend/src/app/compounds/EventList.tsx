'use client';

import { useEffect, useState } from 'react';

type Event = {
  id: string;
  title: string;
  date?: string;    // ISO for custom (2026-03-20), formatted for public ("20 Mar")
  isoDate?: string; // always ISO — used for sorting
  type: 'custom' | 'public';
};

function parseDateBadge(isoDate: string): { month: string; day: string } {
  const parts = isoDate.split('-').map(Number);
  const day = parts[2];
  const tmp = new Date(isoDate + 'T00:00:00');
  const month = tmp.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  return { month, day: String(day) };
}

export default function EventList({ eventCount = 5 }: { eventCount?: number }) {
  const [events, setEvents] = useState<Event[]>([]);

  const fetchEvents = async () => {
    try {
      const [custom, pub] = await Promise.all([
        fetch('http://localhost:4000/api/events').then(r => r.json()).catch(() => []),
        fetch('http://localhost:4000/api/events/public').then(r => r.json()).catch(() => []),
      ]);

      const customEvents: Event[] = (Array.isArray(custom) ? custom : []).map((e: Event) => ({
        ...e,
        type: 'custom' as const,
        isoDate: e.date, // custom date field is already ISO
      }));
      const pubEvents: Event[] = Array.isArray(pub) ? pub : [];

      // Dated events sorted by isoDate, undated custom events at the bottom
      const dated = [...customEvents.filter(e => e.isoDate), ...pubEvents]
        .sort((a, b) => (a.isoDate || '').localeCompare(b.isoDate || ''));
      const undated = customEvents.filter(e => !e.isoDate);

      setEvents([...dated, ...undated].slice(0, eventCount));
    } catch {
      // silently keep previous state
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [eventCount]);

  if (events.length === 0) return null;

  return (
    <div className="text-white font-mono">
      <div className="text-xs uppercase tracking-widest text-zinc-700 mb-3 pb-2 border-b border-zinc-900">
        Upcoming
      </div>
      <ul className="space-y-2.5">
        {events.map((event, i) => {
          const isPublic = event.type === 'public';
          const badge = event.isoDate ? parseDateBadge(event.isoDate) : null;
          return (
            <li key={event.id} className="flex items-center gap-3"
              style={{ animation: `fadeInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s both` }}>
              {badge ? (
                <div className={`flex-shrink-0 flex flex-col items-center justify-center w-9 h-9 rounded-lg border ${isPublic ? 'border-amber-900/40 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900'}`}>
                  <span className={`text-[8px] uppercase tracking-wider leading-none ${isPublic ? 'text-amber-700' : 'text-zinc-600'}`}>{badge.month}</span>
                  <span className={`text-sm font-semibold leading-none mt-0.5 ${isPublic ? 'text-amber-400' : 'text-white'}`}>{badge.day}</span>
                </div>
              ) : (
                <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                </div>
              )}
              <span className={`text-sm truncate leading-tight ${isPublic ? 'text-amber-400/70' : 'text-zinc-300'}`}>
                {event.title}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
