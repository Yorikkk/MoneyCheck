import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'MoneyCheck — Семейные расходы',
        short_name: 'MoneyCheck',
        description: 'Приложение для учёта семейных расходов',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        navigateFallback: '/MoneyCheck/',
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  base: '/MoneyCheck/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})