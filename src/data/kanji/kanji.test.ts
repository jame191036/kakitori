import { describe, expect, it } from 'vitest';
import { kanjiN5Strokes } from '../../features/writing/engine/testUtils';
import { lessonCode } from '../line';
import { N5_DECK } from '../vocab/n5';
import { KANJI_N5, KANJI_N5_ALL } from './n5';

const deck = KANJI_N5;
const all = Object.values(deck.words);

describe('kanji N5 deck', () => {
  it('lists the 103 N5 kanji once each, all with KanjiVG stroke data', () => {
    const list = [...KANJI_N5_ALL];
    expect(list).toHaveLength(103);
    expect(new Set(list).size).toBe(103);
    for (const c of list) expect(kanjiN5Strokes.chars[c], c).toBeDefined();
    for (const e of all) expect(list, e.char).toContain(e.char);
  });

  it('uses the kanji itself as a stable id, one lesson per kanji, station-sized lessons', () => {
    for (const [key, e] of Object.entries(deck.words)) {
      expect(e.id).toBe(key);
      expect(e.char).toBe(key);
    }
    const used = deck.lessons.flatMap((l) => l.words);
    expect(new Set(used).size).toBe(used.length);
    expect(used.length).toBe(all.length);
    for (const l of deck.lessons) {
      expect(l.words.length, l.id).toBeGreaterThanOrEqual(4);
      expect(l.words.length, l.id).toBeLessThanOrEqual(10);
    }
    expect(lessonCode(deck, deck.lessons[0]!)).toBe('KJ01');
  });

  it('teaches all 103 kanji with every segment open', () => {
    expect(deck.segments.every((s) => s.lessons.length > 0)).toBe(true);
    expect(all.map((e) => e.char).sort()).toEqual([...KANJI_N5_ALL].sort());
  });

  it('opens segments in order, so station codes of open lessons never shift', () => {
    const open = deck.segments.map((s) => s.lessons.length > 0);
    expect(open.indexOf(false) === -1 || !open.slice(open.indexOf(false)).includes(true)).toBe(true);
  });

  it('matches the KANJIDIC2 stroke count with the KanjiVG stroke data', () => {
    for (const e of all) expect(kanjiN5Strokes.chars[e.char]!.strokes.length, e.char).toBe(e.strokes);
  });

  it('gives readings in hiragana with example words that really contain the kanji', () => {
    for (const e of all) {
      expect(e.thai.trim(), e.char).not.toBe('');
      expect(e.thai, `${e.char}: เครื่องหมาย / ต้องมีช่องว่างสองข้าง`).not.toMatch(/\S\/|\/\S/);
      for (const r of e.readings) {
        expect(r.kana, e.char).toMatch(/^[ぁ-ゖ・()]+$/u);
        expect(['on', 'kun'], e.char).toContain(r.kind);
        // รูปคำอ่าน (รวมเสียงที่เปลี่ยน เช่น ひ・び) ต้องได้ยินจริงในคำตัวอย่าง
        const forms = r.kana.split('・').map((f) => f.replace(/\(.*\)/, ''));
        for (const id of r.words) {
          const w = N5_DECK.words[id];
          expect(w, `${e.char}: ไม่พบคำ ${id}`).toBeDefined();
          expect(w!.kanji ?? '', `${e.char}: คำ ${id}`).toContain(e.char);
          expect(
            forms.some((f) => w!.kana.includes(f)),
            `${e.char} ${r.kana}: ไม่มีเสียงนี้ใน ${w!.kana}`,
          ).toBe(true);
        }
      }
      for (const id of e.special ?? []) {
        expect(N5_DECK.words[id]?.kanji ?? '', `${e.char}: คำอ่านพิเศษ ${id}`).toContain(e.char);
      }
      for (const x of e.extra ?? []) expect(x.written, e.char).toContain(e.char);
      // ทุกตัวต้องมีตัวอย่างให้เห็นอย่างน้อย 1 อย่าง
      const examples = e.readings.flatMap((r) => r.words).length + (e.special?.length ?? 0) + (e.extra?.length ?? 0);
      expect(examples, e.char).toBeGreaterThan(0);
    }
  });
});
