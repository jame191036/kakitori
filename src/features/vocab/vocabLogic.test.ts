import { describe, expect, it } from 'vitest';
import { kanaOf } from '../../data/vocab';
import { N5_DECK } from '../../data/vocab/n5';
import { rng } from '../writing/engine/testUtils';
import { applyAnswer, type ProgressData } from '../progress/progressLogic';
import {
  canArrange,
  canWrite,
  lessonPassed,
  lessonStates,
  nextLesson,
  practiceQuestions,
  testQuestions,
} from './vocabLogic';

const deck = N5_DECK;
const [first, second] = deck.lessons;

function passedWords(ids: readonly string[]): ProgressData {
  return {
    version: 1,
    scripts: { [deck.progressKey]: Object.fromEntries(ids.map((id) => [id, applyAnswer(undefined, true, 1)])) },
  };
}

describe('vocab lessons as stations', () => {
  it('passes a lesson only when every word was answered correctly once', () => {
    const almost = passedWords(first!.words.slice(1));
    expect(lessonPassed(deck, first!, almost.scripts[deck.progressKey])).toBe(false);
    const all = passedWords(first!.words);
    expect(lessonPassed(deck, first!, all.scripts[deck.progressKey])).toBe(true);
    expect(lessonStates(deck, all.scripts[deck.progressKey]).slice(0, 3)).toEqual(['done', 'current', 'todo']);
    expect(nextLesson(deck, all.scripts[deck.progressKey])?.id).toBe(second!.id);
  });

  it('a wrong answer later does not undo a passed word', () => {
    const p = passedWords(first!.words).scripts[deck.progressKey]!;
    const after = { ...p, [first!.words[0]!]: applyAnswer(p[first!.words[0]!], false, 2) };
    expect(lessonPassed(deck, first!, after)).toBe(true);
  });
});

describe('vocab questions', () => {
  it('builds one test question per word with 4 distinct choices that include the answer', () => {
    for (const lesson of deck.lessons) {
      const qs = testQuestions(deck, lesson, { audio: true, rng: rng(7) });
      expect(qs.map((q) => q.word.id).sort()).toEqual([...lesson.words].sort());
      for (const q of qs) {
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices.map((c) => c.id)).size).toBe(4);
        expect(q.choices.some((c) => c.id === q.word.id)).toBe(true);
        // ความหมายของตัวหลอกต้องไม่ซ้ำกับคำตอบ
        expect(q.choices.filter((c) => c.thai === q.word.thai)).toHaveLength(1);
      }
    }
  });

  it('can limit the test to the words that were wrong', () => {
    const qs = testQuestions(deck, first!, { audio: false, rng: rng(1), only: [first!.words[2]!] });
    expect(qs.map((q) => q.word.id)).toEqual([first!.words[2]]);
    expect(qs[0]!.type).not.toBe('audioToMeaning');
  });

  it('mixes practice types and only writes/arranges words that fit', () => {
    const qs = practiceQuestions(deck, deck.lessons[1]!, { audio: false, rng: rng(3) });
    expect(new Set(qs.map((q) => q.type)).size).toBeGreaterThanOrEqual(3);
    expect(qs.some((q) => q.type === 'audioToMeaning')).toBe(false);
    for (const q of qs) {
      if (q.type === 'write') expect(canWrite(q.word)).toBe(true);
      if (q.type === 'arrange') {
        expect(canArrange(q.word)).toBe(true);
        // ตัวของคำตอบอยู่ครบในตัวเลือก (+ ตัวหลอก)
        const tiles = [...q.tiles];
        for (const ch of kanaOf(q.word)) tiles.splice(tiles.indexOf(ch), 1);
        expect(tiles.length).toBeLessThanOrEqual(2);
      }
    }
  });
});
