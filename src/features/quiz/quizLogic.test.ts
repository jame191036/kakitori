import { describe, expect, it } from 'vitest';
import { charsInGroups, findChar, sameReading } from '../../data/scripts';
import { hiragana } from '../../data/scripts/hiragana';
import { rng } from '../writing/engine/testUtils';
import { buildQuiz, confusablesOf, isCorrectChoice, pickDistractors, weightedSample } from './quizLogic';

const all = hiragana.chars;

describe('weightedSample', () => {
  it('does not repeat items until every item has been used', () => {
    const items = ['a', 'b', 'c', 'd'];
    const out = weightedSample(items, () => 1, 8, rng(1));
    expect(new Set(out.slice(0, 4)).size).toBe(4);
    expect(new Set(out.slice(4)).size).toBe(4);
    for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1]);
  });

  it('prefers heavier items', () => {
    const counts = { heavy: 0, light: 0 };
    const random = rng(2);
    for (let i = 0; i < 2000; i++) {
      const [first] = weightedSample(['heavy', 'light'] as const, (x) => (x === 'heavy' ? 9 : 1), 1, random);
      counts[first!]++;
    }
    expect(counts.heavy).toBeGreaterThan(counts.light * 5);
  });
});

describe('pickDistractors', () => {
  it('never offers a choice that reads the same as the answer or as another choice', () => {
    const random = rng(3);
    for (const answer of all) {
      for (let k = 0; k < 5; k++) {
        const ds = pickDistractors(answer, all, all, random);
        expect(ds).toHaveLength(3);
        const choices = [answer, ...ds];
        for (let i = 0; i < choices.length; i++)
          for (let j = i + 1; j < choices.length; j++)
            expect(sameReading(choices[i]!, choices[j]!), `${choices[i]!.char}/${choices[j]!.char}`).toBe(false);
      }
    }
  });

  it('keeps distractors inside a large enough pool', () => {
    const pool = charsInGroups(hiragana, ['a', 'ka']);
    const ids = new Set(pool.map((c) => c.id));
    const random = rng(4);
    for (const answer of pool) {
      expect(pickDistractors(answer, pool, all, random).every((d) => ids.has(d.id))).toBe(true);
    }
  });

  it('falls back to the whole set when the pool is tiny, preferring basic characters', () => {
    const pool = charsInGroups(hiragana, ['n']);
    const ds = pickDistractors(pool[0]!, pool, all, rng(5));
    expect(ds).toHaveLength(3);
    expect(ds.every((d) => !d.base)).toBe(true);
  });

  it('treats voiced/unvoiced pairs and voiced look-alikes as confusable', () => {
    const conf = (ch: string) => [...confusablesOf(findChar(hiragana, ch)!, all)];
    expect(conf('か')).toEqual(expect.arrayContaining(['が', 'や', 'わ']));
    expect(conf('ば')).toEqual(expect.arrayContaining(['は', 'ぱ', 'ぼ']));
    expect(conf('ぐ')).toEqual(expect.arrayContaining(['く', 'べ', 'ぺ', 'じ']));
    expect(conf('が')).not.toContain('ぎ');
  });
});

describe('buildQuiz', () => {
  it('builds the requested number of questions with valid choices', () => {
    const qs = buildQuiz({
      pool: all,
      all,
      types: ['charToReading', 'readingToChar', 'audioToChar', 'readingToWrite'],
      count: 30,
      weightOf: () => 1,
      random: rng(6),
    });
    expect(qs).toHaveLength(30);
    for (const q of qs) {
      if (q.type === 'readingToWrite') {
        expect(q.choices).toEqual([]);
      } else {
        expect(q.choices).toHaveLength(4);
        expect(q.choices.filter((c) => c.id === q.answer.id)).toHaveLength(1);
      }
    }
  });

  it('accepts a same-reading character when choosing by sound or reading', () => {
    const ji = findChar(hiragana, 'じ')!;
    const di = findChar(hiragana, 'ぢ')!;
    expect(isCorrectChoice({ id: 0, type: 'readingToChar', answer: ji, choices: [] }, di)).toBe(true);
    expect(isCorrectChoice({ id: 0, type: 'charToReading', answer: ji, choices: [] }, di)).toBe(false);
  });
});
