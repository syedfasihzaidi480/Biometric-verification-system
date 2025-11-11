#!/usr/bin/env bash
set -euo pipefail

echo "[build] PWD: $(pwd)"
echo "[build] Node version: $(node -v || true)"
echo "[build] Listing top-level directories:"; ls -1 || true

# If apps/web exists, always build only that directory to avoid copying unrelated workspace node_modules.
if [ -d "apps/web" ]; then
  cd apps/web
  echo "[build] Entered apps/web"
  echo "[build] Installing dependencies (production)"
  npm install --legacy-peer-deps
  echo "[build] Running build script"
  npm run build
  echo "[build] Build finished successfully"
  exit 0
fi

echo "[build] ERROR: apps/web directory not found. Cannot proceed." >&2
exit 1
