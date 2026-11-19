import { describe, expect, it } from 'vitest';
import { KANJI_FONT_CHARS } from './kanjiFontChars';

/** ข้อความของทุกไฟล์ .ts/.tsx ใน src (ยกเว้นเทส) — ชุดเดียวกับที่ scripts/fetch-kanji-font.mjs ใช้ทำฟอนต์ */
const sources = import.meta.glob<string>(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('kanji subset font', () => {
  it('covers every kanji used anywhere in the site (run npm run data:kanji-font after adding new kanji)', () => {
    const covered = new Set(KANJI_FONT_CHARS);
    const missing = new Set<string>();
    for (const text of Object.values(sources)) {
      for (const c of text) if (/\p{Script=Han}/u.test(c) && !covered.has(c)) missing.add(c);
    }
    expect(Object.keys(sources).length).toBeGreaterThan(50);
    expect([...missing].join(''), 'คันจิที่ยังไม่อยู่ในฟอนต์ — รัน npm run data:kanji-font').toBe('');
  });
});
