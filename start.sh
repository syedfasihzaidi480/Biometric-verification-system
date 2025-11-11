#!/usr/bin/env bash
set -euo pipefail

# Attempt to run from apps/web if present; else assume we are already in that directory.
if [ -d "apps/web" ]; then
  cd apps/web
fi

if [ ! -f "package.json" ]; then
  echo "[start] ERROR: package.json not found. Ensure Root Directory is set to repo root or apps/web." >&2
  exit 1
fi

# Ensure build artifacts exist; if not, build them.
if [ ! -f "build/server/index.js" ]; then
  echo "[start] Server build not found. Running build first."
  npm install --legacy-peer-deps
  npm run build
fi

echo "[start] Starting server..."
exec npm start
