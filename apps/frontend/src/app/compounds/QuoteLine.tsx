'use client';
import { useEffect, useRef, useState } from 'react';

export default function QuoteLine() {
  const [quotes, setQuotes] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const quotesRef = useRef<string[]>([]);

  // Poll quotes independently — does not affect rotation
  useEffect(() => {
    const fetchQuotes = () => {
      fetch('http://localhost:4000/api/qevents')
        .then(res => res.json())
        .then(data => {
          const titles = Array.isArray(data) ? data.map((item: { title: string }) => item.title) : [];
          setQuotes(titles);
          quotesRef.current = titles;
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    };

    fetchQuotes();
    const poller = setInterval(fetchQuotes, 5000);
    return () => clearInterval(poller);
  }, []);

  // Rotation runs independently using ref — never resets due to re-polls
  useEffect(() => {
    const rotate = setInterval(() => {
      if (quotesRef.current.length === 0) return;
      setFade(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % quotesRef.current.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(rotate);
  }, []);

  if (!loaded) return null;
  if (quotes.length === 0) return null;

  return (
    <div className="text-gray-400 p-4 w-full font-mono text-center">
      <div className={`text-2xl transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {quotes[index]}
      </div>
    </div>
  );
}
