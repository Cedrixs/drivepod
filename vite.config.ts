import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/drivepod/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png', 'favicon.ico'],
      manifest: {
        name: 'DrivePod',
        short_name: 'DrivePod',
        description: 'Lecteur audio pour Google Drive',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/drivepod/',
        start_url: '/drivepod/',
        icons: [
          {
            src: '/drivepod/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/drivepod/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/drivepod/icons/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/drivepod/index.html',
        navigateFallbackDenylist: [/^\/api/, /\?code=/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/accounts\.google\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/oauth2\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/drive\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'drive-api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.googleusercontent\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: { statuses: [0, 200, 206] },
              rangeRequests: true,
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
