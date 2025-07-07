'use client';
import { useEffect, useState } from 'react';

export default function QuoteLine() {
  const [quotes, setQuotes] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // 🔄 Poll quotes from API every 5 seconds
  useEffect(() => {
    const fetchQuotes = () => {
      fetch('http://localhost:4000/api/qevents')
        .then(res => res.json())
        .then(data => {
          const titles = Array.isArray(data) ? data.map((item: any) => item.title) : [];
          setQuotes(titles);
        })
        .catch(err => console.error('Failed to load quotes:', err));
    };

    fetchQuotes(); // initial fetch
    const poller = setInterval(fetchQuotes, 5000); // poll every 5s

    return () => clearInterval(poller);
  }, []);

  // ⏱ Handle index change every 5 seconds
  useEffect(() => {
    if (quotes.length === 0) return;

    const rotate = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % quotes.length);
        setFade(true);
      }, 300);
    }, 5000);

    return () => clearInterval(rotate);
  }, [quotes]);

  if (quotes.length === 0) {
    return (
      <div className="text-gray-400 p-4 w-full font-mono text-center">
        <div className="text-2xl opacity-50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="text-gray-400 p-4 w-full font-mono text-center">
      <div
        className={`text-2xl transition-opacity duration-500 ease-in-out ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {quotes[index]}
      </div>
    </div>
  );
}
