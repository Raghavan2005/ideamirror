const express = require('express');
const holidays = require('./indianHolidays');
const cors = require('cors');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const EVENTS_FILE = path.join(__dirname, 'events.json');


const PORT = 4000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => {
  res.send('Server is running');
});

// 🌤️ Weather API
app.get('/api/weather', async (req, res) => {
  let { lat, lon } = req.query;
  let locationInfo = null;

  try {
    if (!lat || !lon) {
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
      const geo = await axios.get(`http://ip-api.com/json/${ip}`);
      const location = geo.data;

      if (location.status !== 'success') {
        return res.status(400).json({ error: 'Failed to determine location from IP' });
      }

      lat = location.lat;
      lon = location.lon;
      locationInfo = {
        city: location.city,
        region: location.regionName,
        country: location.country,
      };
    }

    const url = `https://www.7timer.info/bin/astro.php?lon=${lon}&lat=${lat}&ac=0&unit=metric&output=json&tzshift=0`;
    const weatherResponse = await axios.get(url);

    res.json({
      location: locationInfo || { lat, lon },
      weather: weatherResponse.data,
    });
  } catch (err) {
    console.error('Error fetching weather:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// 🎉 Holiday API
app.get('/api/holidays/search', (req, res) => {
  const dateQuery = req.query.date;
  if (!dateQuery) return res.status(400).json({ error: 'date query param missing' });

  const baseDate = new Date(`${dateQuery} ${new Date().getFullYear()}`);
  if (isNaN(baseDate)) return res.status(400).json({ error: 'Invalid date format' });

  const result = holidays.filter(h => {
    const holidayDate = new Date(`${h.date} ${new Date().getFullYear()}`);
    const diffInDays = (holidayDate - baseDate) / (1000 * 3600 * 24);
    return diffInDays >= 0 && diffInDays <= 2;
  });

  res.json(result);
});

// Helper to read events.json
function readEvents() {
  try {
    const data = fs.readFileSync(EVENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return []; // If file doesn't exist or is empty
  }
}

// Helper to write to events.json
function writeEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
}

// ✅ GET all events
app.get('/api/events', (req, res) => {
  const events = readEvents();
  res.json(events);
});

// ✅ POST new event
app.post('/api/events', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const events = readEvents();
  const newEvent = {
    id: Date.now().toString(),
    title,
  };
  events.push(newEvent);
  writeEvents(events);

  res.status(201).json(newEvent);
});

// ✅ PUT update event
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const events = readEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  events[index].title = title;
  writeEvents(events);

  res.json(events[index]);
});

// ✅ DELETE event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;

  const events = readEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  const deleted = events.splice(index, 1);
  writeEvents(events);

  res.json({ success: true, deleted: deleted[0] });
});

// 🔌 Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
