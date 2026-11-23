import { lessonWords, type LineLesson } from '../../data/line';
import type { TravelDeck, TravelPhrase } from '../../data/travel/types';
import { shuffle, type Rng } from '../../lib/shuffle';
import { lessonOfWord } from '../line/lineLogic';

/**
 * คำถามของสายท่องเที่ยว (ตรรกะสถานี/ตรา/ทบทวนใช้ features/line/lineLogic.ts ร่วมกับสายอื่น)
 * - say:     อ่านสถานการณ์ภาษาไทย → เลือกวลีที่ควรพูด (เฉพาะวลีที่พูด)
 * - meaning: ดูวลี (คานะ + โรมาจิ) → เลือกความหมาย
 * - listen:  ฟังเสียงอย่างเดียว → เลือกความหมาย (ต้องมีเสียงภาษาญี่ปุ่นในเครื่อง ไม่มีก็ใช้ meaning แทน)
 * - arrange: ความหมาย → เรียงชิ้นวลี (เฉพาะวลีที่ทำเครื่องหมาย · แบบฝึกเท่านั้น)
 */

export type TravelQType = 'say' | 'meaning' | 'listen' | 'arrange';

export interface TravelQuestion {
  id: string;
  type: TravelQType;
  phrase: TravelPhrase;
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

const bare = (x: TravelPhrase) => x.kana.replace(/[\s、。？！]/g, '');

/** วลีหนึ่งอยู่ในอีกวลี (いくらですか กับ しんじゅくまで いくらですか) — ไม่ใช้เป็นตัวหลอกของกันและกัน */
export const phrasesOverlap = (a: TravelPhrase, b: TravelPhrase) => bare(a).includes(bare(b)) || bare(b).includes(bare(a));

/** ตัวหลอก 3 ตัว: บทเดียวกันก่อน แล้วจึงทั้งสาย */
function pickOthers(
  x: TravelPhrase,
  near: readonly TravelPhrase[],
  all: readonly TravelPhrase[],
  ok: (o: TravelPhrase) => boolean,
  rng: Rng,
): TravelPhrase[] {
  const picked: TravelPhrase[] = [];
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
  type: TravelQType,
  x: TravelPhrase,
  pool: { near: readonly TravelPhrase[]; all: readonly TravelPhrase[] },
  { audio, rng = Math.random }: Opts,
  key: string,
): TravelQuestion {
  // ใช้แบบที่ทำได้: ข้อพูด/เรียงใช้กับวลีที่พูดเท่านั้น · ข้อฟังต้องมีเสียง
  let t = type;
  if (t === 'arrange' && !x.arrange) t = 'say';
  if (t === 'say' && x.kind !== 'say') t = 'listen';
  if (t === 'listen' && !audio) t = 'meaning';
  const q: TravelQuestion = { id: `${t}:${x.id}:${key}`, type: t, phrase: x, choices: [], answer: '', tiles: [] };
  if (t === 'say') {
    const others = pickOthers(x, pool.near, pool.all, (o) => o.kind === 'say' && !phrasesOverlap(o, x), rng);
    q.choices = shuffle([x, ...others], rng).map((o) => o.id);
    q.answer = x.id;
  } else if (t === 'arrange') {
    q.tiles = shuffledTiles(x.kanaSentence.chunks.length, rng);
    q.answer = x.kanaSentence.plain;
  } else {
    const others = pickOthers(x, pool.near, pool.all, (o) => o.thai !== x.thai, rng);
    q.choices = shuffle([x, ...others], rng).map((o) => o.thai);
    q.answer = x.thai;
  }
  return q;
}

/**
 * แบบฝึก: วลีละ 2 ข้อ — วลีที่พูด: เลือกวลีที่ควรพูด + เรียงวลี (หรือฟัง) · วลีที่ได้ยิน: ฟัง + อ่านความหมาย
 * ไม่นับเป็นผลสอบ
 */
export function practiceQuestions(deck: TravelDeck, lesson: LineLesson, opts: Opts): TravelQuestion[] {
  const items = lessonWords(deck, lesson);
  const pool = { near: items, all: Object.values(deck.words) };
  const qs = items.flatMap((x) =>
    x.kind === 'say'
      ? [make('say', x, pool, opts, '1'), make(x.arrange ? 'arrange' : 'listen', x, pool, opts, '2')]
      : [make('listen', x, pool, opts, '1'), make('meaning', x, pool, opts, '2')],
  );
  return shuffle(qs, opts.rng);
}

/** ข้อสอบ: วลีละ 1 ข้อ — วลีที่พูด = เลือกวลีที่ควรพูด · วลีที่ได้ยิน = ฟังแล้วเลือกความหมาย */
function oneEach(items: readonly TravelPhrase[], near: (x: TravelPhrase) => readonly TravelPhrase[], all: readonly TravelPhrase[], opts: Opts) {
  return shuffle(items, opts.rng).map((x) => make(x.kind === 'say' ? 'say' : 'listen', x, { near: near(x), all }, opts, 't'));
}

/** แบบทดสอบ: วลีละ 1 ข้อ — ถูกครบทุกวลี = ผ่านสถานี */
export function testQuestions(deck: TravelDeck, lesson: LineLesson, opts: Opts & { only?: readonly string[] }): TravelQuestion[] {
  const items = lessonWords(deck, lesson);
  return oneEach(
    items.filter((x) => !opts.only || opts.only.includes(x.id)),
    () => items,
    Object.values(deck.words),
    opts,
  );
}

/** แบบทดสอบทบทวน: วลีจากหลายบท (ตัวหลอกมาจากบทของวลีนั้นก่อน) */
export function reviewQuestions(deck: TravelDeck, items: readonly TravelPhrase[], opts: Opts): TravelQuestion[] {
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
