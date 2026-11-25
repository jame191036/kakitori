import { describe, expect, it } from 'vitest';
import { N5_DECK } from '../vocab/n5';
import { conjugate, NAI_END, otherEnds, POLITE_END, stepsTo, tilesOf, wrongForms } from './conjugate';
import { CAN_NAIDE, NA_LEFT_OUT, NA_LOOKS_I, NOT_VOLITIONAL, SKIP_FORMS, TRICKY_GROUP1, WILL_FORMS } from './lists';
import { CONJ_N5 } from './n5';
import { ALL_FORMS, FORM_INFO, FORMS_OF, I_FORMS, NA_FORMS, type Form } from './types';
import { canUse, CONJ_I, CONJ_NA, CONJ_VERBS, CONJ_WORDS, endingOf, looksLikeGroup2, SURU_NOUNS, wordById } from './words';

const rules = Object.values(CONJ_N5.words);

/** คำตอบที่เขียนมือ ครบทุกตัวท้ายและทุกข้อยกเว้น: [masu, te, ta, nai] */
const EXPECTED: Record<string, [masu: string, te: string, ta: string, nai: string]> = {
  kau: ['かいます', 'かって', 'かった', 'かわない'],
  iu: ['いいます', 'いって', 'いった', 'いわない'],
  kaku: ['かきます', 'かいて', 'かいた', 'かかない'],
  iku: ['いきます', 'いって', 'いった', 'いかない'],
  oyogu: ['およぎます', 'およいで', 'およいだ', 'およがない'],
  nugu: ['ぬぎます', 'ぬいで', 'ぬいだ', 'ぬがない'],
  hanasu: ['はなします', 'はなして', 'はなした', 'はなさない'],
  matsu: ['まちます', 'まって', 'まった', 'またない'],
  shinu: ['しにます', 'しんで', 'しんだ', 'しなない'],
  asobu: ['あそびます', 'あそんで', 'あそんだ', 'あそばない'],
  nomu: ['のみます', 'のんで', 'のんだ', 'のまない'],
  noru: ['のります', 'のって', 'のった', 'のらない'],
  aru: ['あります', 'あって', 'あった', 'ない'],
  kaeru: ['かえります', 'かえって', 'かえった', 'かえらない'],
  hairu: ['はいります', 'はいって', 'はいった', 'はいらない'],
  hashiru: ['はしります', 'はしって', 'はしった', 'はしらない'],
  shiru: ['しります', 'しって', 'しった', 'しらない'],
  'kiru-cut': ['きります', 'きって', 'きった', 'きらない'],
  'kiru-wear': ['きます', 'きて', 'きた', 'きない'],
  'iru-need': ['いります', 'いって', 'いった', 'いらない'],
  'iru-exist': ['います', 'いて', 'いた', 'いない'],
  taberu: ['たべます', 'たべて', 'たべた', 'たべない'],
  miru: ['みます', 'みて', 'みた', 'みない'],
  deru: ['でます', 'でて', 'でた', 'でない'],
  kariru: ['かります', 'かりて', 'かりた', 'かりない'],
  suru: ['します', 'して', 'した', 'しない'],
  kuru: ['きます', 'きて', 'きた', 'こない'],
  'benkyou-suru': ['べんきょうします', 'べんきょうして', 'べんきょうした', 'べんきょうしない'],
  'kopii-suru': ['コピーします', 'コピーして', 'コピーした', 'コピーしない'],
};

/** คุณศัพท์ที่เขียนมือ ตามลำดับ I_FORMS / NA_FORMS */
const EXPECTED_I: Record<string, string[]> = {
  takai: ['たかくない', 'たかかった', 'たかくなかった', 'たかくて', 'たかく', 'たかかったです'],
  oishii: ['おいしくない', 'おいしかった', 'おいしくなかった', 'おいしくて', 'おいしく', 'おいしかったです'],
  kawaii: ['かわいくない', 'かわいかった', 'かわいくなかった', 'かわいくて', 'かわいく', 'かわいかったです'],
  sukunai: ['すくなくない', 'すくなかった', 'すくなくなかった', 'すくなくて', 'すくなく', 'すくなかったです'],
  ooi: ['おおくない', 'おおかった', 'おおくなかった', 'おおくて', 'おおく', 'おおかったです'],
  ii: ['よくない', 'よかった', 'よくなかった', 'よくて', 'よく', 'よかったです'],
};
const EXPECTED_NA: Record<string, string[]> = {
  shizuka: [
    'しずかじゃありません',
    'しずかでした',
    'しずかじゃありませんでした',
    'しずかじゃない',
    'しずかだった',
    'しずかじゃなかった',
    'しずかな',
    'しずかで',
    'しずかに',
  ],
  kirei: [
    'きれいじゃありません',
    'きれいでした',
    'きれいじゃありませんでした',
    'きれいじゃない',
    'きれいだった',
    'きれいじゃなかった',
    'きれいな',
    'きれいで',
    'きれいに',
  ],
};

describe('words', () => {
  it('covers every N5 verb and adjective plus the suru nouns', () => {
    const of = (kind: string) => Object.values(N5_DECK.words).filter((w) => w.kind === kind).length;
    expect(CONJ_VERBS).toHaveLength(of('verb') + Object.keys(SURU_NOUNS).length);
    expect(CONJ_I).toHaveLength(of('adj-i'));
    expect(CONJ_NA).toHaveLength(of('adj-na') - NA_LEFT_OUT.length);
    expect(new Set(CONJ_WORDS.map((v) => v.id)).size).toBe(CONJ_WORDS.length);
    const count = (g: number) => CONJ_VERBS.filter((v) => v.group === g).length;
    expect([count(1), count(2), count(3)]).toEqual([76, 30, 13]);
    for (const v of CONJ_I) expect(v.kana.endsWith('い') && v.group === null, v.id).toBe(true);
  });

  it('gets every verb group from the ending, with only the listed exceptions', () => {
    for (const v of CONJ_VERBS) {
      if (v.group === 2) expect(looksLikeGroup2(v.kana), v.id).toBe(true);
      if (v.group === 3) expect(/(する|くる)$/.test(v.kana), v.id).toBe(true);
    }
    const tricky = CONJ_VERBS.filter((v) => v.group === 1 && looksLikeGroup2(v.kana)).map((v) => v.id);
    expect(tricky.sort()).toEqual([...TRICKY_GROUP1].sort());
  });

  it('lists only words that exist', () => {
    for (const id of [...TRICKY_GROUP1, ...NOT_VOLITIONAL, ...Object.keys(SKIP_FORMS)]) expect(wordById(id).id).toBe(id);
    expect(new Set(NOT_VOLITIONAL).size).toBe(NOT_VOLITIONAL.length);
    for (const id of CAN_NAIDE) expect(NOT_VOLITIONAL).toContain(id);
    for (const id of NA_LEFT_OUT) expect(N5_DECK.words[id]?.kind, id).toBe('adj-na');
    expect(CONJ_NA.filter((v) => v.kana.endsWith('い')).map((v) => v.id).sort()).toEqual([...NA_LOOKS_I].sort());
  });
});

describe('conjugation', () => {
  it('matches the hand-written verb answers', () => {
    for (const [id, answers] of Object.entries(EXPECTED)) {
      const v = wordById(id);
      expect((['masu', 'te', 'ta', 'nai'] as const).map((f) => conjugate(v, f)), id).toEqual(answers);
    }
    const endings = new Set(CONJ_VERBS.filter((v) => v.group === 1).map(endingOf));
    const tested = new Set(Object.keys(EXPECTED).map(wordById).filter((v) => v.group === 1).map(endingOf));
    expect(tested).toEqual(endings);
  });

  it('matches the hand-written adjective answers', () => {
    for (const [id, answers] of Object.entries(EXPECTED_I)) expect(I_FORMS.map((f) => conjugate(wordById(id), f)), id).toEqual(answers);
    for (const [id, answers] of Object.entries(EXPECTED_NA)) expect(NA_FORMS.map((f) => conjugate(wordById(id), f)), id).toEqual(answers);
  });

  it('builds the polite and nai families on one stem', () => {
    for (const v of CONJ_VERBS) {
      for (const [base, family] of [['masu', POLITE_END], ['nai', NAI_END]] as const) {
        const stem = conjugate(v, base).slice(0, -2);
        for (const [form, end] of Object.entries(family)) {
          expect(conjugate(v, form as Form), `${v.id} ${form}`).toBe(stem + end);
        }
      }
    }
  });

  it('never mixes word kinds', () => {
    expect(() => conjugate(wordById('takai'), 'masu')).toThrow();
    expect(() => conjugate(wordById('nomu'), 'kunai')).toThrow();
  });

  it('splits each form into tiles that spell it', () => {
    for (const v of CONJ_WORDS) {
      for (const f of FORMS_OF[v.kind]) {
        const tiles = tilesOf(v, f);
        expect(tiles.join(''), `${v.id} ${f}`).toBe(conjugate(v, f));
        expect(tiles.length, `${v.id} ${f}`).toBeGreaterThanOrEqual(2);
        expect(tiles.length, `${v.id} ${f}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('shows steps that start at the dictionary form and end at the answer', () => {
    for (const v of CONJ_WORDS) {
      for (const f of FORMS_OF[v.kind]) {
        const steps = stepsTo(v, f);
        expect(steps[0]).toBe(v.kana);
        expect(steps.at(-1)).toBe(conjugate(v, f));
        expect(steps.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it('offers wrong forms that are never the right one', () => {
    for (const v of CONJ_WORDS) {
      for (const f of FORMS_OF[v.kind]) {
        if (!canUse(v, f)) continue;
        const { stem, ending } = wrongForms(v, f);
        expect(stem.length, `${v.id} ${f}`).toBeGreaterThanOrEqual(3);
        expect([...stem, ...ending], `${v.id} ${f}`).not.toContain(conjugate(v, f));
      }
    }
  });

  it('never offers a second correct answer', () => {
    // รูปที่ถูกทั้งคู่หรือพูดได้จริง ต้องไม่อยู่ในตัวเลือกผิด
    for (const v of CONJ_NA) {
      for (const f of NA_FORMS) {
        const all = Object.values(wrongForms(v, f)).flat();
        for (const also of ['ではありません', 'ではない', 'ではなかった', 'じゃないです', 'だったです']) {
          expect(all, `${v.id} ${f}`).not.toContain(v.kana + also);
        }
        // げんきない / げんきありません = "ไม่มีแรง" พูดได้จริง
        expect(all, `${v.id} ${f}`).not.toContain(`${v.kana}ない`);
        expect(all, `${v.id} ${f}`).not.toContain(`${v.kana}ありません`);
      }
    }
    for (const v of CONJ_I) {
      for (const f of I_FORMS) {
        if (!canUse(v, f)) continue;
        const all = Object.values(wrongForms(v, f)).flat();
        for (const also of ['じゃない', 'じゃありません']) expect(all, `${v.id} ${f}`).not.toContain(v.kana + also);
        // รูปกันเองกับรูปสุภาพของอดีตถูกทั้งคู่ถ้าไม่ระบุ — ไม่ใช้เป็นตัวหลอกของกัน
        if (f === 'katta') expect(all, v.id).not.toContain(conjugate(v, 'kattadesu'));
        if (f === 'kattadesu') expect(all, v.id).not.toContain(conjugate(v, 'katta'));
        // やすく、おいしい (ภาษาเขียน) ใช้ く เชื่อมได้
        if (f === 'kute') expect(all, v.id).not.toContain(conjugate(v, 'ku'));
      }
    }
    // かわないで いいです · かわなくて いいです พูดได้จริง
    for (const v of CONJ_VERBS) {
      if (!canUse(v, 'nakutemo')) continue;
      const all = Object.values(wrongForms(v, 'nakutemo')).flat();
      const stem = conjugate(v, 'nai').slice(0, -2);
      for (const also of ['ないで', 'なくて', 'なければ']) expect(all, v.id).not.toContain(stem + also);
      expect(otherEnds('nakutemo')).not.toContain('ないで');
    }
  });
});

describe('rule cards', () => {
  it('opens all 8 segments: 22 lessons, 78 rules', () => {
    expect(CONJ_N5.segments).toHaveLength(8);
    expect(CONJ_N5.segments.every((s) => s.lessons.length > 0)).toBe(true);
    expect(CONJ_N5.lessons).toHaveLength(22);
    expect(rules).toHaveLength(78);
    for (const l of CONJ_N5.lessons) expect(l.words.length, l.id).toBeGreaterThanOrEqual(3);
  });

  it('keeps the lessons of round 1 in place', () => {
    expect(CONJ_N5.lessons.slice(0, 11).map((l) => l.id)).toEqual([
      'c-groups',
      'c-tricky',
      'c-masu-23',
      'c-masu-1',
      'c-masen',
      'c-masenka',
      'c-te-23',
      'c-te-tte',
      'c-te-nde',
      'c-te-ite',
      'c-ta',
    ]);
  });

  it('gives every usable word + form exactly one rule (mixed and reverse rules aside)', () => {
    for (const v of CONJ_WORDS) {
      for (const f of ALL_FORMS) {
        const own = rules.filter((r) => !r.mixed && !r.reverse && r.form === f && r.words.includes(v.id)).map((r) => r.id);
        const want = FORM_INFO[f].kind === v.kind && canUse(v, f) ? 1 : 0;
        expect(own.length, `${v.id} ${f}: ${own.join(',')}`).toBe(want);
      }
      const groupRules = rules.filter((r) => r.form === null && r.words.includes(v.id));
      expect(groupRules, v.id).toHaveLength(v.kind === 'verb' ? 1 : 0);
    }
  });

  it('never uses a word in a form it skips', () => {
    for (const r of rules) {
      if (!r.form) continue;
      for (const id of r.words) expect(canUse(wordById(id), r.form), `${r.id} ${id}`).toBe(true);
    }
    for (const id of NOT_VOLITIONAL) {
      for (const f of WILL_FORMS) expect(canUse(wordById(id), f), `${id} ${f}`).toBe(f === 'naide' && CAN_NAIDE.includes(id));
    }
  });

  it('covers masu, te and nai back to the dictionary form, once per word', () => {
    const reverse = rules.filter((r) => r.reverse);
    expect(reverse.map((r) => r.form)).toEqual(['masu', 'masu', 'masu', 'masu', 'te', 'te', 'te', 'te', 'nai']);
    for (const f of ['masu', 'te', 'nai'] as const) {
      const ids = reverse.filter((r) => r.form === f).flatMap((r) => r.words);
      expect(new Set(ids).size, f).toBe(ids.length);
    }
    const i2 = reverse.find((r) => r.id === 'jisho-masu-i2')!;
    expect(i2.words.map((id) => wordById(id).kana).sort()).toEqual(
      ['みる', 'おきる', 'かりる', 'おりる', 'あびる', 'できる', 'いる', 'きる'].sort(),
    );
  });

  it('writes only true changes on the cards (X → Y)', () => {
    // ทุกรูปของทุกคำ → คำไหนบ้าง (ใช้ตรวจตัวอย่างในคำอธิบาย)
    const owner = new Map<string, Set<string>>();
    const add = (text: string, id: string) => owner.set(text, (owner.get(text) ?? new Set()).add(id));
    for (const v of CONJ_WORDS) {
      add(v.kana, v.id);
      for (const f of FORMS_OF[v.kind]) add(conjugate(v, f), v.id);
    }
    let pairs = 0;
    for (const r of rules) {
      for (const text of [r.pattern, r.title, ...r.explain, r.note ?? '']) {
        // "かう → かって" · "のみます (ดื่ม) → のみません" — เฉพาะรูปเต็มของคำ (ท้ายรูปลอยๆ เช่น ます → ました ไม่อยู่ในรายการ)
        for (const [, a, b] of text.matchAll(/([ぁ-んァ-ヶー]{2,})(?: \([^)]*\))? → ([ぁ-んァ-ヶー]{2,})/g)) {
          const from = owner.get(a!);
          // ない เป็นทั้งรูปของ ある และท้ายรูป — ข้อความ "ない → なければ" คือท้ายรูป
          if (!from || (a === 'ない' && b !== 'ない')) continue;
          const to = owner.get(b!);
          expect(to && [...from].some((id) => to.has(id)), `${r.id}: ${a} → ${b}`).toBe(true);
          pairs++;
        }
      }
    }
    expect(pairs).toBeGreaterThan(110);
  });

  it('labels every form without giving the answer away', () => {
    for (const f of ALL_FORMS) {
      const { ask, ja } = FORM_INFO[f];
      expect(ask).toBeTruthy();
      // รูปที่ถามที่ตัวคำ (ます て た ない) บอกชื่อรูปได้ · รูปที่ถามที่ท้ายรูปต้องไม่เฉลย
      if (!['masu', 'te', 'ta', 'nai'].includes(f) && ja.length > 1) expect(ask, f).not.toContain(ja);
    }
    // โจทย์ของชนิดคำเดียวกันต้องไม่ซ้ำกัน
    for (const kind of ['verb', 'i', 'na'] as const) {
      const asks = FORMS_OF[kind].map((f) => FORM_INFO[f].ask);
      expect(new Set(asks).size, kind).toBe(asks.length);
    }
  });
});
