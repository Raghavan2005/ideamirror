export default function EventList() {
  const events = [
    "Event 1",
    "Event 1",
    "Event 1",
    "Event 1",
    "Event 1"
  ];

  return (
    <div className="text-gray-400 p-4 w-full font-mono text-left">
      <h2 className="text-3xl font-semibold mb-2">Coming Events</h2>
      <ul className="space-y-1">
        {events.map((event, index) => (
          <li key={index} className="text-2xl">
            {event}
          </li>
        ))}
      </ul>
     
    </div>
  );
}
