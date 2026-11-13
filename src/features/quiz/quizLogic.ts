import { readingsOf, sameReading } from '../../data/scripts';
import type { CharEntry } from '../../data/types';
import type { QuestionType } from '../settings/settings';

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  answer: CharEntry;
  /** ตัวเลือก 4 ข้อ (สำหรับข้อแบบเขียน จะเป็น array ว่าง) */
  choices: CharEntry[];
}

export type Random = () => number;

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** สุ่มแบบถ่วงน้ำหนัก ไม่ซ้ำกันจนกว่าจะครบทุกตัว แล้วจึงเริ่มรอบใหม่ */
export function weightedSample<T>(
  items: readonly T[],
  weight: (item: T) => number,
  count: number,
  random: Random,
): T[] {
  const w = (item: T) => Math.max(0.0001, weight(item));
  const out: T[] = [];
  let bag: T[] = [];
  while (out.length < count && items.length > 0) {
    if (bag.length === 0) bag = [...items];
    // ต้นรอบใหม่: ไม่ให้ตัวสุดท้ายของรอบก่อนออกซ้ำติดกัน
    const last = out.at(-1);
    const candidates = bag.length > 1 && last !== undefined ? bag.filter((b) => b !== last) : bag;
    let r = random() * candidates.reduce((s, b) => s + w(b), 0);
    const pick = candidates.find((b) => (r -= w(b)) <= 0) ?? candidates[candidates.length - 1]!;
    bag.splice(bag.indexOf(pick), 1);
    out.push(pick);
  }
  return out;
}

/**
 * ตัวอักษรที่น่าจะสับสนกับตัวนี้:
 * - หน้าตาคล้ายกัน (similar)
 * - ตัวขุ่น/ไม่ขุ่นของกันและกัน (か↔が, ば↔ぱ)
 * - ตัวขุ่นของตัวที่หน้าคล้ายกัน (ぐ↔べ เพราะ く คล้าย へ)
 */
export function confusablesOf(answer: CharEntry, all: readonly CharEntry[]): Set<string> {
  const baseChar = answer.base ?? answer.char;
  const baseSimilar = new Set(
    (answer.base ? all.find((c) => c.char === answer.base)?.similar : answer.similar) ?? [],
  );
  const out = new Set<string>(answer.similar ?? []);
  for (const c of all) {
    if (c.id === answer.id) continue;
    const sameFamily = c.char === baseChar || c.base === baseChar;
    const voicedLookalike = !!answer.base && !!c.base && baseSimilar.has(c.base);
    if (sameFamily || voicedLookalike) out.add(c.char);
  }
  return out;
}

/**
 * เลือกตัวหลอก n ตัว:
 * - ไม่เอาตัวที่อ่านเหมือนคำตอบ (เช่น じ/ぢ) และไม่ให้ตัวเลือกอ่านซ้ำกันเอง
 * - ใช้ตัวในขอบเขตที่ผู้ใช้เลือกก่อน ถ้าไม่พอจึงดึงจากทั้งชุด
 * - ใส่ตัวที่หน้าตาคล้ายกันไม่เกิน 2 ตัว เพื่อฝึกแยกแยะ
 */
export function pickDistractors(
  answer: CharEntry,
  pool: readonly CharEntry[],
  all: readonly CharEntry[],
  random: Random,
  n = 3,
): CharEntry[] {
  const chosen: CharEntry[] = [];
  const ok = (c: CharEntry) =>
    c.id !== answer.id &&
    !sameReading(c, answer) &&
    !chosen.some((x) => x.id === c.id || sameReading(x, c));

  const confusable = confusablesOf(answer, all);
  const inPool = shuffle(pool, random);
  for (const c of inPool) {
    if (chosen.length >= Math.min(2, n)) break;
    if (confusable.has(c.char) && ok(c)) chosen.push(c);
  }
  for (const c of inPool) {
    if (chosen.length >= n) break;
    if (ok(c)) chosen.push(c);
  }
  if (chosen.length < n) {
    // ขอบเขตแคบเกินไป — เติมจากตัวพื้นฐานของทั้งชุดก่อน แล้วค่อยตัวอื่น
    const rest = shuffle(all, random).sort((a, b) => Number(!!a.base) - Number(!!b.base));
    for (const c of rest) {
      if (chosen.length >= n) break;
      if (ok(c)) chosen.push(c);
    }
  }
  return chosen;
}

export interface BuildQuizOptions {
  pool: readonly CharEntry[];
  all: readonly CharEntry[];
  types: readonly QuestionType[];
  count: number;
  weightOf: (entry: CharEntry) => number;
  random?: Random;
}

export function buildQuiz({
  pool,
  all,
  types,
  count,
  weightOf,
  random = Math.random,
}: BuildQuizOptions): QuizQuestion[] {
  if (pool.length === 0 || types.length === 0) return [];
  const answers = weightedSample(pool, weightOf, count, random);
  return answers.map((answer, id) => {
    const type = types[Math.floor(random() * types.length)]!;
    const choices =
      type === 'readingToWrite'
        ? []
        : shuffle([answer, ...pickDistractors(answer, pool, all, random)], random);
    return { id, type, answer, choices };
  });
}

/** ตรวจคำตอบแบบตัวเลือก — ถือว่าถูกถ้าอ่านเหมือนกัน (เช่นเลือก ぢ ในข้อ "ji") */
export function isCorrectChoice(question: QuizQuestion, choice: CharEntry): boolean {
  if (choice.id === question.answer.id) return true;
  if (question.type === 'charToReading') return false;
  const answerReadings = readingsOf(question.answer);
  return readingsOf(choice).some((r) => answerReadings.includes(r));
}
