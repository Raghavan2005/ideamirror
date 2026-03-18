# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Idea Mirror is a custom-built smart mirror (similar to MagicMirror) designed to run on a Raspberry Pi 4 with Linux. All three services run locally on the Pi — the frontend display is shown on the mirror screen, the backend serves data, and the Flutter app on a phone connects to the Pi over the local network to control it.

The three components are:

- **`apps/frontend`** — Next.js 15 display screen (the mirror UI)
- **`apps/backend`** — Node.js/Express API server (data & config)
- **`apps/Idea_Mirror_Admin`** — Flutter mobile admin app

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

### Flutter Admin App (`apps/Idea_Mirror_Admin`)
```bash
flutter pub get          # Install dependencies
flutter run              # Run on connected device/emulator
flutter build apk        # Build Android APK
```

## Architecture

### Data Flow
The frontend display polls the backend at `http://localhost:4000` (hardcoded). All widgets use `useEffect` with `setInterval` for live polling — no websockets or server-sent events.

### Backend Persistence
The backend uses flat JSON files (no database). Files are read/written synchronously on each request:
- `apps/backend/events.json` — upcoming events (max 10, FIFO)
- `apps/backend/line.json` — rotating quote/ticker lines
- `apps/backend/overlay.json` — `{ enabled: boolean, opacity: number }` controls whether the display is shown
- `apps/backend/playlist.json` — single video entry `{ id, url }`

### Frontend Display Layout (`apps/frontend/src/app/page.tsx`)
The main page is a full-screen overlay (`fixed inset-0`) that polls `/api/overlay` every 5 seconds. If `enabled` is false, it renders nothing. Widget positions are hardcoded with Tailwind absolute positioning:
- Top-left: `HolidayClock` — live clock + upcoming Indian holidays from `/api/holidays/search`
- Top-right: `WeatherWidget` — weather from `/api/weather` (currently hardcoded lat/lon)
- Bottom-left: `Player` — video player from `/api/playlist`, loops single video
- Bottom-center: `QuoteLine` — rotating ticker from `/api/qevents`, fades every 5s
- Bottom-right: `EventList` — polls `/api/events` every 1 second

### Frontend Routes
- `/` — main mirror display
- `/qr` — QR code screen (auto-redirects to `/` after 10 seconds)
- `/loading` — QR code screen variant

### Backend API
All routes are in `apps/backend/server.js` (single file). CORS is restricted to `http://localhost:3000`. Key routes:
- `GET /api/weather?lat=&lon=` — proxies 7timer.info; falls back to IP geolocation via ip-api.com
- `GET /api/holidays/search?date=` — searches Indian holidays within 2 days of given date
- `GET|POST|PUT|DELETE /api/events` — manage events list
- `GET|POST|PUT|DELETE /api/qevents` — manage quote/ticker lines
- `GET|PUT /api/overlay` — get/set overlay visibility and opacity
- `GET /api/playlist` — returns first video only; `PUT /api/playlist/:id` replaces it

### Flutter Admin App (`apps/Idea_Mirror_Admin`)
Entry point is `lib/main.dart`, launches `Homescreen`. The admin app provides system controls (shutdown, restart, screen on/off) and content editors. Many screens (`QuotesEditorScreen`, `VideoListEditorScreen`, `StartUpTimeScreen`) are currently placeholder stubs. Uses `qr_code_scanner_plus` for scanning and `wifi_iot` for WiFi management.
