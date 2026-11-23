import { lessonWords, type LineLesson } from '../../data/line';
import type { PhraseDeck, Phrase } from '../../data/phrase/types';
import { shuffle, type Rng } from '../../lib/shuffle';
import { lessonOfWord } from '../line/lineLogic';

/**
 * คำถามของสายท่องเที่ยว (ตรรกะสถานี/ตรา/ทบทวนใช้ features/line/lineLogic.ts ร่วมกับสายอื่น)
 * - say:     อ่านสถานการณ์ภาษาไทย → เลือกวลีที่ควรพูด (วลีที่พูด) · ความหมาย → เลือกป้าย (ป้าย)
 * - meaning: ดูวลี (คานะ + โรมาจิ) หรือป้าย → เลือกความหมาย
 * - listen:  ฟังเสียงอย่างเดียว → เลือกความหมาย (ต้องมีเสียงภาษาญี่ปุ่นในเครื่อง ไม่มีก็ใช้ meaning แทน)
 * - arrange: ความหมาย → เรียงชิ้นวลี (เฉพาะวลีที่ทำเครื่องหมาย · แบบฝึกเท่านั้น)
 */

export type PhraseQType = 'say' | 'meaning' | 'listen' | 'arrange';

export interface PhraseQuestion {
  id: string;
  type: PhraseQType;
  phrase: Phrase;
  /** say: id ของวลี · meaning/listen: ความหมายไทย (รวมคำตอบทั้งคู่) */
  choices: string[];
  /** say: id ของวลี · meaning/listen: ความหมายไทย · arrange: คานะของวลี */
  answer: string;
  /** arrange: ลำดับชิ้นที่สลับแล้ว (index ของ phrase.kanaSentence.chunks) */
  tiles: number[];
}

interface Opts {
  /** เครื่องนี้มีเสียงภาษาญี่ปุ่น (ไม่มี = ไม่ใช้ข้อฟังอย่างเดียว) */
  audio: boolean;
  rng?: Rng;
}

const bare = (x: Phrase) => x.kana.replace(/[\s、。？！]/g, '');

/**
 * ไม่ใช้เป็นตัวหลอกของกันและกัน: วลีหนึ่งอยู่ในอีกวลี (いくらですか กับ しんじゅくまで いくらですか)
 * หรือข้อมูลระบุว่าใช้แทนกันได้ (avoid — เช่น 袋はいりません กับ だいじょうぶです)
 */
export const phrasesOverlap = (a: Phrase, b: Phrase) =>
  bare(a).includes(bare(b)) || bare(b).includes(bare(a)) || !!a.avoid?.includes(b.id) || !!b.avoid?.includes(a.id);

/** ตัวหลอก 3 ตัว: บทเดียวกันก่อน แล้วจึงทั้งสาย */
function pickOthers(
  x: Phrase,
  near: readonly Phrase[],
  all: readonly Phrase[],
  ok: (o: Phrase) => boolean,
  rng: Rng,
): Phrase[] {
  const picked: Phrase[] = [];
  for (const o of [...shuffle(near, rng), ...shuffle(all, rng)]) {
    if (picked.length === 3) break;
    if (o.id !== x.id && !picked.includes(o) && ok(o)) picked.push(o);
  }
  return picked;
}

/** สลับชิ้นจนไม่ตรงลำดับเดิม (ถ้าทำได้) */
function shuffledTiles(n: number, rng: Rng): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let tries = 0; tries < 10; tries++) {
    const t = shuffle(order, rng);
    if (t.some((v, i) => v !== i)) return t;
  }
  return order.slice().reverse();
}

function make(
  type: PhraseQType,
  x: Phrase,
  pool: { near: readonly Phrase[]; all: readonly Phrase[] },
  { audio, rng = Math.random }: Opts,
  key: string,
): PhraseQuestion {
  // ใช้แบบที่ทำได้: ข้อเรียงใช้กับวลีที่ทำเครื่องหมาย · ข้อเลือกวลีใช้กับวลีที่พูดและป้าย ·
  // ข้อฟังต้องมีเสียง (ป้ายอ่านอย่างเดียว ไม่มีข้อฟัง)
  let t = type;
  if (t === 'arrange' && !x.arrange) t = 'say';
  if (t === 'say' && x.kind === 'hear') t = 'listen';
  if (t === 'listen' && (!audio || x.kind === 'sign')) t = 'meaning';
  const q: PhraseQuestion = { id: `${t}:${x.id}:${key}`, type: t, phrase: x, choices: [], answer: '', tiles: [] };
  if (t === 'say') {
    const others = pickOthers(x, pool.near, pool.all, (o) => o.kind === x.kind && !phrasesOverlap(o, x), rng);
    q.choices = shuffle([x, ...others], rng).map((o) => o.id);
    q.answer = x.id;
  } else if (t === 'arrange') {
    q.tiles = shuffledTiles(x.kanaSentence.chunks.length, rng);
    q.answer = x.kanaSentence.plain;
  } else {
    const others = pickOthers(x, pool.near, pool.all, (o) => o.thai !== x.thai && !phrasesOverlap(o, x), rng);
    q.choices = shuffle([x, ...others], rng).map((o) => o.thai);
    q.answer = x.thai;
  }
  return q;
}

/** แบบข้อของแบบฝึก (วลีละ 2 ข้อ) */
const PRACTICE: Record<Phrase['kind'], (x: Phrase) => [PhraseQType, PhraseQType]> = {
  say: (x) => ['say', x.arrange ? 'arrange' : 'listen'],
  hear: () => ['listen', 'meaning'],
  sign: () => ['meaning', 'say'],
};

/** แบบข้อของแบบทดสอบ/ทบทวน (วลีละ 1 ข้อ) */
const TEST: Record<Phrase['kind'], PhraseQType> = { say: 'say', hear: 'listen', sign: 'meaning' };

/**
 * แบบฝึก: วลีละ 2 ข้อ — วลีที่พูด: เลือกวลีที่ควรพูด + เรียงวลี (หรือฟัง) · วลีที่ได้ยิน: ฟัง + อ่านความหมาย ·
 * ป้าย: ดูป้ายเลือกความหมาย + ดูความหมายเลือกป้าย — ไม่นับเป็นผลสอบ
 */
export function practiceQuestions(deck: PhraseDeck, lesson: LineLesson, opts: Opts): PhraseQuestion[] {
  const items = lessonWords(deck, lesson);
  const pool = { near: items, all: Object.values(deck.words) };
  const qs = items.flatMap((x) => PRACTICE[x.kind](x).map((t, i) => make(t, x, pool, opts, String(i + 1))));
  return shuffle(qs, opts.rng);
}

/** ข้อสอบ: วลีละ 1 ข้อ — วลีที่พูด = เลือกวลีที่ควรพูด · วลีที่ได้ยิน = ฟังแล้วเลือกความหมาย · ป้าย = ดูป้ายแล้วเลือกความหมาย */
function oneEach(items: readonly Phrase[], near: (x: Phrase) => readonly Phrase[], all: readonly Phrase[], opts: Opts) {
  return shuffle(items, opts.rng).map((x) => make(TEST[x.kind], x, { near: near(x), all }, opts, 't'));
}

/** แบบทดสอบ: วลีละ 1 ข้อ — ถูกครบทุกวลี = ผ่านสถานี */
export function testQuestions(deck: PhraseDeck, lesson: LineLesson, opts: Opts & { only?: readonly string[] }): PhraseQuestion[] {
  const items = lessonWords(deck, lesson);
  return oneEach(
    items.filter((x) => !opts.only || opts.only.includes(x.id)),
    () => items,
    Object.values(deck.words),
    opts,
  );
}

/** แบบทดสอบทบทวน: วลีจากหลายบท (ตัวหลอกมาจากบทของวลีนั้นก่อน) */
export function reviewQuestions(deck: PhraseDeck, items: readonly Phrase[], opts: Opts): PhraseQuestion[] {
  return oneEach(
    items,
    (x) => {
      const lesson = lessonOfWord(deck, x.id);
      return lesson ? lessonWords(deck, lesson) : [];
    },
    Object.values(deck.words),
    opts,
  );
}
