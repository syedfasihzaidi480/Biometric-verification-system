#!/usr/bin/env bash
set -euo pipefail

# Detect if we are already in apps/web (Root Directory set) or monorepo root.
if [ -f "package.json" ] && [ -d "__create" ] && [ -d "src" ]; then
  echo "[build] Detected apps/web as current working directory"
  echo "[build] Installing dependencies"
  npm install --legacy-peer-deps
  echo "[build] Building web app"
  npm run build
  exit 0
fi

if [ -d "apps/web" ]; then
  echo "[build] Monorepo root detected. Building apps/web backend."
  cd apps/web
  echo "[build] Installing dependencies"
  npm install --legacy-peer-deps
  echo "[build] Building web app"
  npm run build
  echo "[build] Build complete"
  exit 0
fi

echo "[build] ERROR: apps/web not found. Cannot build backend." >&2
exit 1
