import { parseInline, plainOf } from '../../data/grammar/sentence';
import type { GrammarDeck, GrammarExample, GrammarPoint } from '../../data/grammar/types';
import { lessonWords, type LineLesson } from '../../data/line';
import { shuffle, type Rng } from '../../lib/shuffle';
import { lessonOfWord } from '../line/lineLogic';

/**
 * คำถามของสายไวยากรณ์ (ตรรกะสถานี/ตรา/ทบทวนใช้ features/line/lineLogic.ts ร่วมกับคำศัพท์และคันจิ)
 * - fill:    ประโยคที่เว้นส่วนไวยากรณ์ไว้ + คำแปลไทยเป็นคำใบ้ → เลือกส่วนที่หายไป
 * - meaning: ประโยคภาษาญี่ปุ่น → เลือกคำแปลไทย
 * - arrange: คำแปลไทย → เรียงชิ้นประโยค (เฉพาะประโยคที่เรียงได้แบบเดียว · แบบฝึกเท่านั้น)
 */

export type GrammarQType = 'fill' | 'meaning' | 'arrange';

export interface GrammarQuestion {
  id: string;
  type: GrammarQType;
  point: GrammarPoint;
  example: GrammarExample;
  /** fill: markup ของตัวเลือก · meaning: คำแปลไทย (รวมคำตอบทั้งคู่) */
  choices: string[];
  /** คำตอบ: fill = ข้อความแบบเขียนจริงของส่วนที่หายไป · meaning = คำแปลไทย · arrange = ประโยคแบบเขียนจริง */
  answer: string;
  /** arrange: ลำดับชิ้นที่สลับแล้ว (index ของ example.sentence.chunks) */
  tiles: number[];
}

/** ข้อความที่ใช้เทียบคำตอบของตัวเลือก */
export const choiceKey = (q: GrammarQuestion, choice: string) =>
  q.type === 'fill' ? plainOf(parseInline(choice)) : choice;

const canFill = (ex: GrammarExample) => !!ex.sentence.target && ex.wrong.length >= 3;

/** คำแปลไทยของประโยคอื่น — จากบทเดียวกันก่อน แล้วจึงจากทั้งสาย */
function meaningChoices(ex: GrammarExample, near: readonly GrammarExample[], all: readonly GrammarExample[], rng: Rng) {
  const picked: string[] = [];
  for (const other of [...shuffle(near, rng), ...shuffle(all, rng)]) {
    if (picked.length === 3) break;
    if (other.thai !== ex.thai && !picked.includes(other.thai)) picked.push(other.thai);
  }
  return shuffle([ex.thai, ...picked], rng);
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
  type: GrammarQType,
  point: GrammarPoint,
  ex: GrammarExample,
  pool: { near: readonly GrammarExample[]; all: readonly GrammarExample[] },
  rng: Rng,
  key: string,
): GrammarQuestion {
  // ใช้แบบที่ทำได้: ข้อเรียงต้องเป็นประโยคที่ทำเครื่องหมายไว้ · ข้อเติมต้องมีส่วนไวยากรณ์และตัวเลือกผิดพอ
  const t: GrammarQType =
    type === 'arrange' && !ex.arrange ? 'fill' : type === 'fill' && !canFill(ex) ? 'meaning' : type;
  const q: GrammarQuestion = { id: `${t}:${point.id}:${key}`, type: t, point, example: ex, choices: [], answer: '', tiles: [] };
  if (t === 'fill') {
    q.choices = shuffle([ex.sentence.targetSrc, ...shuffle(ex.wrong, rng).slice(0, 3)], rng);
    q.answer = ex.sentence.target;
  } else if (t === 'meaning') {
    q.choices = meaningChoices(ex, pool.near.filter((x) => x !== ex), pool.all.filter((x) => x !== ex), rng);
    q.answer = ex.thai;
  } else {
    q.tiles = shuffledTiles(ex.sentence.chunks.length, rng);
    q.answer = ex.sentence.plain;
  }
  return q;
}

const examplesOf = (points: readonly GrammarPoint[]) => points.flatMap((p) => p.examples);

/**
 * แบบฝึก: ประโยคตัวอย่างละ 1 ข้อ (รูปละ 3 ข้อ) วนแบบ เติม → ความหมาย → เรียง แล้วสลับลำดับทั้งชุด
 * ไม่นับเป็นผลสอบ
 */
export function practiceQuestions(deck: GrammarDeck, lesson: LineLesson, rng: Rng = Math.random): GrammarQuestion[] {
  const points = lessonWords(deck, lesson);
  const pool = { near: examplesOf(points), all: examplesOf(Object.values(deck.words)) };
  const cycle: GrammarQType[] = ['fill', 'meaning', 'arrange'];
  const qs = points.flatMap((p, pi) =>
    p.examples.map((ex, ei) => make(cycle[(pi + ei) % cycle.length]!, p, ex, pool, rng, String(ei))),
  );
  return shuffle(qs, rng);
}

/** ข้อสอบ/ทบทวน: รูปละ 1 ข้อ จากประโยคตัวอย่างที่สุ่ม — เติมคำเป็นหลัก สลับกับความหมาย (ไม่มีข้อเรียง: มีคำตอบเดียวแน่นอน) */
function oneEach(points: readonly GrammarPoint[], pool: { near: readonly GrammarExample[]; all: readonly GrammarExample[] }, rng: Rng) {
  return shuffle(points, rng).map((p, i) => {
    const ei = Math.floor(rng() * p.examples.length);
    return make(i % 3 === 2 ? 'meaning' : 'fill', p, p.examples[ei]!, pool, rng, String(ei));
  });
}

/** แบบทดสอบ: รูปละ 1 ข้อ — ถูกครบทุกรูป = ผ่านสถานี */
export function testQuestions(
  deck: GrammarDeck,
  lesson: LineLesson,
  { rng = Math.random, only }: { rng?: Rng; only?: readonly string[] } = {},
): GrammarQuestion[] {
  const all = lessonWords(deck, lesson);
  const pool = { near: examplesOf(all), all: examplesOf(Object.values(deck.words)) };
  return oneEach(
    all.filter((p) => !only || only.includes(p.id)),
    pool,
    rng,
  );
}

/** แบบทดสอบทบทวน: รูปจากหลายบท รูปละ 1 ข้อ (ตัวหลอกของข้อความหมายมาจากบทของรูปนั้นก่อน) */
export function reviewQuestions(deck: GrammarDeck, items: readonly GrammarPoint[], rng: Rng = Math.random): GrammarQuestion[] {
  const all = examplesOf(Object.values(deck.words));
  return shuffle(items, rng).flatMap((p, i) => {
    const lesson = lessonOfWord(deck, p.id);
    if (!lesson) return [];
    const near = examplesOf(lessonWords(deck, lesson));
    const ei = Math.floor(rng() * p.examples.length);
    return [make(i % 3 === 2 ? 'meaning' : 'fill', p, p.examples[ei]!, { near, all }, rng, String(ei))];
  });
}
