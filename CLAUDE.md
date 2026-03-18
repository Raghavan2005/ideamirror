# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Idea Mirror is a custom-built smart mirror (similar to MagicMirror) designed to run on a Raspberry Pi 4 with Linux. Both services run locally on the Pi — the frontend display is shown on the mirror screen, and the backend serves data and config. The web admin panel is a route within the frontend app, accessible from any device on the LAN.

- **`apps/frontend`** — Next.js 15 app: mirror display (`/`) + web admin panel (`/admin`)
- **`apps/backend`** — Node.js/Express API server on port 4000

## Commands

### Frontend (`apps/frontend`)
```bash
npm run dev      # Dev server with Turbopack on http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (`apps/backend`)
```bash
node server.js   # Start server on http://localhost:4000
npm start        # Same as above
```

## Architecture

### Data Flow
Display widgets poll the backend at `http://localhost:4000` (hardcoded — they always run in Chromium on the Pi). All widgets use `useEffect` with `setInterval` for live polling — no websockets.

### Backend Persistence
Flat JSON files, read/written synchronously on each request:
- `apps/backend/events.json` — upcoming events (max 10, FIFO)
- `apps/backend/line.json` — rotating quote/ticker lines
- `apps/backend/overlay.json` — `{ enabled: boolean, opacity: number }`
- `apps/backend/playlist.json` — single video entry `{ id, url }`

### Frontend Display Layout (`apps/frontend/src/app/page.tsx`)
Full-screen overlay (`fixed inset-0`) that polls `/api/overlay` every 5 seconds. If `enabled` is false, renders nothing. Widgets use absolute Tailwind positioning:
- Top-left: `HolidayClock` — live clock + upcoming Indian holidays
- Top-right: `WeatherWidget` — weather via IP geolocation
- Bottom-left: `Player` — muted video loop from `/api/playlist`
- Bottom-center: `QuoteLine` — rotating ticker from `/api/qevents`, fades every 5s
- Bottom-right: `EventList` — polls `/api/events` every 1 second

### Frontend Routes
- `/` — main mirror display
- `/admin` — web admin panel
- `/qr` — QR code screen (auto-redirects to `/` after 10 seconds)

### Admin Panel (`apps/frontend/src/app/admin/page.tsx`)
Single-page admin UI at `/admin`. Accessible from any device on the LAN at `http://PI_IP:3000/admin`. Uses `window.location.hostname` to dynamically construct the backend URL — no config needed, works from both the Pi and other devices. Controls: overlay toggle/opacity, events CRUD, quotes CRUD, video URL update, system commands (shutdown/restart/screen on-off).

### Backend API (`apps/backend/server.js`)
Single file. CORS is open (`*`) to allow LAN access from the admin. Key routes:
- `GET /api/weather?lat=&lon=` — proxies 7timer.info; falls back to IP geolocation via ip-api.com
- `GET /api/holidays/search?date=` — Indian holidays within 2 days of given date
- `GET|POST|PUT|DELETE /api/events` — events list (max 10, FIFO)
- `GET|POST|PUT|DELETE /api/qevents` — quote/ticker lines
- `GET|PUT /api/overlay` — overlay visibility and opacity
- `GET|POST|PUT /api/playlist` — single video entry
- `POST /api/system/screen-on|screen-off|restart|shutdown` — Pi system controls via `child_process.exec`
