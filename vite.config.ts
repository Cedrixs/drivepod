import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/drivepod/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      includeAssets: ['icons/*.svg', 'icons/*.png', 'favicon.ico'],
      manifest: {
        name: 'Drivepod',
        short_name: 'Drivepod',
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
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
