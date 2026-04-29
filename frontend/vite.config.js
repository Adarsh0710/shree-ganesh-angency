import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // port: 5173,
    port: 'https://shree-ganesh-angency.onrender.com',
    proxy: {
      // '/api': { target: 'http://localhost:5000', changeOrigin: true },
      // '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/api': { target: 'https://shree-ganesh-angency.onrender.com', changeOrigin: true },
      '/uploads': { target: 'https://shree-ganesh-angency.onrender.com', changeOrigin: true },
    },
  },
});
