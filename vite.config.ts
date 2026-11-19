import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const APP_NAME = 'kakitori'; // ให้ตรงกับ SITE_NAME ใน src/app/config.ts

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: `${APP_NAME} — ฝึกคัดฮิรางานะ คาตาคานะ`,
        short_name: APP_NAME,
        description: 'ฝึกคัดตัวอักษรภาษาญี่ปุ่นทีละขีด พร้อมแบบทดสอบ ใช้ได้ฟรี ไม่ต้องสมัครสมาชิก',
        lang: 'th',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        // theme = สีหัวเว็บ (--surface) ให้แถบด้านบนของแอปที่ติดตั้งกลืนกับหัวเว็บ · background = สีพื้นหน้าเว็บ (--bg) ตอนเปิดแอป
        theme_color: '#ffffff',
        background_color: '#f4f0e6',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // precache ทุกอย่างรวมฟอนต์ (เฉพาะ woff2 ~220 KB — ดู src/styles/fonts.css)
        // เพื่อให้เปิดครั้งแรกแล้วใช้ออฟไลน์ได้ครบทันที
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
});
