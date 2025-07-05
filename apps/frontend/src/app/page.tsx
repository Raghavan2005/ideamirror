import EventList from "./compounds/EventList";
import HolidayClock from "./compounds/HolidayClock"
import QuoteLine from "./compounds/QuoteLine";
import WeatherWidget from "./compounds/WeatherWidget";
import ReactPlayer from 'react-player'

export default function Home() {

  
  return (
    <div className="fixed inset-0 ">
      {/* Top Left */}
      <div className="absolute p-5 top-0 left-0 text-white flex items-center justify-center">
        <HolidayClock/>
      </div>

      {/* Top Center */}
      <div className="absolute top-0 p-5 left-1/3 w-1/3 h-24text-white flex items-center justify-center">
   
      </div>

      {/* Top Right */}
      <div className="absolute top-0 p-5 right-0 text-white flex items-center justify-center">
        <WeatherWidget/>
      </div>

      {/* Bottom Left */}
     <div className="absolute bottom-30 left-5 w-1/5 h-54 rounded-md overflow-hidden flex items-center justify-center">
  <ReactPlayer
    src="https://www.youtube.com/watch?v=LXb3EKWsInQ"
    playing
    muted
    controls={false}
    width="100%"
    height="100%"
    style={{
      borderRadius: '0.375rem', // Tailwind's rounded-md = 6px
    }}
  />
</div>


      {/* Bottom Center */}
      <div className="absolute bottom-0 p-5 left-1/3 w-1/3 h-24  text-white flex items-center justify-center">
        <QuoteLine/>
      </div>

      {/* Bottom Right */}
     <div className="fixed inset-0">
  {/* Bottom right: Event List */}
  <div className="absolute bottom-30 right-0 p-5 text-white flex flex-col items-end pr-4">
    <EventList />
  </div>

  {/* Bottom center: White box */}
  <div className="absolute bottom-10 right-5  transform -translate-x-1/2">
    <div className="e text-white px-4 py-2 rounded">
      test
    </div>
  </div>
</div>

   
    </div>
  );
}
