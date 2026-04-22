import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/HelloWidget.tsx'),
      formats: ['es'],
      fileName: () => 'HelloWidget.js',
    },
    outDir: 'ui',
    emptyOutDir: false,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@elton/plugin-sdk'],
    },
    minify: false,
  },
});
