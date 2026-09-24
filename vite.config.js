import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/.netlify/functions': {
        target: 'https://bangai.netlify.app',
        changeOrigin: true
      },
      '/api': {
        target: 'https://bangai.netlify.app',
        changeOrigin: true
      }
    }
  }
});
