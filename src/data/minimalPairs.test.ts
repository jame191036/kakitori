import { describe, expect, it } from 'vitest';
import { MINIMAL_PAIRS } from './minimalPairs';

const SMALL_Y = /[ゃゅょャュョ]/;
const VOWEL = 'aiueo';

describe('minimal pairs (っ / long vowel / yoon lesson)', () => {
  it('has unique words and enough pairs for one listening round', () => {
    const words = MINIMAL_PAIRS.flatMap((p) => [p.plain.kana, p.marked.kana]);
    expect(new Set(words).size).toBe(words.length);
    expect(MINIMAL_PAIRS.length).toBeGreaterThanOrEqual(8);
  });

  it('writes romaji in lower-case letters only', () => {
    for (const p of MINIMAL_PAIRS) {
      for (const w of [p.plain, p.marked]) expect(w.romaji, w.kana).toMatch(/^[a-z]+$/);
    }
  });

  it('differs only by the feature the lesson teaches', () => {
    for (const { kind, plain, marked } of MINIMAL_PAIRS) {
      const label = `${plain.kana} / ${marked.kana}`;
      if (kind === 'sokuon') {
        expect(marked.kana, label).toContain('っ');
        expect(plain.kana, label).not.toContain('っ');
        // ลบ っ ออกแล้วต้องเท่ากับอีกคำ · โรมาจิมีพยัญชนะซ้ำ
        expect(marked.kana.replace('っ', ''), label).toBe(plain.kana);
        expect(marked.romaji, label).toMatch(/([bcdfghjkmnprstwz])\1/);
      }
      if (kind === 'yoon') {
        expect(marked.kana, label).toMatch(SMALL_Y);
        expect(plain.kana, label).not.toMatch(SMALL_Y);
        expect(marked.kana.length, label).toBe(plain.kana.length);
      }
      if (kind === 'long') {
        // คำยาวมีตัวเพิ่มมา 1 ตัว (สระซ้ำ หรือ ー) และโรมาจิมีสระเพิ่ม 1 ตัว
        expect([...marked.kana].length, label).toBe([...plain.kana].length + 1);
        expect(marked.romaji.length, label).toBe(plain.romaji.length + 1);
        const extra = [...marked.romaji].find((ch, i) => ch !== plain.romaji[i]);
        expect(VOWEL, label).toContain(extra);
      }
    }
  });
});
