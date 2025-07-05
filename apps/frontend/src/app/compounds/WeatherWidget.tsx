export default function WeatherWidget() {
  return (
    <div className="bg-black text-gray-300 p-6 w-60 rounded-xl font-mono text-center space-y-3">
      {/* Temperature and icon */}
      <div className="flex justify-center items-center gap-2 text-5xl font-bold leading-none">
        <span>82°</span>
        <div className="w-20 h-20 rounded-full bg-gray-500" /> {/* Placeholder icon */}
      </div>

      {/* Weather status */}
      <div className="text-2xl font-semibold border-b border-gray-500 pb-1">
        Shine Day
      </div>

      {/* Two circle metrics (e.g. humidity, UV) */}
      <div className="flex justify-between items-center px-2 text-sm pt-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-gray-500 rounded-full" />
          <span className="text-2xl font-semibold mt-2">67%</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-gray-500 rounded-full" />
          <span className="text-2xl font-semibold mt-2">67%</span>
        </div>
      </div>
    </div>
  );
}
