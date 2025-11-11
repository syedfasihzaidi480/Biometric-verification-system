#!/usr/bin/env bash
set -euo pipefail

if [ -d "apps/web" ]; then
  cd apps/web
fi

if [ ! -f "package.json" ]; then
  echo "[start] ERROR: package.json not found in $(pwd)." >&2
  exit 1
fi

if [ ! -f "build/server/index.js" ]; then
  echo "[start] Server build not found. Installing and building..."
  npm install --legacy-peer-deps
  npm run build
fi

echo "[start] Using PORT=${PORT:-4000}"
echo "[start] Starting server..."
exec npm start
