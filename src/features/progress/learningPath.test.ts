import { describe, expect, it } from 'vitest';
import { scriptList } from '../../data/scripts';
import { buildPath, nextStep, stepHref } from './learningPath';
import { applyAnswer, applyPractice, type ProgressData } from './progressLogic';

const path = buildPath(scriptList);

function progressWith(script: string, entries: Record<string, { practiced?: boolean; correct?: boolean }>): ProgressData {
  const chars: Record<string, ReturnType<typeof applyPractice>> = {};
  for (const [id, { practiced, correct }] of Object.entries(entries)) {
    let s = practiced ? applyPractice(undefined, 1) : undefined;
    if (correct) s = applyAnswer(s, true, 2);
    if (s) chars[id] = s;
  }
  return { version: 1, scripts: { [script]: chars } };
}

describe('learning path', () => {
  it('goes through level 1 of both scripts before level 2 (small kana + yoon)', () => {
    expect(path).toHaveLength(56);
    // ระดับ 1: ฮิรางานะ 16 แถว → คาตาคานะ 16 แถว
    expect(path.slice(0, 16).every((s) => s.pack.id === 'hiragana' && s.level === 1)).toBe(true);
    expect(path.map((s) => s.group.head).slice(0, 3)).toEqual(['あ', 'か', 'さ']);
    expect(path[11]!.group.head).toBe('が');
    expect(path[16]!.group.head).toBe('ア');
    expect(path.slice(16, 32).every((s) => s.pack.id === 'katakana' && s.level === 1)).toBe(true);
    // ระดับ 2: ฮิรางานะ ตัวเล็ก + ตัวควบ → คาตาคานะ ตัวเล็ก + ตัวควบ
    expect(path[32]!.group.kind).toBe('small');
    expect(path[32]!.pack.id).toBe('hiragana');
    expect(path[33]!.group.head).toBe('きゃ');
    expect(path[44]!.group.head).toBe('ャュョッー');
    expect(path.slice(32).every((s) => s.level === 2)).toBe(true);
  });

  it('passes the small-kana row by writing only, and yoon rows by the quiz only', () => {
    const level1 = path.slice(0, 32);
    const done = (steps: typeof path) =>
      Object.fromEntries(steps.flatMap((s) => s.chars.map((c) => [c.id, { practiced: true, correct: true }])));
    const data = (hira: Record<string, object>) => ({
      version: 1 as const,
      scripts: {
        ...progressWith('hiragana', hira).scripts,
        ...progressWith('katakana', done(level1.slice(16))).scripts,
      },
    });
    const before = done(level1.slice(0, 16));
    // ถึงแถวตัวเล็ก: ต้องเขียน
    let step = nextStep(path, data(before))!;
    expect(step.group.kind).toBe('small');
    expect(step.level).toBe(2);
    expect(step.status).toMatchObject({ kind: 'write', remaining: 4 });
    // เขียนตัวเล็กครบ (ยังไม่เคยตอบถูก) → ผ่าน แล้วไปตัวควบซึ่งเริ่มที่แบบทดสอบเลย
    const small = Object.fromEntries(path[32]!.chars.map((c) => [c.id, { practiced: true }]));
    step = nextStep(path, data({ ...before, ...small }))!;
    expect(step.group.head).toBe('きゃ');
    expect(step.status).toEqual({ kind: 'quiz', remaining: 3 });
    expect(stepHref(step)).toBe('/kana/hiragana/quiz?groups=kya');
  });

  it('starts by writing あ', () => {
    const step = nextStep(path, { version: 1, scripts: {} })!;
    expect(step.index).toBe(1);
    expect(step.status).toMatchObject({ kind: 'write', remaining: 5 });
    expect(stepHref(step)).toBe('/kana/hiragana/practice/a');
  });

  it('asks for the row quiz once every character has been written', () => {
    const data = progressWith('hiragana', {
      a: { practiced: true, correct: true },
      i: { practiced: true },
      u: { practiced: true },
      e: { practiced: true },
      o: { practiced: true },
    });
    const step = nextStep(path, data)!;
    expect(step.status).toEqual({ kind: 'quiz', remaining: 4 });
    expect(stepHref(step)).toBe('/kana/hiragana/quiz?groups=a');
  });

  it('moves to the next row when a row is written and answered correctly', () => {
    const all = Object.fromEntries(['a', 'i', 'u', 'e', 'o'].map((id) => [id, { practiced: true, correct: true }]));
    const step = nextStep(path, progressWith('hiragana', all))!;
    expect(step.group.head).toBe('か');
    expect(step.doneCount).toBe(1);
  });

  it('does not count a correct quiz answer without writing practice', () => {
    const all = Object.fromEntries(['a', 'i', 'u', 'e', 'o'].map((id) => [id, { correct: true }]));
    expect(nextStep(path, progressWith('hiragana', all))!.status.kind).toBe('write');
  });
});
