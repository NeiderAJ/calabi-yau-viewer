import { defineConfig } from 'vite';

export default defineConfig({
  base: '/calabi-yau-viewer/',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
