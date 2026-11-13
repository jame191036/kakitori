import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// สร้างไอคอน PWA ทั้งหมดจาก public/logo.svg:  npm run icons
const background = '#d9462b';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background } },
  },
  images: ['public/logo.svg'],
});
