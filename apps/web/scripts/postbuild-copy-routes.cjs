#!/usr/bin/env node
// Copy source api route files into build/server/src/app/api so the runtime scanner can locate them.
// While copying, rewrite any '@/…' aliases to relative imports with concrete extensions so Node's ESM loader can resolve them.
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const buildSrcRoot = path.join(projectRoot, 'build', 'server', 'src');
const transformableExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);
const aliasExtensions = ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json'];
const staticAliasMap = {
  '@auth/create': '__create/@auth/create.js',
};
const processedAliasTargets = new Set();

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function ensureRelativeImport(fromDir, targetFile) {
  let relative = toPosix(path.relative(fromDir, targetFile));
  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }
  return relative;
}

function resolveAliasRelativePath(subpath) {
  const explicitExt = path.extname(subpath);
  if (explicitExt) {
    const candidate = path.join(srcRoot, subpath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return toPosix(subpath);
    }
  } else {
    for (const ext of aliasExtensions) {
      const candidate = path.join(srcRoot, `${subpath}${ext}`);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return toPosix(`${subpath}${ext}`);
      }
    }
  }

  const searchExts = explicitExt ? [explicitExt] : aliasExtensions;
  for (const ext of searchExts) {
    const indexCandidate = path.join(srcRoot, subpath, `index${ext}`);
    if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
      return toPosix(path.join(subpath, `index${ext}`));
    }
  }

  return null;
}

function copyAliasTargetIfNeeded(aliasPathWithExt) {
  if (processedAliasTargets.has(aliasPathWithExt)) {
    return;
  }
  const sourceFile = path.join(srcRoot, aliasPathWithExt);
  const destFile = path.join(buildSrcRoot, aliasPathWithExt);

  if (!fs.existsSync(sourceFile) || fs.statSync(sourceFile).isDirectory()) {
    return;
  }

  const destDir = path.dirname(destFile);
  fs.mkdirSync(destDir, { recursive: true });
  processedAliasTargets.add(aliasPathWithExt);
  transformAliasesIfNeeded(sourceFile, destFile);
}

function transformAliasesIfNeeded(srcFile, destFile) {
  const ext = path.extname(srcFile);
  if (!transformableExtensions.has(ext)) {
    fs.copyFileSync(srcFile, destFile);
    return;
  }

  const contents = fs.readFileSync(srcFile, 'utf8');
  const updated = contents
    .replace(/(["'`])@\/([^"'`]+)\1/g, (match, quote, subpath) => {
      const aliasTarget = resolveAliasRelativePath(subpath);
      if (!aliasTarget) {
        return match;
      }

      copyAliasTargetIfNeeded(aliasTarget);
      const targetAbsolute = path.join(buildSrcRoot, aliasTarget);
      const destDir = path.dirname(destFile);
      const relativeImport = ensureRelativeImport(destDir, targetAbsolute);
      return `${quote}${relativeImport}${quote}`;
    })
    .replace(/(["'`])@auth\/create\1/g, (match, quote) => {
      const aliasTarget = staticAliasMap['@auth/create'];
      if (!aliasTarget) {
        return match;
      }

      copyAliasTargetIfNeeded(aliasTarget);
      const targetAbsolute = path.join(buildSrcRoot, aliasTarget);
      const destDir = path.dirname(destFile);
      const relativeImport = ensureRelativeImport(destDir, targetAbsolute);
      return `${quote}${relativeImport}${quote}`;
    });

  fs.writeFileSync(destFile, updated, 'utf8');
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('__create')) {
      continue;
    }
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

const apiSrc = path.join(srcRoot, 'app', 'api');
const apiDest = path.join(buildSrcRoot, 'app', 'api');

try {
  copyDir(apiSrc, apiDest);
  console.log('[postbuild] Copied API routes to build output');
} catch (error) {
  console.warn('[postbuild] Warning copying API routes:', error.message);
}
