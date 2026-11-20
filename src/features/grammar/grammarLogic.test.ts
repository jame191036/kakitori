import { describe, expect, it } from 'vitest';
import { GRAMMAR_N5 } from '../../data/grammar/n5';
import { plainOf } from '../../data/grammar/sentence';
import { lessonWords } from '../../data/line';
import { rng } from '../writing/engine/testUtils';
import { choiceKey, practiceQuestions, reviewQuestions, testQuestions, type GrammarQuestion } from './grammarLogic';

const deck = GRAMMAR_N5;

function expectSound(q: GrammarQuestion) {
  if (q.type === 'fill' || q.type === 'meaning') {
    const keys = q.choices.map((c) => choiceKey(q, c));
    expect(keys, q.id).toHaveLength(4);
    expect(new Set(keys).size, q.id).toBe(4);
    expect(keys.filter((k) => k === q.answer), q.id).toHaveLength(1);
  }
  if (q.type === 'arrange') {
    expect(q.example.arrange, q.id).toBe(true);
    expect([...q.tiles].sort(), q.id).toEqual(q.example.sentence.chunks.map((_, i) => i));
    expect(q.tiles.map((i) => plainOf(q.example.sentence.chunks[i]!)).join(''), q.id).not.toBe(q.answer);
  }
}

describe('grammar questions', () => {
  it('practises every example sentence once, mixing the three kinds', () => {
    for (const lesson of deck.lessons) {
      const qs = practiceQuestions(deck, lesson, rng(3));
      const points = lessonWords(deck, lesson);
      expect(qs).toHaveLength(points.reduce((n, p) => n + p.examples.length, 0));
      for (const q of qs) expectSound(q);
    }
    const all = deck.lessons.flatMap((l) => practiceQuestions(deck, l, rng(5)));
    for (const t of ['fill', 'meaning', 'arrange'] as const) expect(all.some((q) => q.type === t), t).toBe(true);
  });

  it('tests every grammar point once with an unambiguous question (no word-order puzzle)', () => {
    for (const lesson of deck.lessons) {
      for (const seed of [1, 2, 3]) {
        const qs = testQuestions(deck, lesson, { rng: rng(seed) });
        expect(qs.map((q) => q.point.id).sort(), lesson.id).toEqual([...lesson.words].sort());
        for (const q of qs) {
          expect(q.type).not.toBe('arrange');
          expectSound(q);
        }
      }
    }
  });

  it('retests only the points that were wrong', () => {
    const lesson = deck.lessons[0]!;
    const qs = testQuestions(deck, lesson, { rng: rng(2), only: [lesson.words[1]!] });
    expect(qs.map((q) => q.point.id)).toEqual([lesson.words[1]]);
  });

  it('reviews points from several lessons', () => {
    const items = deck.lessons.map((l) => deck.words[l.words[0]!]!);
    const qs = reviewQuestions(deck, items, rng(8));
    expect(qs.map((q) => q.point.id).sort()).toEqual(items.map((p) => p.id).sort());
    for (const q of qs) {
      expect(q.type).not.toBe('arrange');
      expectSound(q);
    }
  });
});
