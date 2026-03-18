'use client';

import { MoonLoader } from "react-spinners";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

export default function QRPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(30);
  const [adminUrl, setAdminUrl] = useState('');

  useEffect(() => {
    setAdminUrl(`http://${window.location.hostname}:3000/admin`);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      router.push('/');
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center gap-8">

      <div className="text-xs uppercase tracking-widest text-gray-600">Idea Mirror Admin</div>

      <div className="bg-white p-5 rounded-xl">
        {adminUrl && <QRCode value={adminUrl} size={240} />}
      </div>

      <div className="text-center space-y-2">
        <div className="text-lg text-white">{adminUrl}</div>
        <div className="text-sm text-gray-600">Scan to open admin panel on your device</div>
      </div>

      <div className="flex flex-col items-center gap-3 mt-4">
        <MoonLoader color="#4b5563" size={28} />
        <div className="text-sm text-gray-600">
          Skip in {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

    </div>
  );
}
