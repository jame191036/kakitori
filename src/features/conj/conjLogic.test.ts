import { describe, expect, it } from 'vitest';
import { conjugate, tilesOf } from '../../data/conj/conjugate';
import { CONJ_N5 } from '../../data/conj/n5';
import { VERB_FORMS } from '../../data/conj/types';
import { canUse, CONJ_VERBS } from '../../data/conj/verbs';
import { lessonWords } from '../../data/line';
import { rng } from '../writing/engine/testUtils';
import {
  cleanPrefs,
  FREE_TOPICS,
  freeKey,
  freeQuestions,
  practiceQuestions,
  retryQuestions,
  reviewQuestions,
  ruleFor,
  TEST_PER_RULE,
  testQuestions,
  topicWords,
  type ConjQuestion,
} from './conjLogic';

const deck = CONJ_N5;

/** ข้อคำถามมีคำตอบเดียวแน่นอน */
function expectSound(q: ConjQuestion) {
  expect(q.rule.words, q.id).toContain(q.word.id);
  if (q.type === 'build') {
    expect(q.slots, q.id).toBe(tilesOf(q.word, q.form!).length);
    expect(q.tiles.length, q.id).toBe(q.slots + 3);
    const left = [...q.tiles];
    for (const t of tilesOf(q.word, q.form!)) {
      expect(left, q.id).toContain(t);
      left.splice(left.indexOf(t), 1);
    }
    expect(q.answer, q.id).toBe(conjugate(q.word, q.form!));
    return;
  }
  const keys = q.choices.map((c) => c.key);
  expect(keys, q.id).toHaveLength(q.type === 'group' ? 3 : 4);
  expect(new Set(keys).size, q.id).toBe(keys.length);
  expect(keys.filter((k) => k === q.answer), q.id).toHaveLength(1);
  if (q.type === 'form') expect(q.answer, q.id).toBe(conjugate(q.word, q.form!));
  if (q.type === 'group') expect(q.answer, q.id).toBe(String(q.word.group));
  if (q.type === 'pick') {
    expect(q.choices.filter((c) => c.word!.group === q.word.group), q.id).toHaveLength(1);
  }
  if (q.type === 'back') {
    const shown = conjugate(q.word, q.form!);
    expect(q.choices.filter((c) => conjugate(c.word!, q.form!) === shown), q.id).toHaveLength(1);
  }
  if (q.type === 'back' || q.type === 'pick') {
    // ตัวเลือกที่เขียนคานะเหมือนกันแยกไม่ออก
    expect(new Set(q.choices.map((c) => c.word!.kana)).size, q.id).toBe(4);
  }
}

describe('conjugation questions', () => {
  it('practises every rule with sound questions and every kind of question', () => {
    const seen = new Set<string>();
    for (const lesson of deck.lessons) {
      for (const seed of [1, 2, 3, 4, 5]) {
        const qs = practiceQuestions(deck, lesson, rng(seed));
        for (const rule of lessonWords(deck, lesson)) {
          const own = qs.filter((q) => q.rule.id === rule.id);
          expect(own.length, rule.id).toBeGreaterThanOrEqual(2);
          expect(own.length, rule.id).toBeLessThanOrEqual(4);
        }
        expect(new Set(qs.map((q) => q.id)).size, lesson.id).toBe(qs.length);
        for (const q of qs) {
          expectSound(q);
          seen.add(q.type);
        }
      }
    }
    expect([...seen].sort()).toEqual(['back', 'build', 'form', 'group', 'pick']);
  });

  it('tests every rule twice, never with the same question', () => {
    for (const lesson of deck.lessons) {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const qs = testQuestions(deck, lesson, { rng: rng(seed) });
        expect(qs, lesson.id).toHaveLength(lesson.words.length * TEST_PER_RULE);
        for (const rule of lessonWords(deck, lesson)) {
          const own = qs.filter((q) => q.rule.id === rule.id);
          expect(own, rule.id).toHaveLength(TEST_PER_RULE);
          expect(new Set(own.map((q) => `${q.type}:${q.word.id}`)).size, rule.id).toBe(TEST_PER_RULE);
          // กฎที่มีหลายคำ: 2 ข้อใช้คนละคำ · กฎรูปผัน: เลือกตอบ 1 + เรียงคานะ 1
          if (rule.words.length > 1) expect(new Set(own.map((q) => q.word.id)).size, rule.id).toBe(TEST_PER_RULE);
          if (rule.form) expect(own.map((q) => q.type).sort(), rule.id).toEqual(['build', 'form']);
        }
        for (const q of qs) expectSound(q);
      }
    }
  });

  it('retests only the rules that were wrong', () => {
    const lesson = deck.lessons[3]!;
    const qs = testQuestions(deck, lesson, { rng: rng(2), only: [lesson.words[1]!] });
    expect(qs.map((q) => q.rule.id)).toEqual([lesson.words[1], lesson.words[1]]);
  });

  it('reviews rules from several lessons', () => {
    const items = deck.lessons.map((l) => deck.words[l.words[0]!]!);
    const qs = reviewQuestions(items, rng(8));
    expect(qs.map((q) => q.rule.id).sort()).toEqual(items.map((r) => r.id).sort());
    for (const q of qs) expectSound(q);
  });
});

describe('free practice', () => {
  it('finds one rule for every word and form', () => {
    for (const v of CONJ_VERBS) {
      expect(ruleFor(v, null), v.id).toBeDefined();
      for (const f of VERB_FORMS) if (canUse(v, f)) expect(ruleFor(v, f)?.form, `${v.id} ${f}`).toBe(f);
    }
    expect(FREE_TOPICS).toEqual(['group', ...VERB_FORMS]);
  });

  it('asks only what was chosen', () => {
    const prefs = { topics: ['te', 'tai'] as const, groups: [2] as const, types: ['build'] as const };
    const qs = freeQuestions({ topics: [...prefs.topics], groups: [...prefs.groups], types: [...prefs.types] }, 60, { rng: rng(4) });
    expect(qs).toHaveLength(60);
    for (const q of qs) {
      expect(['te', 'tai']).toContain(q.form);
      expect(q.word.group).toBe(2);
      expect(q.type).toBe('build');
      expect(q.word.skip).not.toContain(q.form);
      expectSound(q);
    }
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
  });

  it('stays sound for every topic and way of answering', () => {
    for (const topic of FREE_TOPICS) {
      for (const type of ['form', 'build', 'back'] as const) {
        const qs = freeQuestions({ topics: [topic], groups: [1, 2, 3], types: [type] }, 80, { rng: rng(6) });
        for (const q of qs) expectSound(q);
        if (topic === 'group') expect(qs.every((q) => q.type === 'group')).toBe(true);
      }
    }
  });

  it('uses words from every group when asking for the group', () => {
    expect(new Set(topicWords('group', [1]).map((v) => v.group)).size).toBe(3);
  });

  it('avoids repeating a question that just came up', () => {
    const prefs = { topics: ['masu' as const], groups: [1 as const, 2 as const, 3 as const], types: ['form' as const] };
    const qs = freeQuestions(prefs, 30, { rng: rng(9) });
    expect(new Set(qs.map(freeKey)).size).toBeGreaterThanOrEqual(29);
  });

  it('gives nothing when nothing is chosen, and retries the wrong ones once each', () => {
    expect(freeQuestions({ topics: [], groups: [1], types: ['form'] }, 5)).toEqual([]);
    expect(freeQuestions({ topics: ['te'], groups: [], types: ['form'] }, 5)).toEqual([]);
    const qs = freeQuestions({ topics: ['te'], groups: [1], types: ['form'] }, 6, { rng: rng(3) });
    const again = retryQuestions([...qs, ...qs], ['build'], rng(1));
    expect(again.map(freeKey).sort()).toEqual([...new Set(qs.map(freeKey))].sort());
    for (const q of again) expectSound(q);
  });

  it('drops saved choices it does not know', () => {
    expect(cleanPrefs({ topics: ['te', 'x', 'masu'], groups: [3, 9, 1], types: ['back', 'zzz'], count: 7 }, FREE_TOPICS)).toEqual({
      topics: ['masu', 'te'],
      groups: [1, 3],
      types: ['back'],
      count: 10,
    });
  });
});
