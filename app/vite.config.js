import { defineConfig } from 'vite';
import { clientMetadata, DEFAULT_ORIGIN } from './src/config.js';
import { readFileSync } from 'node:fs';

const origin = process.env.ITF_APP_ORIGIN ||
  (process.env.CONTEXT === 'deploy-preview' && process.env.DEPLOY_PRIME_URL) ||
  DEFAULT_ORIGIN;
const metadata = JSON.stringify(clientMetadata(origin), null, 2);
const schema = readFileSync(new URL('./lexicons/org.itfti.profile.json', import.meta.url));
const seal = readFileSync(new URL('../public/itfti-seal.svg', import.meta.url));
const assets = {
  '/client-metadata.json': { source: metadata, type: 'application/json' },
  '/lexicons/org.itfti.profile.json': { source: schema, type: 'application/json' },
  '/itfti-seal.svg': { source: seal, type: 'image/svg+xml' },
  '/licenses/itfti-profile-app.txt': {
    source: readFileSync(new URL('./LICENSE', import.meta.url)), type: 'text/plain',
  },
  '/licenses/zilla-slab.txt': {
    source: readFileSync(new URL('./node_modules/@fontsource/zilla-slab/LICENSE', import.meta.url)), type: 'text/plain',
  },
  '/licenses/libre-franklin.txt': {
    source: readFileSync(new URL('./node_modules/@fontsource/libre-franklin/LICENSE', import.meta.url)), type: 'text/plain',
  },
};

export default defineConfig({
  define: { 'import.meta.env.VITE_APP_ORIGIN': JSON.stringify(origin) },
  server: { port: 4175, strictPort: true },
  preview: { port: 4175, strictPort: true },
  plugins: [{
    name: 'itfti-public-metadata',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Let Vite transform JSON module imports; only serve the plain public URL.
        if (req.url?.includes('?')) return next();
        const asset = assets[req.url?.split('?')[0]];
        if (!asset) return next();
        res.setHeader('Content-Type', asset.type);
        res.end(asset.source);
      });
    },
    generateBundle() {
      for (const [path, asset] of Object.entries(assets)) {
        this.emitFile({ type: 'asset', fileName: path.slice(1), source: asset.source });
      }
    },
  }],
  build: { sourcemap: false },
});
