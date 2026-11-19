import { lessonCode, type LineDeck, type LineLesson, type LineSegment } from '../../data/line';
import { dayNumber } from '../../lib/day';
import { dueDay, type CharStat, type ProgressData, type ScriptProgress } from '../progress/progressLogic';
import type { RouteStop, StationState } from '../progress/stations';

/**
 * ตรรกะของสายบทเรียน (ใช้ร่วมกันระหว่างคำศัพท์และคันจิ)
 * บท = สถานี: "ผ่าน" เมื่อทุกรายการในบทเคยตอบถูกในแบบทดสอบอย่างน้อย 1 ครั้ง
 * (ความคืบหน้ารายรายการเก็บใน ProgressData.scripts[deck.progressKey][id] — โครงเดียวกับตัวอักษร
 *  จึงติดไปกับไฟล์สำรองและรวมข้อมูลข้ามเครื่องได้ด้วย lastSeen)
 * รอบทบทวนใช้กล่องทบทวนแบบเดียวกับตัวอักษร (progressLogic.dueDay)
 */

type Item = { id: string };

export function deckProgress(deck: LineDeck, data: ProgressData): ScriptProgress | undefined {
  return data.scripts[deck.progressKey];
}

export function wordPassed(word: Item, progress: ScriptProgress | undefined): boolean {
  return (progress?.[word.id]?.correct ?? 0) > 0;
}

export function lessonPassed(deck: LineDeck, lesson: LineLesson, progress: ScriptProgress | undefined): boolean {
  return lesson.words.every((id) => wordPassed(deck.words[id]!, progress));
}

/** สถานะของทุกบท: ผ่านแล้ว / บทถัดไป (บทแรกที่ยังไม่ผ่าน) / ยังไม่ถึง */
export function lessonStates(deck: LineDeck, progress: ScriptProgress | undefined): StationState[] {
  const passed = deck.lessons.map((l) => lessonPassed(deck, l, progress));
  const next = passed.indexOf(false);
  return passed.map((p, i) => (p ? 'done' : i === next ? 'current' : 'todo'));
}

export function nextLesson(deck: LineDeck, progress: ScriptProgress | undefined): LineLesson | null {
  return deck.lessons.find((l) => !lessonPassed(deck, l, progress)) ?? null;
}

/** จำนวนรายการที่เคยตอบถูกแล้ว */
export function wordsPassed(deck: LineDeck, progress: ScriptProgress | undefined): number {
  return Object.values(deck.words).filter((w) => wordPassed(w, progress)).length;
}

/** บทเรียนเป็นจุดจอดบนแผนที่สาย (กดเพื่อเข้าบท) */
export function lessonStops(
  deck: LineDeck,
  lessons: readonly LineLesson[],
  hrefOf: (lessonId: string) => string,
): RouteStop[] {
  return lessons.map((l) => {
    const code = lessonCode(deck, l);
    return { code, name: l.name, reading: l.title, label: `${code} ${l.title}`, href: hrefOf(l.id) };
  });
}

export interface SegmentSummary {
  segment: LineSegment;
  /** สถานะของแต่ละบทในช่วง (ตามสถานะทั้งสาย: บทถัดไปมีได้บทเดียวทั้งสาย) */
  states: StationState[];
  passed: number;
  /** ช่วงที่มีบทถัดไปอยู่ */
  current: boolean;
  /** เลขสถานีแรก–สุดท้าย เช่น "N01–N07" (ช่วงที่ยังไม่เปิด = '') */
  range: string;
}

/** สรุปทุกช่วงของสาย (ใช้หน้าแผนที่สาย) */
export function segmentSummaries(deck: LineDeck, progress: ScriptProgress | undefined): SegmentSummary[] {
  const all = lessonStates(deck, progress);
  return deck.segments.map((segment) => {
    const states = segment.lessons.map((l) => all[deck.lessons.indexOf(l)]!);
    const first = segment.lessons[0];
    const last = segment.lessons.at(-1);
    return {
      segment,
      states,
      passed: states.filter((s) => s === 'done').length,
      current: states.includes('current'),
      range: first && last ? `${lessonCode(deck, first)}–${lessonCode(deck, last)}` : '',
    };
  });
}

// ───────────── ทบทวน ─────────────

export interface WordStat<T extends Item = Item> {
  word: T;
  stat: CharStat;
}

export interface DueWord<T extends Item = Item> extends WordStat<T> {
  /** เลยรอบมากี่วัน (0 = ถึงรอบวันนี้พอดี) */
  overdue: number;
}

/** รายการที่ถึงรอบทบทวน เรียงจากกล่องต่ำ (น่าห่วง) และเลยรอบนานที่สุดก่อน */
export function dueWords<T extends Item>(deck: LineDeck<T>, progress: ScriptProgress | undefined, now: number): DueWord<T>[] {
  if (!progress) return [];
  const today = dayNumber(now);
  const out: DueWord<T>[] = [];
  for (const word of Object.values(deck.words)) {
    const stat = progress[word.id];
    const due = dueDay(stat);
    if (stat && due !== null && due <= today) out.push({ word, stat, overdue: today - due });
  }
  return out.sort((a, b) => a.stat.box - b.stat.box || b.overdue - a.overdue);
}

/** รายการที่ผิดบ่อย: เคยตอบผิดและยังไม่กลับมาแม่น (กล่อง ≤ 2) เรียงจากน่าห่วงที่สุด — เกณฑ์เดียวกับตัวอักษร */
export function weakWords<T extends Item>(deck: LineDeck<T>, progress: ScriptProgress | undefined): WordStat<T>[] {
  if (!progress) return [];
  const out: WordStat<T>[] = [];
  for (const word of Object.values(deck.words)) {
    const stat = progress[word.id];
    if (stat && stat.wrong > 0 && stat.box <= 2) out.push({ word, stat });
  }
  return out.sort(
    (a, b) => a.stat.box - b.stat.box || b.stat.wrong - a.stat.wrong || (b.stat.lastWrong ?? 0) - (a.stat.lastWrong ?? 0),
  );
}

/** รอบทบทวนครั้งถัดไป (หลังวันนี้): อีกกี่วัน และมีกี่รายการ */
export function nextWordReview(
  deck: LineDeck,
  progress: ScriptProgress | undefined,
  now: number,
): { inDays: number; count: number } | null {
  if (!progress) return null;
  const today = dayNumber(now);
  let best: number | null = null;
  let count = 0;
  for (const word of Object.values(deck.words)) {
    const due = dueDay(progress[word.id]);
    if (due === null || due <= today) continue;
    if (best === null || due < best) {
      best = due;
      count = 1;
    } else if (due === best) count++;
  }
  return best === null ? null : { inDays: best - today, count };
}

/** เคยทำแบบทดสอบบ้างหรือยัง (ยัง = ยังไม่มีนัดทบทวน) */
export const wordsAnswered = (progress: ScriptProgress | undefined) =>
  !!progress && Object.values(progress).some((s) => s.answeredAt !== null);

/** ฝึก/ตอบครั้งล่าสุดเมื่อไร (0 = ยังไม่เคย) — หน้าแรกใช้เลือกว่าจะชี้สายไหน */
export const lastStudied = (progress: ScriptProgress | undefined) =>
  progress ? Math.max(0, ...Object.values(progress).map((s) => s.lastSeen)) : 0;

const lessonIndex = new WeakMap<LineDeck, Map<string, LineLesson>>();

/** บทที่รายการนี้อยู่ (ใช้เลือกตัวหลอกจากบทเดียวกันตอนทบทวนรายการจากหลายบท) */
export function lessonOfWord(deck: LineDeck, wordId: string): LineLesson | undefined {
  let map = lessonIndex.get(deck);
  if (!map) {
    map = new Map(deck.lessons.flatMap((l) => l.words.map((id) => [id, l] as const)));
    lessonIndex.set(deck, map);
  }
  return map.get(wordId);
}

/** ทบทวนรอบละไม่เกินกี่รายการ (เท่ากับตัวอักษร) */
export const REVIEW_BATCH_SIZE = 20;
