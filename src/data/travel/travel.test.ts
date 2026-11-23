import { describe, expect, it } from 'vitest';
import { lessonCode } from '../line';
import { chunkRomaji, hasWrittenForm, p } from './build';
import { TRAVEL_DECK } from './index';

const deck = TRAVEL_DECK;
const phrases = Object.values(deck.words);
const HAN = /\p{Script=Han}/u;

describe('travel phrase helper', () => {
  it('builds big kana, the written form and romaji from one markup', () => {
    const x = p('t', '{切符|きっぷ}は どこ/で {買|か}えますか？', 'ซื้อตั๋วได้ที่ไหน');
    expect(x.kana).toBe('きっぷは どこで かえますか？');
    expect(x.written).toBe('切符はどこで買えますか？');
    expect(x.romaji).toBe('kippu wa doko de kaemasu ka?');
    expect(x.kanaSentence.chunks.length).toBe(3);
    expect(x.kind).toBe('say');
    expect(hasWrittenForm(x)).toBe(true);
    expect(hasWrittenForm(p('u', 'いくらですか？', 'ราคาเท่าไร'))).toBe(false);
  });

  it('reads particles by sound and splits desu / ka / commas', () => {
    expect(chunkRomaji('これを')).toBe('kore o');
    expect(chunkRomaji('こちらへ')).toBe('kochira e');
    expect(chunkRomaji('いくらですか')).toBe('ikura desu ka');
    expect(chunkRomaji('ありますか')).toBe('arimasu ka');
    expect(chunkRomaji('はい、どうぞ')).toBe('hai, douzo');
    expect(chunkRomaji('しんじゅく/まで')).toBe('shinjuku made');
    expect(chunkRomaji('ごちそうさまでした')).toBe('gochisousama deshita');
    expect(p('k', 'こんにちは。', 'x', { romaji: 'konnichiwa' }).romaji).toBe('konnichiwa');
  });
});

describe('travel deck', () => {
  it('has stable ids, station-sized lessons and segments opened in order', () => {
    for (const [key, x] of Object.entries(deck.words)) expect(x.id).toBe(key);
    for (const l of deck.lessons) {
      expect(l.words.length, l.id).toBeGreaterThanOrEqual(5);
      expect(l.words.length, l.id).toBeLessThanOrEqual(8);
      const kinds = l.words.map((id) => deck.words[id]!.kind);
      // บทป้ายเป็นป้ายล้วน · บทอื่นต้องมีประโยคที่พูดอย่างน้อย 3 วลี (ข้อ "ควรพูดว่าอะไร" ต้องมีตัวเลือกพอ)
      if (kinds.includes('sign')) expect(kinds.every((k) => k === 'sign'), `${l.id} ป้ายต้องอยู่บทป้ายล้วน`).toBe(true);
      else expect(kinds.filter((x) => x === 'say').length, `${l.id} ต้องมีประโยคที่พูดอย่างน้อย 3 วลี`).toBeGreaterThanOrEqual(3);
    }
    expect(lessonCode(deck, deck.lessons[0]!)).toBe('T01');
    const open = deck.segments.map((s) => s.lessons.length > 0);
    expect(open.indexOf(false) === -1 || !open.slice(open.indexOf(false)).includes(true)).toBe(true);
    expect(deck.segments.length).toBe(10);
  });

  it('gives every phrase its own Thai meaning (used as answer choices)', () => {
    const thai = phrases.map((x) => x.thai);
    expect(thai.filter((t, i) => thai.indexOf(t) !== i)).toEqual([]);
  });

  it('only lists phrases that exist as interchangeable (avoid)', () => {
    for (const x of phrases) for (const id of x.avoid ?? []) expect(deck.words[id], `${x.id} → ${id}`).toBeTruthy();
  });

  it('writes kanji with readings, kana without kanji, and romaji in plain letters', () => {
    for (const x of phrases) {
      for (const seg of x.sentence.segs) if (HAN.test(seg.text)) expect(seg.ruby, `${x.id}: ${seg.text}`).toBeTruthy();
      expect(HAN.test(x.kana), x.id).toBe(false);
      expect(x.kana.includes('/') || x.written.includes('/'), x.id).toBe(false);
      expect(x.romaji, x.id).toMatch(/^[a-z][a-z ,'?!-]*$/);
      expect(x.romaji, x.id).not.toMatch(/ {2}/);
      if (x.kind === 'sign') {
        // ป้าย: ตัวหนังสือบนป้ายสั้นๆ ไม่มีเครื่องหมายท้าย และมีคันจิให้อ่าน
        expect(x.sentence.end, x.id).toBe('');
        expect(HAN.test(x.written), x.id).toBe(true);
        expect(x.kanaSentence.chunks.length, x.id).toBe(1);
      } else expect(x.sentence.end, `${x.id} ต้องมี 。 หรือ ？ ท้ายวลี`).not.toBe('');
    }
  });

  it('only offers word-order puzzles with 3+ pieces from phrases we say', () => {
    for (const x of phrases) {
      if (!x.arrange) continue;
      expect(x.kind, x.id).toBe('say');
      expect(x.kanaSentence.chunks.length, x.id).toBeGreaterThanOrEqual(3);
    }
  });
});
