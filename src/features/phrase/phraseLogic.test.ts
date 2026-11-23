import { describe, expect, it } from 'vitest';
import { lessonWords } from '../../data/line';
import { TRAVEL_DECK } from '../../data/travel';
import { phrasesOverlap, practiceQuestions, reviewQuestions, testQuestions, type PhraseQuestion } from './phraseLogic';

const deck = TRAVEL_DECK;
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

function checkChoices(q: PhraseQuestion) {
  if (q.type === 'arrange') {
    expect([...q.tiles].sort()).toEqual(q.phrase.kanaSentence.chunks.map((_, i) => i));
    return;
  }
  expect(q.choices.length, q.id).toBe(4);
  expect(new Set(q.choices).size, q.id).toBe(4);
  expect(q.choices, q.id).toContain(q.answer);
  if (q.type === 'say') {
    expect(q.phrase.kind, q.id).not.toBe('hear');
    for (const id of q.choices) {
      const o = deck.words[id]!;
      // เลือกวลีจากวลีที่พูดด้วยกัน · เลือกป้ายจากป้ายด้วยกัน
      expect(o.kind, q.id).toBe(q.phrase.kind);
      if (id !== q.phrase.id) expect(phrasesOverlap(o, q.phrase), `${q.id} ↔ ${id}`).toBe(false);
    }
  }
}

describe('travel questions', () => {
  it('practice: 2 questions per phrase, say-only types for phrases we say', () => {
    for (const lesson of deck.lessons) {
      const qs = practiceQuestions(deck, lesson, { audio: true, rng: seeded(7) });
      expect(qs.length).toBe(lessonWords(deck, lesson).length * 2);
      for (const q of qs) {
        checkChoices(q);
        if (q.phrase.kind === 'hear') expect(['listen', 'meaning']).toContain(q.type);
      }
    }
  });

  it('test: one question per phrase, no listening-only questions without a Japanese voice', () => {
    for (const lesson of deck.lessons) {
      const ids = lessonWords(deck, lesson).map((x) => x.id);
      const qs = testQuestions(deck, lesson, { audio: false, rng: seeded(3) });
      expect(qs.map((q) => q.phrase.id).sort()).toEqual([...ids].sort());
      for (const q of qs) {
        checkChoices(q);
        expect(q.type).not.toBe('listen');
        expect(q.type).not.toBe('arrange');
      }
    }
  });

  it('test can retry only some phrases, review mixes lessons', () => {
    const lesson = deck.lessons[0]!;
    const only = lesson.words.slice(0, 2);
    expect(testQuestions(deck, lesson, { audio: true, only }).map((q) => q.phrase.id).sort()).toEqual([...only].sort());
    const items = deck.lessons.map((l) => deck.words[l.words[0]!]!);
    const qs = reviewQuestions(deck, items, { audio: true, rng: seeded(11) });
    expect(qs.length).toBe(items.length);
    qs.forEach(checkChoices);
  });

  it('signs: read the sign or pick the sign, never listening or arranging', () => {
    const lesson = deck.lessons.find((l) => l.words.every((id) => deck.words[id]!.kind === 'sign'))!;
    const practice = practiceQuestions(deck, lesson, { audio: true, rng: seeded(5) });
    expect(new Set(practice.map((q) => q.type))).toEqual(new Set(['meaning', 'say']));
    const test = testQuestions(deck, lesson, { audio: true, rng: seeded(5) });
    expect(test.every((q) => q.type === 'meaning')).toBe(true);
    [...practice, ...test].forEach(checkChoices);
  });

  it('never offers a phrase that contains the answer as a wrong "say" choice', () => {
    const ikura = deck.words['ikura']!;
    const made = deck.words['made-ikura']!;
    expect(phrasesOverlap(ikura, made)).toBe(true);
    expect(phrasesOverlap(ikura, deck.words['toire-doko']!)).toBe(false);
  });
});
