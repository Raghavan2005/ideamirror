'use client';
import { useEffect, useState } from 'react';

export default function QuoteLine() {
  const quotes = [
    "Event 1",
    "Event 2",
    "Event 3",
    "Event 4",
    "Event 5"
  ];

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // trigger fade-out
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % quotes.length);
        setFade(true); // trigger fade-in
      }, 300); // match fade-out duration
    }, 5000);

    return () => clearInterval(interval);
  }, [quotes.length]);

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
