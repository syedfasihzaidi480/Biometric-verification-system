#!/usr/bin/env node
// Copy source api route files into build/server/src/app/api so the runtime scanner can locate them
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const buildSrcRoot = path.join(projectRoot, 'build', 'server', 'src');
const transformableExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);

function resolveAliasTarget(destFile, subpath) {
  const destDir = path.dirname(destFile);
  let relative = path.relative(destDir, buildSrcRoot).split(path.sep).join('/');

  if (!relative) {
    relative = '.';
  }
  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }

  const prefix = relative === '.' ? './' : relative.endsWith('/') ? relative : `${relative}/`;
  const combined = `${prefix}${subpath}`
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/');

  return combined.startsWith('.') ? combined : `./${combined}`;
}

function transformAliasesIfNeeded(srcFile, destFile) {
  const ext = path.extname(srcFile);
  if (!transformableExtensions.has(ext)) {
    fs.copyFileSync(srcFile, destFile);
    return;
  }

  const contents = fs.readFileSync(srcFile, 'utf8');
  const updated = contents.replace(/(["'`])@\/([^"'`]+)\1/g, (match, quote, subpath) => {
    const target = resolveAliasTarget(destFile, subpath);
    return `${quote}${target}${quote}`;
  });

  fs.writeFileSync(destFile, updated, 'utf8');
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      transformAliasesIfNeeded(s, d);
    }
  }
}

const apiSrc = path.join(projectRoot, 'src', 'app', 'api');
const apiDest = path.join(buildSrcRoot, 'app', 'api');

try {
  copyDir(apiSrc, apiDest);
  console.log('[postbuild] Copied API routes to build output');
} catch (e) {
  console.warn('[postbuild] Warning copying API routes:', e.message);
}
