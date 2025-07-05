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
    fetchEvents(); // initial load

    const interval = setInterval(() => {
      fetchEvents();
    }, 1000); // refresh every 1 second

    return () => clearInterval(interval); // cleanup
  }, []);

  return (
    <div className="text-gray-400 p-4 w-full font-mono text-left">
      <h2 className="text-3xl font-semibold mb-2">Coming Events</h2>

      {loading ? (
        <p className="text-xl">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-xl text-gray-500">No upcoming events</p>
      ) : (
        <ul className="space-y-1">
          {events.map((event) => (
            <li key={event.id} className="text-2xl">
              {event.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
