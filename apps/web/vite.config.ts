import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['@bingoblitz/shared'] },
  build: { commonjsOptions: { include: [/node_modules/, /packages\/shared\/dist/] } },
  server: {
    port: 8080,
    host: '127.0.0.1',
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/socket.io': { target: 'http://127.0.0.1:3001', ws: true }
    }
  }
});
