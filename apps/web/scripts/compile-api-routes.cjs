#!/usr/bin/env node
// Compile API route files from src/app/api into build/server/src/app/api
// with ESM output targeting Node 18. This prepares files for runtime
// route scanning without relying on Vite to import source files directly.
const path = require('node:path');
const fs = require('node:fs');
let esbuild, fg;
try {
  esbuild = require('esbuild');
} catch (e) {
  console.error('[compile-api-routes] esbuild not installed');
  process.exit(1);
}
try {
  fg = require('fast-glob');
} catch (e) {
  console.error('[compile-api-routes] fast-glob not installed');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const srcApiRoot = path.join(projectRoot, 'src', 'app', 'api');
const outApiRoot = path.join(projectRoot, 'build', 'server', 'src', 'app', 'api');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

(async () => {
  try {
    // Clean previous compiled api
    if (fs.existsSync(outApiRoot)) {
      fs.rmSync(outApiRoot, { recursive: true, force: true });
    }
    ensureDir(outApiRoot);

    // Discover route entries; skip internal testing routes that rely on special build paths
  const entries = await fg(['**/route.js', '**/route.ts', '**/route.jsx', '**/route.tsx'], {
      cwd: srcApiRoot,
      dot: false,
      ignore: ['**/__create/**', '**/ssr-test/**'],
    });

    if (entries.length === 0) {
      console.log('[compile-api-routes] No route files found.');
      process.exit(0);
    }

    // Build all routes, preserving directory structure under outApiRoot
    const aliasSrc = path.join(projectRoot, 'src');

    const pluginAliasAt = {
      name: 'alias-at',
      setup(build) {
        build.onResolve({ filter: /^@\// }, args => {
          const rel = args.path.replace(/^@\//, '');
          const resolved = path.join(aliasSrc, rel);
          return { path: resolved };
        });
      },
    };

    await Promise.all(
      entries.map(async (rel) => {
        const abs = path.join(srcApiRoot, rel);
        const outdir = path.dirname(path.join(outApiRoot, rel));
        ensureDir(outdir);
        const result = await esbuild.build({
          entryPoints: [abs],
          outdir,
          bundle: true,
          platform: 'node',
          target: ['node18'],
          format: 'esm',
          sourcemap: false,
          logLevel: 'silent',
          plugins: [pluginAliasAt],
          external: ['mongodb','ws','argon2','pdfjs-dist','stripe'],
        }).catch(err => {
          console.error('[compile-api-routes] Failed building', rel, err.message);
          throw err;
        });
        if (result && result.errors?.length) {
          console.error('[compile-api-routes] Errors in', rel, result.errors);
        }
      })
    );

    console.log(`[compile-api-routes] Compiled ${entries.length} route file(s) -> ${outApiRoot}`);
  } catch (e) {
    console.error('[compile-api-routes] Failed:', e);
    process.exit(1);
  }
})();
