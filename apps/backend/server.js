const express = require('express');
const holidays = require('./indianHolidays');
const cors = require('cors');
const axios = require('axios');
const { exec } = require('child_process');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const EVENTS_FILE = path.join(__dirname, 'events.json');
const QEVENTS_FILE = path.join(__dirname, 'line.json');
const OVERLAY_FILE = path.join(__dirname, 'overlay.json');
const PLAYLIST_FILE = path.join(__dirname, 'playlist.json');
const PORT = 4000;

app.use(cors());
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

// --- Helpers ---
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// --- Events ---
app.get('/api/events', (req, res) => res.json(readJson(EVENTS_FILE)));

app.post('/api/events', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string')
    return res.status(400).json({ error: 'Title is required and must be a string.' });

  let events = readJson(EVENTS_FILE);
  if (events.length >= 10) events.shift();

  const newEvent = { id: Date.now().toString(), title: title.trim() };
  events.push(newEvent);
  writeJson(EVENTS_FILE, events);
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const events = readJson(EVENTS_FILE);
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  events[index].title = title;
  writeJson(EVENTS_FILE, events);
  res.json(events[index]);
});

app.delete('/api/events/:id', (req, res) => {
  const events = readJson(EVENTS_FILE);
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  const deleted = events.splice(index, 1);
  writeJson(EVENTS_FILE, events);
  res.json({ success: true, deleted: deleted[0] });
});

// --- Quotes (qevents) ---
app.get('/api/qevents', (req, res) => res.json(readJson(QEVENTS_FILE)));

app.post('/api/qevents', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const events = readJson(QEVENTS_FILE);
  const newEvent = { id: Date.now().toString(), title };
  events.push(newEvent);
  writeJson(QEVENTS_FILE, events);
  res.status(201).json(newEvent);
});

app.put('/api/qevents/:id', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const events = readJson(QEVENTS_FILE);
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  events[index].title = title;
  writeJson(QEVENTS_FILE, events);
  res.json(events[index]);
});

app.delete('/api/qevents/:id', (req, res) => {
  const events = readJson(QEVENTS_FILE);
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  const deleted = events.splice(index, 1);
  writeJson(QEVENTS_FILE, events);
  res.json({ success: true, deleted: deleted[0] });
});

// --- Overlay ---
app.get('/api/overlay', (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(OVERLAY_FILE, 'utf8')));
  } catch {
    res.json({ enabled: false, opacity: 0.4 });
  }
});

app.put('/api/overlay', (req, res) => {
  const { enabled, opacity } = req.body;
  if (typeof enabled !== 'boolean' || typeof opacity !== 'number')
    return res.status(400).json({ error: 'Invalid payload' });

  const settings = { enabled, opacity };
  fs.writeFileSync(OVERLAY_FILE, JSON.stringify(settings, null, 2), 'utf8');
  res.json({ success: true, updated: settings });
});

// --- Playlist ---
app.get('/api/playlist', (req, res) => {
  const playlist = readJson(PLAYLIST_FILE);
  res.json(playlist.slice(0, 1));
});

app.post('/api/playlist', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const video = { id: 1, url };
  writeJson(PLAYLIST_FILE, [video]);
  res.status(201).json(video);
});

app.put('/api/playlist/:id', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const video = { id: 1, url };
  writeJson(PLAYLIST_FILE, [video]);
  res.json(video);
});

// --- System Controls ---
app.post('/api/system/screen-on', (req, res) => {
  exec('DISPLAY=:0 xset dpms force on', (err) => {
    if (err) exec('vcgencmd display_power 1');
  });
  res.json({ success: true });
});

app.post('/api/system/screen-off', (req, res) => {
  exec('DISPLAY=:0 xset dpms force off', (err) => {
    if (err) exec('vcgencmd display_power 0');
  });
  res.json({ success: true });
});

app.post('/api/system/restart', (req, res) => {
  res.json({ success: true });
  setTimeout(() => exec('sudo shutdown -r now'), 500);
});

app.post('/api/system/shutdown', (req, res) => {
  res.json({ success: true });
  setTimeout(() => exec('sudo shutdown -h now'), 500);
});

// Start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
