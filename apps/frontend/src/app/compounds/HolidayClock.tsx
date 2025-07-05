'use client';
import { useEffect, useState } from 'react';

const holidays = [
  { name: 'Holiday 1', date: 'Nov 01' },
  { name: 'Holiday 2', date: 'Nov 01' },
  { name: 'Holiday 3', date: 'Nov 01' },
];

export default function HolidayClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-white font-mono bg-black p-6 w-full max-w-md rounded-xl shadow-lg">
      <div className="text-lg mb-2">{date}</div>

      <div className="text-6xl font-bold tracking-widest leading-tight">
        {time}
      </div>

      <div className="mt-4 text-xl font-semibold">Holidays</div>
      <hr className="border-gray-500 my-2" />

      <div className="space-y-2">
        {holidays.map((holiday, i) => (
          <div key={i} className="flex justify-between items-center text-1xl">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-white' : 'bg-gray-600 opacity-70'}`} />
              <span className={`${i === 0 ? 'font-bold' : 'text-gray-400 opacity-70'}`}>{holiday.name}</span>
            </div>
            <div className={`${i === 0 ? 'font-bold' : 'text-gray-400 opacity-70'}`}>{holiday.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
