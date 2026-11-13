import { describe, expect, it } from 'vitest';
import { scriptList } from './scripts';
import { hiraganaStrokes } from '../features/writing/engine/testUtils';
import { applyAnswer, MAX_BOX, masteryLevel, weakChars, type CharStat } from '../features/progress/progressLogic';
import { hiragana } from './scripts/hiragana';

describe.each(scriptList.map((p) => [p.id, p] as const))('script pack %s', (_, pack) => {
  it('has unique ids and characters', () => {
    expect(new Set(pack.chars.map((c) => c.id)).size).toBe(pack.chars.length);
    expect(new Set(pack.chars.map((c) => c.char)).size).toBe(pack.chars.length);
  });

  it('references only existing groups, bases and similar characters', () => {
    const groups = new Set(pack.groups.map((g) => g.id));
    const chars = new Set(pack.chars.map((c) => c.char));
    for (const c of pack.chars) {
      expect(groups.has(c.group), c.char).toBe(true);
      expect(c.col).toBeGreaterThanOrEqual(0);
      expect(c.col).toBeLessThanOrEqual(4);
      if (c.base) expect(chars.has(c.base), c.char).toBe(true);
      for (const s of c.similar ?? []) expect(chars.has(s), `${c.char} → ${s}`).toBe(true);
    }
  });

  it('has stroke data for every character', async () => {
    const strokes = await pack.loadStrokes();
    for (const c of pack.chars) {
      const d = strokes.chars[c.char];
      expect(d, c.char).toBeDefined();
      expect(d!.strokes.length).toBeGreaterThan(0);
      expect(d!.numbers).toHaveLength(d!.strokes.length);
    }
  });
});

describe('hiragana', () => {
  it('contains 46 basic + 25 voiced characters', () => {
    expect(hiragana.chars).toHaveLength(71);
    expect(hiragana.chars.filter((c) => !c.base)).toHaveLength(46);
  });

  it('matches the standard stroke counts', () => {
    const expected: Record<string, number> = {
      あ: 3, い: 2, う: 2, え: 2, お: 3, か: 3, き: 4, く: 1, け: 3, こ: 2,
      さ: 3, し: 1, す: 2, せ: 3, そ: 1, た: 4, ち: 2, つ: 1, て: 1, と: 2,
      な: 4, に: 3, ぬ: 2, ね: 2, の: 1, は: 3, ひ: 1, ふ: 4, へ: 1, ほ: 4,
      ま: 3, み: 2, む: 3, め: 2, も: 3, や: 3, ゆ: 2, よ: 2, ら: 2, り: 2,
      る: 1, れ: 2, ろ: 1, わ: 2, を: 3, ん: 1,
    };
    for (const c of hiragana.chars) {
      const base = c.base ?? c.char;
      const extra = c.base ? (c.group === 'pa' ? 1 : 2) : 0;
      expect(hiraganaStrokes.chars[c.char]!.strokes.length, c.char).toBe(expected[base]! + extra);
    }
  });
});

describe('progress logic', () => {
  it('moves up one box when correct and back to zero when wrong', () => {
    let s: CharStat | undefined;
    for (let i = 0; i < MAX_BOX + 2; i++) s = applyAnswer(s, true, i);
    expect(s!.box).toBe(MAX_BOX);
    expect(masteryLevel(s)).toBe(3);
    s = applyAnswer(s, false, 99);
    expect(s).toMatchObject({ box: 0, wrong: 1, lastWrong: 99 });
    expect(masteryLevel(s)).toBe(1);
  });

  it('lists characters that were wrong and are still weak, worst first', () => {
    const a = applyAnswer(applyAnswer(undefined, false, 1), false, 2);
    const ka = applyAnswer(undefined, false, 3);
    const sa = applyAnswer(applyAnswer(applyAnswer(applyAnswer(ka, true, 4), true, 5), true, 6), true, 7);
    const weak = weakChars(hiragana, { a, ka, sa });
    expect(weak.map((w) => w.entry.char)).toEqual(['あ', 'か']);
  });
});
