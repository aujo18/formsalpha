import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Inspection Laurentides-Lanaudière (CAMBI)',
        short_name: 'Inspection L-L',
        description: 'Application d\'inspection pour CAMBI',
        theme_color: '#b22a2e',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Garder le chemin /api tel quel
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Erreur proxy:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`🔄 Proxy: ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
          });
        },
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});