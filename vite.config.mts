import { defineConfig, type Plugin } from 'vitest/config';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Legacy classic scripts, styles and media live in the repository root (they must not be renamed).
 *  Vite bundles only src/main.ts; this plugin copies everything else into dist/ unchanged. */
const NOT_LEGACY = new Set(['server.js', 'eslint.config.mjs', 'tools_check_syntax.js', 'tools_fetch_three.js', 'vite.config.mts']);
const LEGACY_EXT = /\.(js|css|mp3|png|webmanifest)$/;

function legacyAssets(): Plugin {
  return {
    name: 'cowball-legacy-assets',
    apply: 'build',
    closeBundle() {
      const out = 'dist';
      mkdirSync(out, { recursive: true });
      for (const f of readdirSync('.')) {
        if (NOT_LEGACY.has(f) || !LEGACY_EXT.test(f)) continue;
        cpSync(f, join(out, f));
      }
      // Real Three.js r128 next to index.html (three-loader.js looks for ./three.min.js first). Comes from devDependencies, so no CDN is needed.
      const three = 'node_modules/three/build/three.min.js';
      if (!existsSync(join(out, 'three.min.js')) && existsSync(three)) cpSync(three, join(out, 'three.min.js'));
      // index.html: dev uses /src/main.ts, the build uses the library file.
      const html = readFileSync('index.html', 'utf8').replace('src="/src/main.ts"', 'src="cowball-v2.js"');
      writeFileSync(join(out, 'index.html'), html);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [legacyAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: () => 'cowball-v2.js' },
  },
  worker: { format: 'es', rollupOptions: { output: { entryFileNames: 'assets/[name].js' } } },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
