import { describe, expect, it } from 'vitest';
import { counterpartOf, scriptList, scripts } from './scripts';
import { hiraganaStrokes, katakanaStrokes } from '../features/writing/engine/testUtils';
import { applyAnswer, MAX_BOX, masteryLevel, weakChars, type CharStat } from '../features/progress/progressLogic';
import { hiragana } from './scripts/hiragana';
import { katakana } from './scripts/katakana';
import type { ScriptPack, StrokeSet } from './types';

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

/** จำนวนขีดมาตรฐานของ 46 ตัวพื้นฐาน (ตัวขุ่น +2, ตัวครึ่งขุ่น +1) */
const STANDARD_STROKES: Record<string, number> = {
  あ: 3, い: 2, う: 2, え: 2, お: 3, か: 3, き: 4, く: 1, け: 3, こ: 2,
  さ: 3, し: 1, す: 2, せ: 3, そ: 1, た: 4, ち: 2, つ: 1, て: 1, と: 2,
  な: 4, に: 3, ぬ: 2, ね: 2, の: 1, は: 3, ひ: 1, ふ: 4, へ: 1, ほ: 4,
  ま: 3, み: 2, む: 3, め: 2, も: 3, や: 3, ゆ: 2, よ: 2, ら: 2, り: 2,
  る: 1, れ: 2, ろ: 1, わ: 2, を: 3, ん: 1,
  ア: 2, イ: 2, ウ: 3, エ: 3, オ: 3, カ: 2, キ: 3, ク: 2, ケ: 3, コ: 2,
  サ: 3, シ: 3, ス: 2, セ: 2, ソ: 2, タ: 3, チ: 3, ツ: 3, テ: 3, ト: 2,
  ナ: 2, ニ: 2, ヌ: 2, ネ: 4, ノ: 1, ハ: 2, ヒ: 2, フ: 1, ヘ: 1, ホ: 4,
  マ: 2, ミ: 3, ム: 2, メ: 2, モ: 3, ヤ: 2, ユ: 2, ヨ: 3, ラ: 2, リ: 2,
  ル: 2, レ: 1, ロ: 3, ワ: 2, ヲ: 3, ン: 2,
};

describe.each([
  ['hiragana', hiragana, hiraganaStrokes],
  ['katakana', katakana, katakanaStrokes],
] as [string, ScriptPack, StrokeSet][])('kana set %s', (_, pack, strokes) => {
  it('contains 46 basic + 25 voiced characters', () => {
    expect(pack.chars).toHaveLength(71);
    expect(pack.chars.filter((c) => !c.base)).toHaveLength(46);
  });

  it('matches the standard stroke counts', () => {
    for (const c of pack.chars) {
      const base = c.base ?? c.char;
      const extra = c.base ? (c.group === 'pa' ? 1 : 2) : 0;
      expect(strokes.chars[c.char]!.strokes.length, c.char).toBe(STANDARD_STROKES[base]! + extra);
    }
  });

  it('has example words that contain the character and only taught kana', () => {
    const taught = new Set([...pack.chars.map((c) => c.char), 'ー']);
    const withoutExample = pack.chars.filter((c) => !c.example).map((c) => c.char);
    // ヲ ヂ ヅ แทบไม่ใช้ในคำทั่วไป จึงไม่มีคำตัวอย่าง
    expect(withoutExample).toEqual(pack.id === 'katakana' ? ['ヲ', 'ヂ', 'ヅ'] : []);
    for (const c of pack.chars) {
      if (!c.example) continue;
      expect(c.example.kana, c.char).toContain(c.char);
      for (const k of c.example.kana) expect(taught.has(k), `${c.example.kana}: ${k}`).toBe(true);
      expect(c.example.romaji).toMatch(/^[a-z ]+$/);
    }
  });

  it('pairs every character with its counterpart by id', () => {
    const other = scripts[pack.counterpart!];
    expect(other.counterpart).toBe(pack.id);
    for (const c of pack.chars) {
      const pair = counterpartOf(pack, c)!;
      expect(pair, c.char).toBeDefined();
      expect([pair.romaji, pair.thai, pair.group, pair.col]).toEqual([c.romaji, c.thai, c.group, c.col]);
    }
  });
});

it('keeps hiragana and katakana pairs aligned (か ↔ カ, ぢ ↔ ヂ)', () => {
  expect(counterpartOf(hiragana, hiragana.chars.find((c) => c.char === 'か')!)?.char).toBe('カ');
  expect(counterpartOf(katakana, katakana.chars.find((c) => c.char === 'ヂ')!)?.char).toBe('ぢ');
  expect(katakana.chars.find((c) => c.char === 'ガ')?.base).toBe('カ');
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
