const express = require('express');
const holidays = require('./indianHolidays');
const cors = require('cors');
const axios = require('axios');
const { exec } = require('child_process');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const EVENTS_FILE    = path.join(__dirname, 'events.json');
const QEVENTS_FILE   = path.join(__dirname, 'line.json');
const OVERLAY_FILE   = path.join(__dirname, 'overlay.json');
const PLAYLIST_FILE  = path.join(__dirname, 'playlist.json');
const SETTINGS_FILE  = path.join(__dirname, 'settings.json');
const PORT = 4000;

// Chennai default coords (fallback when running on localhost)
const CHENNAI = { lat: 13.0827, lon: 80.2707, city: 'Chennai', region: 'Tamil Nadu', country: 'India' };

// 30-minute weather cache
let weatherCache = { key: null, data: null, time: 0 };
const CACHE_MS = 30 * 60 * 1000;

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => res.send('Server is running'));

// --- SSE stream ---
let sseClients = [];

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current state immediately on connect
  const payload = {
    overlay: readJson(OVERLAY_FILE, { enabled: true, opacity: 0.9 }),
    settings: readJson(SETTINGS_FILE, DEFAULT_SETTINGS),
  };
  res.write(`data: ${JSON.stringify(payload)}\n\n`);

  sseClients.push(res);
  req.on('close', () => { sseClients = sseClients.filter(c => c !== res); });
});

function broadcastState() {
  if (sseClients.length === 0) return;
  const payload = {
    overlay: readJson(OVERLAY_FILE, { enabled: true, opacity: 0.9 }),
    settings: readJson(SETTINGS_FILE, DEFAULT_SETTINGS),
  };
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach(c => c.write(msg));
}

// --- Helpers ---
function readJson(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}
function isLocalhost(ip) {
  return !ip || ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(ip);
}

// 🌤️ Weather API
app.get('/api/weather', async (req, res) => {
  let { lat, lon } = req.query;
  let locationInfo = null;

  try {
    if (!lat || !lon) {
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

      if (isLocalhost(ip)) {
        lat = CHENNAI.lat;
        lon = CHENNAI.lon;
        locationInfo = { city: CHENNAI.city, region: CHENNAI.region, country: CHENNAI.country };
      } else {
        const geo = await axios.get(`http://ip-api.com/json/${ip}`);
        const location = geo.data;
        if (location.status !== 'success') {
          return res.status(400).json({ error: 'Failed to determine location from IP' });
        }
        lat = location.lat;
        lon = location.lon;
        locationInfo = { city: location.city, region: location.regionName, country: location.country };
      }
    }

    const cacheKey = `${lat},${lon}`;
    if (weatherCache.key === cacheKey && Date.now() - weatherCache.time < CACHE_MS) {
      return res.json(weatherCache.data);
    }

    const url = `https://www.7timer.info/bin/astro.php?lon=${lon}&lat=${lat}&ac=0&unit=metric&output=json&tzshift=0`;
    const weatherResponse = await axios.get(url);
    const responseData = { location: locationInfo || { lat, lon }, weather: weatherResponse.data };

    weatherCache = { key: cacheKey, data: responseData, time: Date.now() };
    res.json(responseData);
  } catch (err) {
    console.error('Error fetching weather:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// 🗓️ Upcoming public holidays — Nager.Date API with local fallback
const publicHolidayCache = {}; // keyed by year

function localUpcoming(todayMs, limitMs, year) {
  const results = [];
  holidays.forEach(h => {
    const d = new Date(`${h.date} ${year}`);
    if (isNaN(d.getTime())) return;
    const ms = d.getTime();
    if (ms >= todayMs && ms <= limitMs)
      results.push({ id: `pub_${year}_${h.date.replace(/\s+/g, '_')}_${h.holiday.replace(/\s+/g, '_')}`, title: h.holiday, date: h.date, type: 'public' });
  });
  return results;
}

app.get('/api/events/public', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 30);
  const todayMs = today.getTime();
  const limitMs = limit.getTime();
  const thisYear = today.getFullYear();

  try {
    const yearsNeeded = [thisYear];
    if (limit.getFullYear() > thisYear) yearsNeeded.push(thisYear + 1);

    const allHolidays = [];
    for (const year of yearsNeeded) {
      if (!publicHolidayCache[year]) {
        const resp = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`, { timeout: 5000 });
        publicHolidayCache[year] = resp.data;
      }
      allHolidays.push(...publicHolidayCache[year]);
    }

    const upcoming = allHolidays
      .filter(h => { const ms = new Date(h.date).getTime(); return ms >= todayMs && ms <= limitMs; })
      .map(h => ({
        id: `pub_${h.date}`,
        title: h.name,
        date: new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        type: 'public',
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    if (upcoming.length > 0) return res.json(upcoming);

    // API returned no results — fall back to local data
    throw new Error('No results from API');
  } catch (err) {
    console.warn('Public holidays API unavailable, using local data:', err.message);
    const fallback = [];
    for (const year of [thisYear, thisYear + 1]) {
      fallback.push(...localUpcoming(todayMs, limitMs, year));
    }
    fallback.sort((a, b) => new Date(`${a.date} ${thisYear}`).getTime() - new Date(`${b.date} ${thisYear}`).getTime());
    res.json(fallback);
  }
});

// 🎉 Holiday search API
app.get('/api/holidays/search', (req, res) => {
  const dateQuery = req.query.date;
  if (!dateQuery) return res.status(400).json({ error: 'date query param missing' });

  const baseDate = new Date(`${dateQuery} ${new Date().getFullYear()}`);
  if (isNaN(baseDate.getTime())) return res.status(400).json({ error: 'Invalid date format' });

  const result = holidays.filter(h => {
    const holidayDate = new Date(`${h.date} ${new Date().getFullYear()}`);
    const diffInDays = (holidayDate - baseDate) / (1000 * 3600 * 24);
    return diffInDays >= 0 && diffInDays <= 2;
  });

  res.json(result);
});

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
app.get('/api/overlay', (req, res) => res.json(readJson(OVERLAY_FILE, { enabled: true, opacity: 0.9 })));

app.put('/api/overlay', (req, res) => {
  const { enabled, opacity } = req.body;
  if (typeof enabled !== 'boolean' || typeof opacity !== 'number')
    return res.status(400).json({ error: 'Invalid payload' });

  const settings = { enabled, opacity };
  writeJson(OVERLAY_FILE, settings);
  broadcastState();
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

// --- Settings ---
const DEFAULT_SETTINGS = {
  pin: '123456',
  clockFormat: '12h',
  muted: true,
  volume: 80,
  videoFullscreen: false,
  widgets: { clock: true, weather: true, events: true, quotes: true, player: true },
};

app.get('/api/settings', (req, res) => res.json(readJson(SETTINGS_FILE, DEFAULT_SETTINGS)));

app.put('/api/settings', (req, res) => {
  const current = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  const updated = { ...current, ...req.body };
  if (req.body.widgets) updated.widgets = { ...current.widgets, ...req.body.widgets };
  writeJson(SETTINGS_FILE, updated);
  broadcastState();
  res.json(updated);
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
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
