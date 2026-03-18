'use client';

import { useEffect, useState } from 'react';

type Event = {
  id: string;
  title: string;
};

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/events');
      const data = await res.json();
      setEvents(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load events:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-white font-mono">
      <div className="text-xs uppercase tracking-widest text-gray-600 mb-3 pb-2 border-b border-gray-800">
        Upcoming Events
      </div>
      {loading ? (
        <p className="text-gray-700 text-sm">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-700 text-sm">No upcoming events</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event, i) => (
            <li key={event.id} className={`${i === 0 ? 'text-white text-lg font-semibold' : 'text-gray-500 text-base'}`}>
              {event.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
