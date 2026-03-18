'use client';

import { useEffect, useState } from 'react';

type Event = { id: string; title: string; date?: string; type?: 'custom' | 'public' };

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const [custom, pub] = await Promise.all([
        fetch('http://localhost:4000/api/events').then(r => r.json()).catch(() => []),
        fetch('http://localhost:4000/api/events/public').then(r => r.json()).catch(() => []),
      ]);
      setEvents([
        ...(Array.isArray(custom) ? custom.map((e: Event) => ({ ...e, type: 'custom' as const })) : []),
        ...(Array.isArray(pub) ? pub : []),
      ]);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-white font-mono">
      <div className="text-xs uppercase tracking-widest text-gray-600 mb-3 pb-2 border-b border-gray-800">
        Upcoming
      </div>
      {loading ? (
        <p className="text-gray-700 text-sm">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-700 text-sm">No upcoming events</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event, i) => (
            <li key={event.id} className="flex items-baseline justify-between gap-3">
              <span className={`truncate ${
                event.type === 'public'
                  ? 'text-amber-400/70 text-sm'
                  : i === 0 ? 'text-white text-lg font-semibold' : 'text-gray-500 text-base'
              }`}>
                {event.title}
              </span>
              {event.date && (
                <span className="text-xs text-gray-700 flex-shrink-0">{event.date}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
