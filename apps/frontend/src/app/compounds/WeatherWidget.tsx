'use client';

import { useEffect, useState } from 'react';
import { Droplets, Wind, CloudRain, Sun } from 'lucide-react';

type WeatherData = {
  temp2m: number;
  rh2m: number;
  wind10m: {
    direction: string;
    speed: number;
  };
  prec_type: string;
};

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/weather?lat=23.1&lon=113.2')
      .then(res => res.json())
      .then(json => {
        const first = json?.weather?.dataseries?.[0];
        if (first) setData(first);
        setLoading(false);
      })
      .catch(err => {
        console.error('Weather fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-black text-gray-300 p-6 w-60 rounded-xl font-mono text-center">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-black text-red-400 p-6 w-60 rounded-xl font-mono text-center">
        Weather data unavailable
      </div>
    );
  }

  const { temp2m, rh2m, wind10m, prec_type } = data;
  const isRaining = prec_type === 'rain';

  return (
    <div className="bg-black text-gray-300 p-6 w-70 rounded-xl font-mono text-center space-y-3">
      {/* Temperature and icon */}
      <div className="flex justify-center items-center gap-2 text-6xl font-bold leading-none">
        <span>{temp2m}°</span>
        {isRaining ? (
          <CloudRain className="w-10 h-10 text-blue-400" />
        ) : (
          <Sun className="w-10 h-10 text-yellow-400" />
        )}
      </div>

      {/* Weather status */}
      <div className="text-3xl font-semibold border-b border-gray-500 pb-1">
        {isRaining ? 'Rainy' : 'Clear'}
      </div>

      {/* Humidity & Wind */}
      <div className="flex justify-between items-center px-2 text-sm pt-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-15 h-15 bg-gray-800 rounded-full flex items-center justify-center">
            <Droplets className="w-10 h-10 text-blue-300" />
          </div>
          <span className="text-2xl font-semibold mt-2">{rh2m}%</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-15 h-15 bg-gray-800 rounded-full flex items-center justify-center">
            <Wind className="w-10 h-10 text-cyan-300" />
          </div>
          <span className="text-2xl font-semibold mt-2">
            {wind10m.speed} km/h
          </span>
        </div>
      </div>
    </div>
  );
}
