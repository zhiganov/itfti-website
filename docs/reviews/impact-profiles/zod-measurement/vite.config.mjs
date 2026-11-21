import { fileURLToPath } from 'node:url';

// Builds the measurement page from the app's pinned packages, without adding a package here.
const modules = fileURLToPath(new URL('../../../../app/node_modules/', import.meta.url));
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  logLevel: 'warn',
  resolve: { alias: [{ find: /^(@atproto(?:-labs)?\/.*)$/, replacement: `${modules}$1` }] },
  build: { outDir: 'dist', emptyOutDir: true },
};
