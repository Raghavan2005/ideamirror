'use client';

import { MoonLoader  } from "react-spinners";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


export default function Loading() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timings = [
      setTimeout(() => setStep(1), 1000),     // Show "Good Morning"
      setTimeout(() => setStep(2), 2500),     // Show "Welcome to Idea Factory"
    setTimeout(() => setStep(3), 4500), 
    setTimeout(() => setStep(4), 6000),      // Show logos
    setTimeout(() => router.push('/qr'), 7000) // Redirect to home
    ];
    return () => timings.forEach(clearTimeout);
  }, [router]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white transition-all duration-1000">
      {step === 1 && (
        <div>
             <h1 className="text-6xl font-bold fade-in">Good Morning !!!</h1>
            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
       
        <MoonLoader
          color="#ffffff"
          loading={true}
          size={50}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
            </div>

     
      )}
      {step === 2 && (
        <div>
 <h2 className="text-6xl mt-4 font-bold fade-in">Welcome to Idea Factory</h2>
     
<div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
       
        <MoonLoader
          color="#ffffff"
          loading={true}
          size={50}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
      </div>
      )}
      {step === 3 && (
        <div className="mt-6 fade-in flex flex-col items-center">
          <img src="/images/main_logo.png" alt="Main Logo" className=" h-77 mb-4" />
          <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
       
        <MoonLoader
          color="#ffffff"
          loading={true}
          size={50}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
        </div>
      )}
      {step === 4 && (
        <div className="mt-6 fade-in flex flex-col items-center">
          <img src="/images/logo2.png" alt="Main Logo" className="w-[80%] h-77 mb-4" />
          <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2">
       
        <MoonLoader
          color="#ffffff"
          loading={true}
          size={50}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </div>
        </div>
      )}
    </div>
  );
}
