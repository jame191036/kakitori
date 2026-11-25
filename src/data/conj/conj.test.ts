import { describe, expect, it } from 'vitest';
import { N5_DECK } from '../vocab/n5';
import { conjugate, POLITE_END, tilesOf, wrongForms } from './conjugate';
import { NOT_VOLITIONAL, SKIP_FORMS, TRICKY_GROUP1 } from './lists';
import { CONJ_N5 } from './n5';
import { FORM_INFO, VERB_FORMS, type VerbForm } from './types';
import { canUse, CONJ_VERBS, endingOf, looksLikeGroup2, SURU_NOUNS, verbById } from './verbs';

const rules = Object.values(CONJ_N5.words);

/** คำตอบที่เขียนมือ ครบทุกตัวท้ายและทุกข้อยกเว้น: [masu, te, ta] */
const EXPECTED: Record<string, [masu: string, te: string, ta: string]> = {
  kau: ['かいます', 'かって', 'かった'],
  iu: ['いいます', 'いって', 'いった'],
  kaku: ['かきます', 'かいて', 'かいた'],
  iku: ['いきます', 'いって', 'いった'],
  oyogu: ['およぎます', 'およいで', 'およいだ'],
  nugu: ['ぬぎます', 'ぬいで', 'ぬいだ'],
  hanasu: ['はなします', 'はなして', 'はなした'],
  matsu: ['まちます', 'まって', 'まった'],
  shinu: ['しにます', 'しんで', 'しんだ'],
  asobu: ['あそびます', 'あそんで', 'あそんだ'],
  nomu: ['のみます', 'のんで', 'のんだ'],
  noru: ['のります', 'のって', 'のった'],
  aru: ['あります', 'あって', 'あった'],
  kaeru: ['かえります', 'かえって', 'かえった'],
  hairu: ['はいります', 'はいって', 'はいった'],
  hashiru: ['はしります', 'はしって', 'はしった'],
  shiru: ['しります', 'しって', 'しった'],
  'kiru-cut': ['きります', 'きって', 'きった'],
  'kiru-wear': ['きます', 'きて', 'きた'],
  'iru-need': ['いります', 'いって', 'いった'],
  'iru-exist': ['います', 'いて', 'いた'],
  taberu: ['たべます', 'たべて', 'たべた'],
  miru: ['みます', 'みて', 'みた'],
  deru: ['でます', 'でて', 'でた'],
  kariru: ['かります', 'かりて', 'かりた'],
  suru: ['します', 'して', 'した'],
  kuru: ['きます', 'きて', 'きた'],
  'benkyou-suru': ['べんきょうします', 'べんきょうして', 'べんきょうした'],
  'kopii-suru': ['コピーします', 'コピーして', 'コピーした'],
};

describe('verb groups', () => {
  it('covers every N5 verb plus the suru nouns', () => {
    const verbs = Object.values(N5_DECK.words).filter((w) => w.kind === 'verb');
    expect(CONJ_VERBS).toHaveLength(verbs.length + Object.keys(SURU_NOUNS).length);
    expect(new Set(CONJ_VERBS.map((v) => v.id)).size).toBe(CONJ_VERBS.length);
    const count = (g: number) => CONJ_VERBS.filter((v) => v.group === g).length;
    expect([count(1), count(2), count(3)]).toEqual([76, 30, 13]);
  });

  it('gets every group from the ending, with only the listed exceptions', () => {
    for (const v of CONJ_VERBS) {
      if (v.group === 2) expect(looksLikeGroup2(v.kana), v.id).toBe(true);
      if (v.group === 3) expect(/(する|くる)$/.test(v.kana), v.id).toBe(true);
    }
    const tricky = CONJ_VERBS.filter((v) => v.group === 1 && looksLikeGroup2(v.kana)).map((v) => v.id);
    expect(tricky.sort()).toEqual([...TRICKY_GROUP1].sort());
  });

  it('lists only words that exist', () => {
    for (const id of [...TRICKY_GROUP1, ...NOT_VOLITIONAL, ...Object.keys(SKIP_FORMS)]) expect(verbById(id).id).toBe(id);
    expect(new Set(NOT_VOLITIONAL).size).toBe(NOT_VOLITIONAL.length);
  });
});

describe('conjugation', () => {
  it('matches the hand-written answers', () => {
    for (const [id, [masu, te, ta]] of Object.entries(EXPECTED)) {
      const v = verbById(id);
      expect([conjugate(v, 'masu'), conjugate(v, 'te'), conjugate(v, 'ta')], id).toEqual([masu, te, ta]);
    }
    const endings = new Set(CONJ_VERBS.filter((v) => v.group === 1).map(endingOf));
    const tested = new Set(Object.keys(EXPECTED).map(verbById).filter((v) => v.group === 1).map(endingOf));
    expect(tested).toEqual(endings);
  });

  it('builds the polite family on the masu stem', () => {
    for (const v of CONJ_VERBS) {
      const stem = conjugate(v, 'masu').replace(/ます$/, '');
      for (const [form, end] of Object.entries(POLITE_END)) {
        expect(conjugate(v, form as VerbForm), `${v.id} ${form}`).toBe(stem + end);
      }
    }
  });

  it('splits each form into tiles that spell it', () => {
    for (const v of CONJ_VERBS) {
      for (const f of VERB_FORMS) {
        const tiles = tilesOf(v, f);
        expect(tiles.join(''), `${v.id} ${f}`).toBe(conjugate(v, f));
        expect(tiles.length, `${v.id} ${f}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('offers wrong forms that are never the right one', () => {
    for (const v of CONJ_VERBS) {
      for (const f of VERB_FORMS) {
        const { stem, ending } = wrongForms(v, f);
        expect(stem.length, `${v.id} ${f}`).toBeGreaterThanOrEqual(3);
        expect([...stem, ...ending], `${v.id} ${f}`).not.toContain(conjugate(v, f));
      }
    }
  });
});

describe('rule cards', () => {
  it('opens 4 of 8 segments: 11 lessons, 37 rules', () => {
    expect(CONJ_N5.segments).toHaveLength(8);
    expect(CONJ_N5.segments.filter((s) => s.lessons.length)).toHaveLength(4);
    expect(CONJ_N5.lessons).toHaveLength(11);
    expect(rules).toHaveLength(37);
    for (const l of CONJ_N5.lessons) expect(l.words.length, l.id).toBeGreaterThanOrEqual(3);
  });

  it('gives every usable word + form exactly one rule (mixed rules aside)', () => {
    for (const v of CONJ_VERBS) {
      for (const f of VERB_FORMS) {
        const own = rules.filter((r) => !r.mixed && r.form === f && r.words.includes(v.id)).map((r) => r.id);
        expect(own.length, `${v.id} ${f}: ${own.join(',')}`).toBe(canUse(v, f) ? 1 : 0);
      }
      expect(rules.filter((r) => r.form === null && r.words.includes(v.id)), v.id).toHaveLength(1);
    }
  });

  it('never uses a word in a form it skips', () => {
    for (const r of rules) {
      if (!r.form) continue;
      for (const id of r.words) expect(canUse(verbById(id), r.form), `${r.id} ${id}`).toBe(true);
    }
    for (const id of NOT_VOLITIONAL) expect(canUse(verbById(id), 'tai')).toBe(false);
  });

  it('writes only true changes on the cards (X → Y)', () => {
    // ทุกรูปของทุกคำ → คำไหนบ้าง (ใช้ตรวจตัวอย่างในคำอธิบาย)
    const owner = new Map<string, Set<string>>();
    const add = (text: string, id: string) => owner.set(text, (owner.get(text) ?? new Set()).add(id));
    for (const v of CONJ_VERBS) {
      add(v.kana, v.id);
      if (v.kanji) add(v.kanji, v.id);
      for (const f of VERB_FORMS) add(conjugate(v, f), v.id);
    }
    let pairs = 0;
    for (const r of rules) {
      for (const text of [r.pattern, r.title, ...r.explain, r.note ?? '']) {
        // "かう → かって" · "のみます (ดื่ม) → のみません" — เฉพาะรูปเต็มของคำ (ท้ายรูปลอยๆ เช่น ます → ました ไม่อยู่ในรายการ)
        for (const [, a, b] of text.matchAll(/([ぁ-んァ-ヶー]{2,})(?: \([^)]*\))? → ([ぁ-んァ-ヶー]{2,})/g)) {
          const from = owner.get(a!);
          if (!from) continue;
          const to = owner.get(b!);
          expect(to && [...from].some((id) => to.has(id)), `${r.id}: ${a} → ${b}`).toBe(true);
          pairs++;
        }
      }
    }
    expect(pairs).toBeGreaterThan(40);
  });

  it('labels every form', () => {
    for (const f of VERB_FORMS) {
      expect(FORM_INFO[f].ask).toBeTruthy();
      // โจทย์ของรูปที่ต่อจาก ます ต้องไม่เฉลยท้ายรูป (ยกเว้นรูป ます ซึ่งถามที่ตัวคำ)
      if (POLITE_END[f] && f !== 'masu') expect(FORM_INFO[f].ask).not.toContain(POLITE_END[f]!);
    }
  });
});
