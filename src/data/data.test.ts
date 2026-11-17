import { describe, expect, it } from 'vitest';
import { counterpartOf, scriptList, scripts } from './scripts';
import { hiraganaStrokes, katakanaStrokes } from '../features/writing/engine/testUtils';
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

  it('has stroke data for every character (compounds: for each part)', async () => {
    const strokes = await pack.loadStrokes();
    for (const c of pack.chars) {
      for (const ch of c.parts ?? [c.char]) {
        const d = strokes.chars[ch];
        expect(d, `${c.char} → ${ch}`).toBeDefined();
        expect(d!.strokes.length).toBeGreaterThan(0);
        expect(d!.numbers).toHaveLength(d!.strokes.length);
      }
      // ตัวควบต้องเท่ากับตัวที่ประกอบต่อกัน และทุกส่วนต้องอยู่ในชุดเดียวกัน
      if (c.parts) {
        expect(c.parts.join(''), c.id).toBe(c.char);
        for (const p of c.parts) expect(pack.chars.some((x) => x.char === p), `${c.char} → ${p}`).toBe(true);
      }
    }
  });
});

/** ตัวเล็ก → ตัวใหญ่ (จำนวนขีดเท่ากัน) */
const SMALL_OF: Record<string, string> = {
  ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', っ: 'つ',
  ャ: 'ヤ', ュ: 'ユ', ョ: 'ヨ', ッ: 'ツ',
};

/** จำนวนขีดมาตรฐานของ 46 ตัวพื้นฐาน + ー (ตัวขุ่น +2, ตัวครึ่งขุ่น +1, ตัวเล็กเท่าตัวใหญ่) */
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
  ー: 1,
};

describe.each([
  ['hiragana', hiragana, hiraganaStrokes],
  ['katakana', katakana, katakanaStrokes],
] as [string, ScriptPack, StrokeSet][])('kana set %s', (_, pack, strokes) => {
  it('contains 46 basic + 25 voiced + small + 33 yoon characters', () => {
    const kindOf = (c: { group: string }) => pack.groups.find((g) => g.id === c.group)!.kind;
    const count = (kind: string) => pack.chars.filter((c) => kindOf(c) === kind).length;
    expect(count('basic')).toBe(46);
    expect(count('dakuten') + count('handakuten')).toBe(25);
    // คาตาคานะมี ー เพิ่มในกลุ่มตัวเล็ก
    expect(count('small')).toBe(pack.id === 'katakana' ? 5 : 4);
    expect(count('yoon')).toBe(33);
    expect(pack.chars.filter((c) => c.parts)).toHaveLength(33);
  });

  it('places yoon in the ya / yu / yo columns of a row that starts with an i-column character', () => {
    for (const c of pack.chars.filter((x) => x.parts)) {
      expect([0, 2, 4], c.char).toContain(c.col);
      const head = pack.chars.find((x) => x.char === c.parts![0])!;
      expect(head.col, c.char).toBe(1);
    }
  });

  it('matches the standard stroke counts', () => {
    for (const c of pack.chars) {
      if (c.parts) continue;
      const big = SMALL_OF[c.char] ?? c.char;
      const base = c.base ?? big;
      const extra = c.base ? (c.group === 'pa' ? 1 : 2) : 0;
      expect(strokes.chars[c.char]!.strokes.length, c.char).toBe(STANDARD_STROKES[base]! + extra);
    }
  });

  it('has example words that contain the character and only taught kana', () => {
    const taught = new Set([...pack.chars.map((c) => c.char), 'ー']);
    const withoutExample = pack.chars.filter((c) => !c.example).map((c) => c.char);
    // ตัวที่แทบไม่ใช้ในคำทั่วไป จึงไม่มีคำตัวอย่าง (ไม่แต่งคำแปลกๆ ขึ้นมา)
    expect(withoutExample).toEqual(
      pack.id === 'katakana'
        ? ['ヲ', 'ヂ', 'ヅ', 'キョ', 'ニャ', 'ニョ', 'ヒャ', 'ヒュ', 'ヒョ', 'ミョ', 'リャ', 'リョ',
           'ギュ', 'ギョ', 'ビャ', 'ビュ', 'ビョ', 'ピャ', 'ピュ', 'ピョ']
        : ['にょ', 'ひゅ', 'みゅ', 'びゅ', 'ぴゅ'],
    );
    for (const c of pack.chars) {
      if (!c.example) continue;
      expect(c.example.kana, c.char).toContain(c.char);
      for (const k of c.example.kana) expect(taught.has(k), `${c.example.kana}: ${k}`).toBe(true);
      expect(c.example.romaji).toMatch(/^[a-z ]+$/);
    }
  });

  it('pairs every character with its counterpart by id (except katakana ー)', () => {
    const other = scripts[pack.counterpart!];
    expect(other.counterpart).toBe(pack.id);
    for (const c of pack.chars) {
      if (c.id === 'long') {
        expect(counterpartOf(pack, c)).toBeUndefined();
        continue;
      }
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
