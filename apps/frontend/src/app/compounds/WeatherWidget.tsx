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
    fetch('http://localhost:4000/api/weather')
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
    return <div className="text-gray-600 font-mono text-sm text-right">Loading weather...</div>;
  }

  if (!data) {
    return <div className="text-gray-700 font-mono text-sm text-right">Weather unavailable</div>;
  }

  const { temp2m, rh2m, wind10m, prec_type } = data;
  const isRaining = prec_type === 'rain';

  return (
    <div className="text-white font-mono text-right">
      <div className="flex items-center justify-end gap-3">
        <span className="text-7xl font-bold">{temp2m}°</span>
        {isRaining ? (
          <CloudRain className="w-12 h-12 text-blue-400" />
        ) : (
          <Sun className="w-12 h-12 text-yellow-400" />
        )}
      </div>
      <div className="text-xl text-gray-500 mt-1 tracking-wide">{isRaining ? 'Rainy' : 'Clear'}</div>
      <div className="flex justify-end gap-5 mt-3 text-gray-500 text-sm">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span>{rh2m}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span>{wind10m.speed} km/h</span>
        </div>
      </div>
    </div>
  );
}
