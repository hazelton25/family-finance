import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',  // assets always relative to root inside container
  define: {
    // This gets replaced at build time - empty string means use relative /api
    // In production behind /finance, nginx strips the prefix so /api works
    __API_BASE__: JSON.stringify('/api'),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
});
