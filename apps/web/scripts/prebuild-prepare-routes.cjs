#!/usr/bin/env node
// Prebuild: create the directory that the server runtime will scan for route files
// so that react-router-hono-server's build-time route registration can succeed.
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

try {
  const projectRoot = path.resolve(__dirname, '..');
  const apiSrc = path.join(projectRoot, 'src', 'app', 'api');
  const apiDest = path.join(projectRoot, 'build', 'server', 'src', 'app', 'api');
  // Clean any previous build remnants to avoid stale route modules
  if (fs.existsSync(path.join(projectRoot, 'build'))) {
    // Only remove server/src/app/api subtree if present
    const existing = path.join(projectRoot, 'build', 'server', 'src', 'app', 'api');
    if (fs.existsSync(existing)) {
      fs.rmSync(existing, { recursive: true, force: true });
    }
  }
  copyDir(apiSrc, apiDest);
  console.log('[prebuild] Prepared route directory at', apiDest);
} catch (e) {
  console.warn('[prebuild] Failed to prepare route directory:', e.message);
}
