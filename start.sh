#!/usr/bin/env bash
# Idea Mirror — Setup & Launch Script
# Run once after cloning, then re-run to pull updates and restart.
#
# Usage:
#   chmod +x start.sh
#   ./start.sh

set -e

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$REPO/apps/frontend"
BACKEND="$REPO/apps/backend"

# ── Colors ────────────────────────────────────────────────────────
B='\033[0;34m'; G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
log()  { echo -e "${B}[ideamirror]${N} $1"; }
ok()   { echo -e "${G}  ✓ $1${N}"; }
warn() { echo -e "${Y}  ! $1${N}"; }
die()  { echo -e "${R}  ✗ $1${N}"; exit 1; }

echo ""
echo -e "${B}╔══════════════════════════════════════════╗${N}"
echo -e "${B}║        Idea Mirror  —  Auto Setup        ║${N}"
echo -e "${B}╚══════════════════════════════════════════╝${N}"
echo ""

# ── 1. Pull latest from git ───────────────────────────────────────
log "Pulling latest from git..."
cd "$REPO"
if git pull --ff-only 2>/dev/null; then
  ok "Repository up to date"
else
  warn "Git pull skipped (local changes or detached HEAD — continuing anyway)"
fi

# ── 2. Install Node.js if missing ────────────────────────────────
if ! command -v node &>/dev/null; then
  log "Node.js not found — installing v20 LTS via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ok "Node.js installed"
fi
ok "Node $(node -v)  /  npm $(npm -v)"

# ── 3. Backend dependencies ───────────────────────────────────────
log "Installing backend dependencies..."
cd "$BACKEND"
npm install --omit=dev
ok "Backend dependencies ready"

# ── 4. Frontend dependencies ──────────────────────────────────────
log "Installing frontend dependencies..."
cd "$FRONTEND"
npm install
ok "Frontend dependencies ready"

# ── 5. Build frontend (production) ───────────────────────────────
log "Building frontend..."
cd "$FRONTEND"
npm run build
ok "Frontend built"

# ── 6. Install pm2 if missing ────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "Installing pm2 process manager..."
  sudo npm install -g pm2
fi
ok "pm2 $(pm2 -v)"

# ── 7. Start / restart services ──────────────────────────────────
log "Starting services with pm2..."
cd "$REPO"

pm2 delete ideamirror-backend  2>/dev/null || true
pm2 delete ideamirror-frontend 2>/dev/null || true

pm2 start "$BACKEND/server.js" \
  --name ideamirror-backend \
  --time

pm2 start npm \
  --name ideamirror-frontend \
  --cwd "$FRONTEND" \
  -- start \
  --time

pm2 save
ok "Services started"

# ── 8. Configure boot auto-start via pm2 ─────────────────────────
log "Configuring boot auto-start..."
STARTUP_CMD=$(pm2 startup 2>&1 | awk '/sudo/{print; exit}')
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD"
  ok "pm2 will start automatically on boot"
else
  warn "Run 'pm2 startup' manually and follow the printed instructions"
fi

# ── 9. Chromium kiosk mode ────────────────────────────────────────
DESKTOP_DIR="$HOME/.config/autostart"
DESKTOP_FILE="$DESKTOP_DIR/ideamirror-kiosk.desktop"

# Find the right Chromium binary
CHROMIUM_BIN=""
for bin in chromium-browser chromium google-chrome; do
  if command -v "$bin" &>/dev/null; then
    CHROMIUM_BIN="$bin"
    break
  fi
done

if [ -z "$CHROMIUM_BIN" ]; then
  warn "Chromium not found — skipping kiosk setup (install chromium-browser and re-run)"
else
  if [ ! -f "$DESKTOP_FILE" ]; then
    log "Setting up Chromium kiosk auto-launch..."
    mkdir -p "$DESKTOP_DIR"
    cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=Idea Mirror Kiosk
Exec=bash -c 'sleep 8 && $CHROMIUM_BIN --kiosk --noerrdialogs --disable-infobars --no-first-run --disable-session-crashed-bubble --disable-restore-session-state http://localhost:3000'
Hidden=false
X-GNOME-Autostart-enabled=true
EOF
    ok "Kiosk mode configured — takes effect on next reboot"
  else
    ok "Kiosk mode already configured ($DESKTOP_FILE)"
  fi
fi

# ── Done ──────────────────────────────────────────────────────────
echo ""
echo -e "${G}╔══════════════════════════════════════════╗${N}"
echo -e "${G}║          Idea Mirror is running!         ║${N}"
echo -e "${G}╚══════════════════════════════════════════╝${N}"
echo ""
echo -e "  Mirror    →  ${B}http://localhost:3000${N}"
echo -e "  Admin     →  ${B}http://localhost:3000/admin${N}"
echo -e "  Backend   →  ${B}http://localhost:4000${N}"
echo ""
echo -e "  ${Y}pm2 status${N}       — check service health"
echo -e "  ${Y}pm2 logs${N}         — live log output"
echo -e "  ${Y}pm2 restart all${N}  — restart both services"
echo -e "  ${Y}./start.sh${N}       — pull updates and restart"
echo ""
