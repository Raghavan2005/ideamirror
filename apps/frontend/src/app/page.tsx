
export default function Home() {
  return (
    <div className="fixed inset-0">
      {/* Top Left */}
      <div className="absolute top-0 left-0 w-1/3 h-24 bg-red-700 text-white flex items-center justify-center">
        topleft
      </div>

      {/* Top Center */}
      <div className="absolute top-0 left-1/3 w-1/3 h-24 bg-green-700 text-white flex items-center justify-center">
        topcenter
      </div>

      {/* Top Right */}
      <div className="absolute top-0 right-0 w-1/3 h-24 bg-blue-700 text-white flex items-center justify-center">
        topright
      </div>

      {/* Bottom Left */}
      <div className="absolute bottom-0 left-0 w-1/3 h-24 bg-yellow-600 text-black flex items-center justify-center">
        bottomleft
      </div>

      {/* Bottom Center */}
      <div className="absolute bottom-0 left-1/3 w-1/3 h-24 bg-purple-700 text-white flex items-center justify-center">
        bottomcenter
      </div>

      {/* Bottom Right */}
      <div className="absolute bottom-0 right-0 w-1/3 h-24 bg-pink-600 text-white flex items-center justify-center">
        bottomright
      </div>
    </div>
  );
}
