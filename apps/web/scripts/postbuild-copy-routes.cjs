#!/usr/bin/env node
// Copy source api route files into build/server/src/app/api so the runtime scanner can locate them
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const projectRoot = path.resolve(__dirname, '..');
const apiSrc = path.join(projectRoot, 'src', 'app', 'api');
const apiDest = path.join(projectRoot, 'build', 'server', 'src', 'app', 'api');
try {
  copyDir(apiSrc, apiDest);
  console.log('[postbuild] Copied API routes to build output');
} catch (e) {
  console.warn('[postbuild] Warning copying API routes:', e.message);
}
