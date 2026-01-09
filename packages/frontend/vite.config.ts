import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@restaurant-reservation/shared': path.resolve(__dirname, '../shared/dist/index.js'),
    },
  },
  optimizeDeps: {
    include: ['@restaurant-reservation/shared'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/shared/, /node_modules/],
    },
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});

