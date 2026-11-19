import { describe, expect, it } from 'vitest';
import { KANJI_N5 } from '../../data/kanji/n5';
import { lessonWords } from '../../data/line';
import { N5_DECK } from '../../data/vocab/n5';
import { meaningsOverlap } from '../vocab/vocabLogic';
import { rng } from '../writing/engine/testUtils';
import {
  practiceQuestions,
  readingChoicesFor,
  reviewQuestions,
  testQuestions,
  type KanjiQuestion,
} from './kanjiLogic';

const deck = KANJI_N5;

function expectSound(q: KanjiQuestion) {
  if (q.type === 'meaningToKanji' || q.type === 'kanjiToMeaning') {
    expect(q.choices, q.id).toHaveLength(4);
    expect(new Set(q.choices.map((c) => c.id)).size, q.id).toBe(4);
    expect(q.choices, q.id).toContain(q.kanji);
    // ตัวหลอกต้องไม่มีความหมายซ้ำกับคำตอบ (ไม่งั้นมีคำตอบถูกสองข้อ)
    for (const c of q.choices) if (c !== q.kanji) expect(meaningsOverlap(c, q.kanji), `${q.id} ~ ${c.char}`).toBe(false);
  }
  if (q.type === 'reading') {
    expect(q.word, q.id).toBeDefined();
    expect(q.word!.kanji ?? '', q.id).toContain(q.kanji.char);
    expect(q.readingChoices, q.id).toHaveLength(4);
    expect(new Set(q.readingChoices).size, q.id).toBe(4);
    expect(q.readingChoices, q.id).toContain(q.word!.kana);
  }
}

describe('kanji questions', () => {
  it('builds one sound test question per kanji in every lesson', () => {
    for (const lesson of deck.lessons) {
      for (const seed of [1, 2, 3]) {
        const qs = testQuestions(deck, lesson, N5_DECK, { rng: rng(seed) });
        expect(qs.map((q) => q.kanji.id).sort(), lesson.id).toEqual([...lesson.words].sort());
        for (const q of qs) {
          expect(q.type).not.toBe('write');
          expectSound(q);
        }
      }
    }
  });

  it('practises writing every kanji first, then asks to recognise each one', () => {
    for (const lesson of deck.lessons) {
      const qs = practiceQuestions(deck, lesson, N5_DECK, rng(4));
      const n = lesson.words.length;
      expect(qs).toHaveLength(n * 2);
      expect(qs.slice(0, n).map((q) => q.kanji.id)).toEqual([...lesson.words]);
      expect(qs.slice(0, n).every((q) => q.type === 'write')).toBe(true);
      for (const q of qs.slice(n)) expectSound(q);
    }
  });

  it('never offers another reading of the same written word as a wrong choice', () => {
    // 一日 = いちにち (หนึ่งวัน) / ついたち (วันที่ 1) · 十 = じゅう / とお · 私 = わたし / わたくし
    const words = Object.values(N5_DECK.words);
    const shared = words.filter((w) => w.kanji && words.some((o) => o !== w && o.kanji === w.kanji));
    expect(shared.length).toBeGreaterThan(0);
    let checked = 0;
    for (const word of shared) {
      const others = words.filter((o) => o !== word && o.kanji === word.kanji).map((o) => o.kana);
      for (const entry of Object.values(deck.words)) {
        if (!entry.readings.some((r) => r.words.includes(word.id))) continue;
        checked++;
        for (let seed = 1; seed <= 20; seed++) {
          const choices = readingChoicesFor(entry, word, N5_DECK, rng(seed));
          expect(choices).toContain(word.kana);
          for (const o of others) expect(choices, `${word.kanji}: ${o}`).not.toContain(o);
        }
      }
    }
    // คำเหล่านี้ใช้เป็นคำตัวอย่างของคันจิจริง (ข้อทดสอบไม่ว่าง)
    expect(checked).toBeGreaterThan(0);
  });

  it('reviews kanji from several lessons with recognition questions only', () => {
    const items = deck.lessons.flatMap((l) => lessonWords(deck, l).slice(0, 2));
    const qs = reviewQuestions(deck, items, N5_DECK, rng(9));
    expect(qs.map((q) => q.kanji.id).sort()).toEqual(items.map((k) => k.id).sort());
    for (const q of qs) {
      expect(q.type).not.toBe('write');
      expectSound(q);
    }
  });
});
