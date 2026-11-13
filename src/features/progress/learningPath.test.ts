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
  it('goes through all hiragana rows (basic then voiced) before katakana', () => {
    expect(path).toHaveLength(32);
    expect(path.slice(0, 16).every((s) => s.pack.id === 'hiragana')).toBe(true);
    expect(path.map((s) => s.group.head).slice(0, 3)).toEqual(['あ', 'か', 'さ']);
    expect(path[11]!.group.head).toBe('が');
    expect(path[16]!.group.head).toBe('ア');
  });

  it('starts by writing あ', () => {
    const step = nextStep(path, { version: 1, scripts: {} })!;
    expect(step.index).toBe(1);
    expect(step.status).toMatchObject({ kind: 'write', remaining: 5 });
    expect(stepHref(step)).toBe('/hiragana/practice/a');
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
    expect(stepHref(step)).toBe('/hiragana/quiz?groups=a');
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
