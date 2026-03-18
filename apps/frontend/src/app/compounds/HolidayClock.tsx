'use client';
import { useEffect, useState } from 'react';

type Holiday = { holiday: string; date: string; day: string; comments?: string };
type Props = { clockFormat: '12h' | '24h' };

function getGreeting(hour: number) {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HolidayClock({ clockFormat }: Props) {
  const [now, setNow] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchHolidays = async () => {
      const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit' });
      try {
        const res = await fetch(`http://localhost:4000/api/holidays/search?date=${encodeURIComponent(currentDate)}`);
        const data = await res.json();
        setHolidays(data);
      } catch (err) {
        console.error('Failed to fetch holidays', err);
      }
    };

    fetchHolidays();
    const interval = setInterval(fetchHolidays, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: clockFormat === '12h',
  });

  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-white font-mono">
      <div className="text-sm text-gray-600 mb-1 tracking-wide">{getGreeting(now.getHours())}</div>
      <div className="text-sm text-gray-500 mb-1 tracking-wide">{date}</div>
      <div key={now.getMinutes()} className="text-7xl font-bold tracking-widest leading-tight" style={{ animation: 'tickIn 0.35s ease both' }}>{time}</div>

      {holidays.length > 0 && (
        <div className="mt-5">
          <div className="text-xs uppercase tracking-widest text-gray-600 mb-3">Upcoming Holidays</div>
          <div className="space-y-2">
            {holidays.map((holiday, i) => (
              <div key={i} className="flex justify-between items-center gap-10">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-white' : 'bg-gray-700'}`} />
                  <span className={i === 0 ? 'text-white text-sm font-semibold' : 'text-gray-600 text-xs'}>
                    {holiday.holiday}
                  </span>
                </div>
                <span className={i === 0 ? 'text-gray-400 text-sm' : 'text-gray-700 text-xs'}>
                  {holiday.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
