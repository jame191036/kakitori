import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  {
    // ไฟล์ในก้อนหลัก (โหลดตอนเปิดหน้าแรก): ห้าม import ข้อมูลสาย N5 ตรงๆ — ใช้ useLineDecks / loadLineDecks
    // (src/data/lineDecks.ts) ข้อมูลจะได้โหลดแยกเฉพาะตอนต้องใช้
    files: ['src/main.tsx', 'src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}', 'src/pages/HomePage.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '/data/(vocab|kanji|grammar|exam)/n5(/|$)|/data/vocab$|/data/travel(/index)?$',
              allowTypeImports: true,
              message: 'ข้อมูลสาย N5 ต้องโหลดแยก — ใช้ useLineDecks / loadLineDecks จาก src/data/lineDecks.ts',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
]);
