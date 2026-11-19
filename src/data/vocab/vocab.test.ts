import { describe, expect, it } from 'vitest';
import { hiraganaStrokes, katakanaStrokes } from '../../features/writing/engine/testUtils';
import { kanaOf, lessonCode, vocabDecks } from './index';
import { N5_DECK } from './n5';
import { LOANWORD_SMALL_KANA } from './romaji';

const strokeChars = new Set([...Object.keys(hiraganaStrokes.chars), ...Object.keys(katakanaStrokes.chars)]);

describe.each(vocabDecks.map((d) => [d.id, d] as const))('vocab deck %s', (_id, deck) => {
  const all = Object.values(deck.words);

  it('has stable, unique ids and every word sits in exactly one lesson', () => {
    expect(new Set(deck.lessons.map((l) => l.id)).size).toBe(deck.lessons.length);
    for (const [key, w] of Object.entries(deck.words)) expect(w.id).toBe(key);
    const used = deck.lessons.flatMap((l) => l.words);
    expect(new Set(used).size).toBe(used.length);
    for (const id of used) expect(deck.words[id], `lesson uses unknown word ${id}`).toBeDefined();
    expect(used.length).toBe(all.length);
  });

  it('keeps lessons station-sized (4–10 words, enough for 4-choice questions)', () => {
    for (const l of deck.lessons) {
      expect(l.words.length, l.id).toBeGreaterThanOrEqual(4);
      expect(l.words.length, l.id).toBeLessThanOrEqual(10);
    }
  });

  it('opens segments in order, so station codes of open lessons never shift', () => {
    const open = deck.segments.map((s) => s.lessons.length > 0);
    expect(open.indexOf(false) === -1 || !open.slice(open.indexOf(false)).includes(true)).toBe(true);
    expect(deck.segments.flatMap((s) => s.lessons)).toEqual(deck.lessons);
  });

  it('writes words only with kana that have stroke data (or loanword small kana, never hand-written)', () => {
    for (const w of all) {
      for (const ch of kanaOf(w)) {
        expect(strokeChars.has(ch) || LOANWORD_SMALL_KANA.includes(ch), `${w.id}: ${ch}`).toBe(true);
      }
    }
  });

  it('keeps romaji plain lowercase and kanji forms really containing kanji', () => {
    for (const w of all) {
      expect(w.romaji, w.id).toMatch(/^[a-z']+( [a-z']+)*$/);
      if (w.kanji) expect(w.kanji, w.id).toMatch(/\p{Script=Han}/u);
      expect(w.thai.trim(), w.id).not.toBe('');
      expect(w.thai, `${w.id}: เครื่องหมาย / ใช้คั่นความหมายย่อย ต้องมีช่องว่างสองข้าง`).not.toMatch(/\S\/|\/\S/);
    }
  });

  it('numbers stations from 01', () => {
    expect(lessonCode(deck, deck.lessons[0]!)).toBe(`${deck.letter}01`);
  });
});

describe('N5 deck', () => {
  it('keeps every word and lesson id that was ever published (progress is keyed by them)', () => {
    // ห้ามลบ/เปลี่ยน id ในรายการนี้ — เพิ่มได้อย่างเดียว
    const lessons = ['greetings', 'numbers-1', 'people', 'family', 'food-1'];
    const words =
      'ohayou-gozaimasu konnichiwa konbanwa sayounara arigatou-gozaimasu sumimasen hai iie ichi ni san yon go roku nana hachi kyuu juu watashi anata hito otoko onna tomodachi sensei gakusei otousan okaasan oniisan oneesan otouto imouto kazoku kodomo mizu ocha gohan pan niku sakana yasai kudamono'.split(
        ' ',
      );
    for (const id of lessons) expect(N5_DECK.lessons.some((l) => l.id === id), id).toBe(true);
    for (const id of words) expect(N5_DECK.words[id], id).toBeDefined();
  });

  it('has every segment open and the whole N5 list (673 cards for 684 source rows, see docs/n5-vocab-plan.md)', () => {
    expect(N5_DECK.segments.every((s) => s.lessons.length > 0)).toBe(true);
    expect(Object.keys(N5_DECK.words).length).toBeGreaterThanOrEqual(673);
  });

  it('spells romaji from kana, with phrase overrides only where は is read wa or words are spaced', () => {
    const r = (id: string) => N5_DECK.words[id]!.romaji;
    expect(r('konnichiwa')).toBe('konnichiwa');
    expect(r('ohayou-gozaimasu')).toBe('ohayou gozaimasu');
    expect(r('gyuunyuu')).toBe('gyuunyuu');
    expect(r('mittsu')).toBe('mittsu');
    expect(r('koohii')).toBe('koohii');
    expect(r('fooku')).toBe('fooku');
  });
});
