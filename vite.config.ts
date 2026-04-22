import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    // React's bundle checks process.env.NODE_ENV; Vite library mode doesn't
    // define it by default. Pin to 'production' for the distributed bundle.
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/HelloWidget.tsx'),
      formats: ['es'],
      fileName: () => 'HelloWidget.js',
    },
    outDir: 'ui',
    emptyOutDir: false,
    rollupOptions: {
      external: [],
    },
    minify: false,
  },
});
