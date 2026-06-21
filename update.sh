#!/usr/bin/env bash
#
# Hearth — pull latest and rebuild (data is preserved)
# Usage:  ./update.sh
#
set -euo pipefail
GREEN='\033[0;32m'; DIM='\033[2m'; NC='\033[0m'
say() { echo -e "${GREEN}▸${NC} $1"; }

HOST_PORT="${HOST_PORT:-3002}"

say "Fetching latest version…"
git pull --ff-only

say "Rebuilding… ${DIM}(your ./data database is untouched)${NC}"
HOST_PORT="$HOST_PORT" docker compose up -d --build

say "Done. Open http://localhost:${HOST_PORT}/finance"
