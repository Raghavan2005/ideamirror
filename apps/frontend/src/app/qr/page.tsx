'use client';

import { MoonLoader  } from "react-spinners";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


export default function Loading() {
  const router = useRouter();
 const [timeLeft, setTimeLeft] = useState(10);
useEffect(() => {
    if (timeLeft <= 0) {
      router.push('/')
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;





  return (
  <>
  <div className="min-h-screen flex justify-center items-center bg-black text-white">
    <div className="flex flex-col sm:flex-row justify-center items-center gap-34 p-6">
      <div className="flex flex-col items-center">
        <img src="/qr1.png" alt="QR Code 1" className="w-80 h-80 mb-10 bg-white" />
        <div className="mt-2 text-4xl">Scan & Download App Here</div>
      </div>

      <div className="flex flex-col items-center">
        <img src="/qr.png" alt="QR Code 2" className="w-80 mb-10 h-80 bg-white" />
        <div className="mt-2 text-4xl">Open Your App & Scan it</div>
      </div>
    </div>
   <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
  <MoonLoader
    color="#ffffff"
    loading={true}
    size={50}
    aria-label="Loading Spinner"
    data-testid="loader"
  />

  <div className="mt-2 text-2xl text-center">Skip in {minutes}:{seconds.toString().padStart(2, '0')}</div>
</div>

  
  </div>

</>

  );
}
