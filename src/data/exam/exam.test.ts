import { describe, expect, it } from 'vitest';
import { HAN, kanjiProblem } from '../testing/n5Readings';
import { CHOOSE_ONE, KIND_INFO } from './build';
import { EXAM_SETS } from './n5';
import { examKana, examPlain, parseExamText, parsePassage, passageSegs, type ExamSeg } from './text';
import type { ExamQuestion, MondaiKind } from './types';

/** จำนวนข้อต่อชุด (ประมาณตามข้อสอบจริงหลังปี 2020 — ดู docs/n5-exam-plan.md) */
const COUNTS: Record<MondaiKind, number> = {
  'kanji-reading': 7,
  orthography: 5,
  context: 6,
  paraphrase: 3,
  'grammar-form': 9,
  composition: 4,
  'text-grammar': 4,
  'reading-short': 2,
  'reading-mid': 2,
  info: 1,
};

const all = EXAM_SETS.flatMap((set) => set.questions.map((q) => ({ set, q })));
const where = (q: ExamQuestion) => `${q.id} (${q.kind})`;
const under = (segs: readonly ExamSeg[]) => segs.filter((s) => s.under);
const toHira = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

describe('exam markup', () => {
  it('keeps spaces, ruby, the underline and gaps', () => {
    const segs = parseExamText('あしたの [{午後|ごご}]、() _ ★ <2>');
    expect(examPlain(segs)).toBe('あしたの 午後、（　） ＿ ★ ');
    expect(examKana(under(segs))).toBe('ごご');
    expect(segs.filter((s) => s.gap).map((s) => s.gap)).toEqual(['blank', 'slot', 'star', 'ref']);
    expect(segs.find((s) => s.gap === 'ref')?.ref).toBe(2);
  });

  it('splits passages into titles, lines, table rows and signatures', () => {
    const blocks = parsePassage('# ทดสอบ\n> キム\n|A|{円|えん}|\n\nふつう');
    expect(blocks.map((b) => b.type)).toEqual(['title', 'line', 'row', 'space', 'line']);
    expect(blocks[1]).toMatchObject({ right: true });
    expect(passageSegs(blocks).some((s) => s.ruby === 'えん')).toBe(true);
  });

  it('rejects broken markup', () => {
    expect(() => parseExamText('[あ][い]')).toThrow();
    expect(() => parseExamText('{学生がくせい}')).toThrow();
    expect(() => parseExamText('<x>')).toThrow();
  });
});

describe('N5 mock exam sets', () => {
  it('follows the real exam layout: 20 + 40 minutes, question counts per type', () => {
    for (const set of EXAM_SETS) {
      expect(set.sections.map((s) => s.minutes)).toEqual([20, 40]);
      const counts = Object.fromEntries(Object.keys(COUNTS).map((k) => [k, 0]));
      for (const q of set.questions) counts[q.kind]!++;
      expect(counts, set.id).toEqual(COUNTS);
      for (const s of set.sections) expect(s.questions.map((q) => q.no)).toEqual(s.questions.map((_, i) => i + 1));
    }
  });

  it('has unique ids and never repeats a question between sets', () => {
    const ids = all.map(({ q }) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const stems = all.filter(({ q }) => q.stem).map(({ q }) => examPlain(q.stem!));
    expect(stems.filter((s, i) => stems.indexOf(s) !== i)).toEqual([]);
  });

  it('gives 4 distinct choices, one answer, a Thai translation and an explanation', () => {
    for (const { q } of all) {
      const plain = q.choices.map(examPlain);
      expect(plain.length, where(q)).toBe(4);
      expect(new Set(plain).size, where(q)).toBe(4);
      expect(q.answer, where(q)).toBeGreaterThanOrEqual(0);
      expect(q.answer, where(q)).toBeLessThan(4);
      expect(q.thai.trim(), where(q)).not.toBe('');
      expect(q.explain.trim(), where(q)).not.toBe('');
    }
  });

  it('spreads the answers over all four positions', () => {
    for (const set of EXAM_SETS) {
      const used = new Set(set.questions.map((q) => q.answer));
      expect(used.size, set.id).toBe(4);
    }
  });

  it('kanji reading: the right choice is the reading of the underlined word', () => {
    for (const { q } of all.filter(({ q }) => q.kind === 'kanji-reading')) {
      const u = under(q.stem!);
      expect(u.some((s) => HAN.test(s.text)), where(q)).toBe(true);
      for (const c of q.choices.map(examPlain)) expect(HAN.test(c), where(q)).toBe(false);
      expect(examPlain(q.choices[q.answer]!), where(q)).toBe(examKana(u));
    }
  });

  it('orthography: the underlined word is kana and the right choice spells it', () => {
    for (const { q } of all.filter(({ q }) => q.kind === 'orthography')) {
      const u = under(q.stem!);
      expect(u.length, where(q)).toBeGreaterThan(0);
      expect(u.every((s) => !s.ruby && !HAN.test(s.text)), where(q)).toBe(true);
      const right = q.choices[q.answer]!;
      expect(toHira(examKana(right)), where(q)).toBe(examKana(u));
      // ตัวเลือกผิดตั้งใจเขียนผิด (ไม่มีคำอ่าน) — ต้องไม่เผลอสะกดถูกด้วย
      q.choices.forEach((c, i) => {
        if (i === q.answer) return;
        expect(c.some((s) => s.ruby), where(q)).toBe(false);
        expect(toHira(examKana(c)), where(q)).not.toBe(examKana(u));
      });
    }
  });

  it('fill-in questions have exactly one blank, paraphrases underline the sentence', () => {
    for (const { q } of all) {
      const blanks = (q.stem ?? []).filter((s) => s.gap === 'blank').length;
      if (q.kind === 'context' || q.kind === 'grammar-form') expect(blanks, where(q)).toBe(1);
      else expect(blanks, where(q)).toBe(0);
      if (q.kind === 'paraphrase') expect(under(q.stem!).length, where(q)).toBeGreaterThan(0);
    }
  });

  it('word-order questions: 4 pieces, a full order and the ★ answer from it', () => {
    for (const { q } of all.filter(({ q }) => q.kind === 'composition')) {
      const gaps = q.stem!.filter((s) => s.gap === 'slot' || s.gap === 'star');
      expect(gaps.length, where(q)).toBe(4);
      expect([...(q.order ?? [])].sort(), where(q)).toEqual([0, 1, 2, 3]);
      expect(q.order![gaps.findIndex((s) => s.gap === 'star')], where(q)).toBe(q.answer);
    }
  });

  it('passages: text grammar blanks match its questions, reading questions have a question', () => {
    for (const set of EXAM_SETS) {
      for (const m of set.sections.flatMap((s) => s.mondai)) {
        for (const g of m.groups) {
          const passage = ['text-grammar', 'reading-short', 'reading-mid', 'info'].includes(m.kind);
          expect(!!g.passage, `${set.id} もんだい${m.no}`).toBe(passage);
          if (!g.passage) continue;
          expect(g.passageThai?.trim(), `${set.id} もんだい${m.no}`).toBeTruthy();
          const refs = passageSegs(g.passage).filter((s) => s.gap === 'ref').map((s) => s.ref);
          if (m.kind === 'text-grammar') {
            expect(refs).toEqual(g.questions.map((_, i) => i + 1));
            for (const q of g.questions) expect(q.stem, where(q)).toBeNull();
          } else {
            expect(refs).toEqual([]);
            for (const q of g.questions) expect(q.stem, where(q)).not.toBeNull();
          }
        }
      }
    }
  });

  it('only uses the 103 N5 kanji, with readings checked against the vocabulary and kanji decks', () => {
    const problems: string[] = [];
    const check = (segs: readonly ExamSeg[], label: string) => {
      for (const seg of segs) {
        const p = kanjiProblem(seg);
        if (p) problems.push(`${label}: ${p}`);
      }
    };
    for (const set of EXAM_SETS) {
      for (const g of set.sections.flatMap((s) => s.mondai.flatMap((m) => m.groups))) {
        if (g.passage) check(passageSegs(g.passage), `ชุด ${set.id} บทความ`);
      }
      for (const q of set.questions) {
        if (q.stem) check(q.stem, where(q));
        // ข้อเขียนคันจิ: ตัวเลือกผิดตั้งใจใช้ตัวที่หน้าคล้ายกัน (อาจไม่ใช่คันจิ N5)
        q.choices.forEach((c, i) => {
          if (q.kind !== 'orthography' || i === q.answer) check(c, `${where(q)} ตัวเลือก ${i + 1}`);
        });
      }
    }
    for (const info of Object.values(KIND_INFO)) check(parseExamText(info.ja), 'คำสั่ง');
    check(parseExamText(CHOOSE_ONE), 'คำสั่ง');
    expect(problems).toEqual([]);
  });
});
