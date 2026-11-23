import { describe, expect, it } from 'vitest';
import { EXAM_SET_1 } from '../../data/exam/n5/set1';
import { examPlain } from '../../data/exam/text';
import { answerSentence, formatClock, formatDuration, remainingMs, scoreExam, verdictOf } from './examLogic';

const set = EXAM_SET_1;
const allRight = Object.fromEntries(set.questions.map((q) => [q.id, q.answer]));

describe('scoreExam', () => {
  it('scores a perfect paper as 120 and splits it into parts and もんだい', () => {
    const s = scoreExam(set, allRight);
    expect(s).toMatchObject({ correct: 43, total: 43, answered: 43, scaled: 120, projected: 180, verdict: 'pass' });
    expect(s.parts).toEqual({
      vocab: { correct: 21, total: 21 },
      grammar: { correct: 17, total: 17 },
      reading: { correct: 5, total: 5 },
    });
    expect(s.sections).toEqual([
      { correct: 21, total: 21 },
      { correct: 22, total: 22 },
    ]);
    expect(s.mondai.map((m) => `${m.section}:${m.no}`)).toEqual([
      '0:1', '0:2', '0:3', '0:4', '1:1', '1:2', '1:3', '1:4', '1:5', '1:6',
    ]);
  });

  it('counts blank and wrong answers as wrong', () => {
    const answers = { ...allRight };
    const [a, b] = set.questions;
    delete answers[a!.id];
    answers[b!.id] = (b!.answer + 1) % 4;
    const s = scoreExam(set, answers);
    expect(s.correct).toBe(41);
    expect(s.answered).toBe(42);
    expect(s.scaled).toBe(Math.round((41 / 43) * 120));
  });
});

describe('verdictOf', () => {
  it('fails below 80/180 or the 38-point section minimum, is borderline below 60%', () => {
    expect(verdictOf(19, 43)).toBe('fail'); // 44.2% → 79.5/180
    expect(verdictOf(20, 43)).toBe('borderline'); // 46.5%
    expect(verdictOf(25, 43)).toBe('borderline'); // 58.1%
    expect(verdictOf(26, 43)).toBe('pass'); // 60.5%
    expect(verdictOf(0, 0)).toBe('fail');
  });
});

describe('clock', () => {
  it('formats the countdown and durations', () => {
    expect(formatClock(20 * 60 * 1000)).toBe('20:00');
    expect(formatClock(754_000)).toBe('12:34');
    expect(formatClock(300)).toBe('0:01');
    expect(formatClock(-5)).toBe('0:00');
    expect(remainingMs(1000, 4000)).toBe(0);
    expect(formatDuration(754)).toBe('12 นาที 34 วินาที');
    expect(formatDuration(600)).toBe('10 นาที');
    expect(formatDuration(42)).toBe('42 วินาที');
  });
});

describe('answerSentence', () => {
  it('puts the answer into the blank', () => {
    const q = set.questions.find((x) => x.kind === 'grammar-form')!;
    const segs = answerSentence(q);
    expect(examPlain(segs)).toBe('わたしは まいあさ パンを 食べます。');
    expect(segs.filter((s) => s.hl).map((s) => s.text)).toEqual(['を']);
  });

  it('rebuilds the word-order sentence and marks the ★ piece', () => {
    const q = set.questions.find((x) => x.kind === 'composition')!;
    const segs = answerSentence(q);
    expect(examPlain(segs)).toBe('これは あにがとったしゃしん です。');
    expect(segs.filter((s) => s.hl).map((s) => s.text)).toEqual(['とった']);
  });
});
