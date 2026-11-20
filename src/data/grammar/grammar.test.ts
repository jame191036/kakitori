import { describe, expect, it } from 'vitest';
import { KANJI_N5, KANJI_N5_ALL } from '../kanji/n5';
import { lessonCode } from '../line';
import { N5_DECK } from '../vocab/n5';
import { GRAMMAR_N5 } from './n5';
import { parseInline, parseSentence, plainOf, type Seg } from './sentence';

const deck = GRAMMAR_N5;
const points = Object.values(deck.words);
const examples = points.flatMap((p) => p.examples.map((ex) => ({ p, ex })));

/**
 * คำอ่านที่ไม่ได้มาจากคลังคำศัพท์/คันจิโดยตรง (ผู้พัฒนายืนยันเอง — เพิ่มทีละคำ พร้อมเหตุผล)
 */
const EXTRA_READINGS: Record<string, readonly string[]> = {
  日本: ['にほん'], // ชื่อประเทศ ไม่อยู่ในรายการคำศัพท์ N5
  日本語: ['にほんご'],
  何: ['なん'], // なに → なん เมื่อตามด้วย です / の / ลักษณนาม
  人: ['にん'], // ลักษณนามนับคน (さんにん)
  分: ['ふん', 'ぷん'], // นับนาที
  来: ['き', 'こ'], // くる เป็นคำกริยากลุ่ม 3: 来ます/来て = き · 来ない = こ
};

const kanjiForms = (char: string) =>
  (KANJI_N5.words[char]?.readings ?? []).flatMap((r) => r.kana.split('・').map((f) => f.replace(/\(.*\)/, '')));

function readingOk({ text, ruby }: Seg): boolean {
  if (!ruby) return true;
  if (EXTRA_READINGS[text]?.includes(ruby)) return true;
  if ([...text].length === 1 && kanjiForms(text).includes(ruby)) return true;
  return Object.values(N5_DECK.words).some((w) => (w.kanji ?? '').includes(text) && w.kana.includes(ruby));
}

const HAN = /\p{Script=Han}/gu;

describe('sentence markup', () => {
  it('splits chunks, ruby, the grammar target and the end mark', () => {
    const s = parseSentence('わたし[は] {学生|がくせい} です。');
    expect(s.plain).toBe('わたしは学生です');
    expect(s.kana).toBe('わたしはがくせいです');
    expect(s.end).toBe('。');
    expect(s.target).toBe('は');
    expect(s.targetSrc).toBe('は');
    expect(s.chunks.map(plainOf)).toEqual(['わたしは', '学生', 'です']);
    expect(s.segs.find((x) => x.ruby)).toEqual({ text: '学生', ruby: 'がくせい' });
  });

  it('keeps ruby inside the target markup', () => {
    const s = parseSentence('{今|いま} [{何|なん}{時|じ}]ですか。');
    expect(s.target).toBe('何時');
    expect(s.targetSrc).toBe('{何|なん}{時|じ}');
    expect(plainOf(parseInline(s.targetSrc))).toBe('何時');
  });

  it('rejects broken markup', () => {
    expect(() => parseSentence('わたし[は {学生|がくせい}です')).toThrow();
    expect(() => parseSentence('{学生がくせい}です')).toThrow();
    expect(() => parseSentence('[わたし]は[学生]です')).toThrow();
  });
});

describe('grammar N5 deck', () => {
  it('has stable ids, station-sized lessons and segments opened in order', () => {
    for (const [key, p] of Object.entries(deck.words)) expect(p.id).toBe(key);
    for (const l of deck.lessons) {
      expect(l.words.length, l.id).toBeGreaterThanOrEqual(2);
      expect(l.words.length, l.id).toBeLessThanOrEqual(4);
    }
    expect(lessonCode(deck, deck.lessons[0]!)).toBe('G01');
    const open = deck.segments.map((s) => s.lessons.length > 0);
    expect(open.indexOf(false) === -1 || !open.slice(open.indexOf(false)).includes(true)).toBe(true);
  });

  it('explains every point and gives at least 3 example sentences', () => {
    for (const p of points) {
      expect(p.pattern.trim(), p.id).not.toBe('');
      expect(p.title.trim(), p.id).not.toBe('');
      expect(p.explain.length, p.id).toBeGreaterThan(0);
      expect(p.examples.length, p.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('marks the grammar part of every sentence with 3+ distinct wrong choices', () => {
    for (const { p, ex } of examples) {
      const where = `${p.id}: ${ex.sentence.src}`;
      expect(ex.sentence.target, where).not.toBe('');
      expect(ex.sentence.end, where).not.toBe('');
      const wrong = ex.wrong.map((w) => plainOf(parseInline(w)));
      expect(wrong.length, where).toBeGreaterThanOrEqual(3);
      expect(new Set(wrong).size, where).toBe(wrong.length);
      expect(wrong, where).not.toContain(ex.sentence.target);
    }
  });

  it('gives every sentence its own Thai translation (meaning questions need distinct choices)', () => {
    const thai = examples.map(({ ex }) => ex.thai);
    const dup = thai.filter((t, i) => thai.indexOf(t) !== i);
    expect(dup).toEqual([]);
    for (const { p, ex } of examples) expect(ex.thai.trim(), p.id).not.toBe('');
  });

  it('only uses the 103 N5 kanji, with readings checked against the vocabulary and kanji decks', () => {
    for (const { p, ex } of examples) {
      const segs = [...ex.sentence.segs, ...ex.wrong.flatMap(parseInline)];
      for (const seg of segs) {
        for (const ch of seg.text.match(HAN) ?? []) expect(KANJI_N5_ALL, `${p.id}: ${ch} ไม่ใช่คันจิ N5`).toContain(ch);
        if (HAN.test(seg.text)) expect(seg.ruby, `${p.id}: ${seg.text} ไม่มีคำอ่าน`).toBeTruthy();
        HAN.lastIndex = 0;
        expect(readingOk(seg), `${p.id}: ${seg.text} อ่าน ${seg.ruby}`).toBe(true);
      }
    }
  });

  it('catches a wrong reading (the check above really bites)', () => {
    expect(readingOk({ text: '学生', ruby: 'がくせい' })).toBe(true);
    expect(readingOk({ text: '学生', ruby: 'がっせい' })).toBe(false);
    expect(readingOk({ text: '来', ruby: 'らい' })).toBe(true); // 来週
    expect(readingOk({ text: '七', ruby: 'ひち' })).toBe(false);
  });

  it('only offers word-order puzzles with 3+ pieces', () => {
    for (const { p, ex } of examples) {
      if (ex.arrange) expect(ex.sentence.chunks.length, `${p.id}: ${ex.sentence.src}`).toBeGreaterThanOrEqual(3);
    }
  });
});
