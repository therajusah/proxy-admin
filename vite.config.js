import {defineConfig} from 'vite';
import {resolve} from 'node:path';

export default defineConfig({
  // Served at the root of its own service (was '/admin/assets/' in the monorepo).
  base: '/',
  root: __dirname,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsDir: '',
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
