#!/usr/bin/env bash
#
# Hearth — one-command installer
# Usage:  ./install.sh
#
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; DIM='\033[2m'; NC='\033[0m'
say()  { echo -e "${GREEN}▸${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
die()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo ""
echo -e "${GREEN}  Hearth — Family Finance${NC}"
echo -e "${DIM}  self-hosted household budgeting${NC}"
echo ""

# ── checks ───────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "Docker not found. Install Docker Desktop first: https://docker.com"
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 not found. Update Docker Desktop."
docker info >/dev/null 2>&1 || die "Docker isn't running. Start Docker Desktop and re-run."

HOST_PORT="${HOST_PORT:-3002}"

# ── port check ───────────────────────────────────────────
if lsof -nP -iTCP:"$HOST_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  warn "Port $HOST_PORT is already in use."
  warn "Set a different one:  HOST_PORT=3005 ./install.sh"
  die  "Aborting so nothing gets clobbered."
fi

# ── data dir ─────────────────────────────────────────────
mkdir -p data
say "Data directory ready  ${DIM}(./data — your database lives here)${NC}"

# ── build & start ────────────────────────────────────────
say "Building containers… ${DIM}(first run pulls images, ~2–4 min)${NC}"
HOST_PORT="$HOST_PORT" docker compose up -d --build

# ── wait for health ──────────────────────────────────────
say "Waiting for the app to come up…"
for i in $(seq 1 30); do
  if curl -fs "http://localhost:${HOST_PORT}/api/health" >/dev/null 2>&1; then
    echo ""
    say "${GREEN}Hearth is live!${NC}"
    echo ""
    echo -e "   Open  ${GREEN}http://localhost:${HOST_PORT}/finance${NC}"
    echo -e "   ${DIM}On your network:  http://$(ipconfig getifaddr en0 2>/dev/null || echo 'YOUR-IP'):${HOST_PORT}/finance${NC}"
    echo ""
    echo -e "   ${DIM}Update later:   ./update.sh${NC}"
    echo -e "   ${DIM}Stop:           docker compose down${NC}"
    echo -e "   ${DIM}Logs:           docker compose logs -f${NC}"
    echo ""
    exit 0
  fi
  sleep 2
done

warn "App didn't respond in time. Check logs:  docker compose logs -f"
exit 1
