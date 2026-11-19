import { describe, expect, it } from 'vitest';
import { hiraganaStrokes, katakanaStrokes } from '../../features/writing/engine/testUtils';
import { kanaOf, lessonCode, vocabDecks } from './index';

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

  it('gives each lesson enough words for 4-choice questions', () => {
    for (const l of deck.lessons) expect(l.words.length).toBeGreaterThanOrEqual(4);
  });

  it('writes words only with kana that have stroke data (for the writing exercise)', () => {
    for (const w of all) {
      for (const ch of kanaOf(w)) expect(strokeChars.has(ch), `${w.id}: ${ch}`).toBe(true);
    }
  });

  it('keeps romaji plain lowercase and kanji forms really containing kanji', () => {
    for (const w of all) {
      expect(w.romaji, w.id).toMatch(/^[a-z]+( [a-z]+)*$/);
      if (w.kanji) expect(w.kanji, w.id).toMatch(/\p{Script=Han}/u);
      expect(w.thai.trim(), w.id).not.toBe('');
    }
  });

  it('numbers stations from 01', () => {
    expect(lessonCode(deck, deck.lessons[0]!)).toBe(`${deck.letter}01`);
  });
});
