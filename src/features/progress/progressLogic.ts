import type { CharEntry, ScriptPack } from '../../data/types';
import { dayNumber } from '../../lib/day';
import { isRecord } from '../../lib/isRecord';

/**
 * ตรรกะความคืบหน้า (pure functions) — ใช้ระบบ "กล่องทบทวน" แบบ Leitner
 * - ตอบ/เขียนถูก → เลื่อนขึ้น 1 กล่อง แต่เลื่อนได้ไม่เกินวันละครั้ง
 *   ("จำได้แล้ว" จึงต้องตอบถูกอย่างน้อย 5 วัน ไม่ต้องติดกัน)
 * - ตอบ/เขียนผิด → กลับไปกล่อง 0
 * - แต่ละกล่องมีรอบนัดทบทวนห่างขึ้นเรื่อยๆ (REVIEW_INTERVAL_DAYS)
 * - ตัวที่อยู่กล่องต่ำจะถูกสุ่มมาถามบ่อยกว่า
 */

export const MAX_BOX = 5;

/** จำนวนวันจากการตอบครั้งล่าสุดจนถึงรอบทบทวนถัดไป แยกตามกล่อง (กล่อง 0 = ตอบผิด → ทบทวนได้ทันที) */
export const REVIEW_INTERVAL_DAYS: readonly number[] = [0, 1, 2, 4, 7, 14];

export interface CharStat {
  box: number;
  correct: number;
  wrong: number;
  /** จำนวนครั้งที่ฝึกเขียน */
  practiced: number;
  /** คะแนนเขียนอิสระสูงสุด */
  bestScore: number | null;
  /** ฝึกหรือตอบครั้งล่าสุด */
  lastSeen: number;
  lastWrong: number | null;
  /** ตอบคำถาม/เขียนแบบมีตัดสินถูก-ผิดครั้งล่าสุด — ใช้คำนวณรอบทบทวน */
  answeredAt: number | null;
  /** เลื่อนกล่องขึ้นครั้งล่าสุด — ใช้จำกัดให้เลื่อนได้วันละครั้ง */
  promotedAt: number | null;
}

export type ScriptProgress = Readonly<Record<string, CharStat>>;

export interface ProgressData {
  version: 1;
  scripts: Readonly<Record<string, ScriptProgress>>;
}

export const EMPTY_PROGRESS: ProgressData = { version: 1, scripts: {} };

export const emptyStat = (): CharStat => ({
  box: 0,
  correct: 0,
  wrong: 0,
  practiced: 0,
  bestScore: null,
  lastSeen: 0,
  lastWrong: null,
  answeredAt: null,
  promotedAt: null,
});

export function applyAnswer(stat: CharStat | undefined, correct: boolean, now: number): CharStat {
  const s = stat ?? emptyStat();
  if (!correct) {
    return { ...s, box: 0, wrong: s.wrong + 1, lastSeen: now, lastWrong: now, answeredAt: now };
  }
  // กล่อง 0 (เพิ่งผิด/ยังไม่เคยถูก) ขึ้นกล่อง 1 ได้เสมอ ส่วนกล่องอื่นขึ้นได้วันละครั้ง
  const canPromote =
    s.box === 0 || s.promotedAt === null || dayNumber(s.promotedAt) !== dayNumber(now);
  return {
    ...s,
    box: canPromote ? Math.min(MAX_BOX, s.box + 1) : s.box,
    promotedAt: canPromote ? now : s.promotedAt,
    correct: s.correct + 1,
    lastSeen: now,
    answeredAt: now,
  };
}

export function applyPractice(
  stat: CharStat | undefined,
  now: number,
  score?: number,
): CharStat {
  const s = stat ?? emptyStat();
  return {
    ...s,
    practiced: s.practiced + 1,
    lastSeen: now,
    bestScore: score === undefined ? s.bestScore : Math.max(score, s.bestScore ?? 0),
  };
}

/** น้ำหนักการสุ่มถาม: กล่องต่ำ (ยังไม่แม่น) ถูกถามบ่อยกว่า */
export function quizWeight(stat: CharStat | undefined): number {
  const box = stat?.box ?? 0;
  return 1 + (MAX_BOX - box) ** 2;
}

/** ระดับความชำนาญสำหรับแสดงผล: 0 ยังไม่เริ่ม, 1 กำลังฝึก, 2 คุ้นเคย, 3 จำได้แล้ว */
export function masteryLevel(stat: CharStat | undefined): 0 | 1 | 2 | 3 {
  if (!stat || (stat.correct === 0 && stat.wrong === 0 && stat.practiced === 0)) return 0;
  if (stat.box >= MAX_BOX) return 3;
  if (stat.box >= 3) return 2;
  return 1;
}

export const MASTERY_LABEL = ['ยังไม่เริ่ม', 'กำลังฝึก', 'คุ้นเคย', 'จำได้แล้ว'] as const;

export interface WeakChar {
  entry: CharEntry;
  stat: CharStat;
}

/** ตัวที่ผิดบ่อย: เคยผิดและยังไม่กลับมาแม่น เรียงจากน่าห่วงที่สุด */
export function weakChars(pack: ScriptPack, progress: ScriptProgress | undefined): WeakChar[] {
  if (!progress) return [];
  const out: WeakChar[] = [];
  for (const entry of pack.chars) {
    const stat = progress[entry.id];
    if (stat && stat.wrong > 0 && stat.box <= 2) out.push({ entry, stat });
  }
  return out.sort(
    (a, b) =>
      a.stat.box - b.stat.box ||
      b.stat.wrong - a.stat.wrong ||
      (b.stat.lastWrong ?? 0) - (a.stat.lastWrong ?? 0),
  );
}

// ───────────── รอบทบทวน (spaced repetition) ─────────────

/** เลขวันที่ตัวนี้ถึงรอบทบทวน (null = ยังไม่เคยตอบ จึงยังไม่มีนัด) */
export function dueDay(stat: CharStat | undefined): number | null {
  if (!stat || stat.answeredAt === null) return null;
  return dayNumber(stat.answeredAt) + (REVIEW_INTERVAL_DAYS[stat.box] ?? 0);
}

export interface DueChar {
  entry: CharEntry;
  stat: CharStat;
  /** เลยรอบมากี่วัน (0 = ถึงรอบวันนี้พอดี) */
  overdue: number;
}

/** ตัวที่ถึงรอบทบทวนแล้ว เรียงจากกล่องต่ำ (น่าห่วง) และเลยรอบนานที่สุดก่อน */
export function dueChars(
  pack: ScriptPack,
  progress: ScriptProgress | undefined,
  now: number,
): DueChar[] {
  if (!progress) return [];
  const today = dayNumber(now);
  const out: DueChar[] = [];
  for (const entry of pack.chars) {
    const stat = progress[entry.id];
    const due = dueDay(stat);
    if (stat && due !== null && due <= today) out.push({ entry, stat, overdue: today - due });
  }
  return out.sort((a, b) => a.stat.box - b.stat.box || b.overdue - a.overdue);
}

/** ทบทวนครั้งละไม่เกินกี่ตัว (ที่เหลือค่อยทำรอบถัดไป) */
export const REVIEW_BATCH = 20;

/** ลิงก์เริ่มแบบทดสอบทบทวนตัวที่ถึงรอบ (ตัวที่น่าห่วงที่สุดก่อน) */
export const reviewHref = (scriptId: string, due: readonly DueChar[]) =>
  `/${scriptId}/quiz?chars=${due
    .slice(0, REVIEW_BATCH)
    .map((d) => d.entry.id)
    .join(',')}`;

/** เคยตอบคำถาม/เขียนแบบมีตัดสินบ้างหรือยัง (ถ้ายัง = ยังไม่มีนัดทบทวน) */
export const hasAnswered = (progress: ScriptProgress | undefined) =>
  !!progress && Object.values(progress).some((s) => s.answeredAt !== null);

/** รอบทบทวนครั้งถัดไป (หลังวันนี้): อีกกี่วัน และมีกี่ตัว */
export function nextReview(
  pack: ScriptPack,
  progress: ScriptProgress | undefined,
  now: number,
): { inDays: number; count: number } | null {
  if (!progress) return null;
  const today = dayNumber(now);
  let best: number | null = null;
  let count = 0;
  for (const entry of pack.chars) {
    const due = dueDay(progress[entry.id]);
    if (due === null || due <= today) continue;
    if (best === null || due < best) {
      best = due;
      count = 1;
    } else if (due === best) {
      count++;
    }
  }
  return best === null ? null : { inDays: best - today, count };
}

// ───────────── ตรวจข้อมูล & รวมข้อมูล ─────────────

const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function sanitizeStat(raw: unknown): CharStat {
  if (!isRecord(raw)) return emptyStat();
  const correct = Math.max(0, num(raw.correct, 0));
  const wrong = Math.max(0, num(raw.wrong, 0));
  const lastSeen = num(raw.lastSeen, 0);
  return {
    box: Math.max(0, Math.min(MAX_BOX, Math.round(num(raw.box, 0)))),
    correct,
    wrong,
    practiced: Math.max(0, num(raw.practiced, 0)),
    bestScore: numOrNull(raw.bestScore),
    lastSeen,
    lastWrong: numOrNull(raw.lastWrong),
    // ข้อมูลรุ่นก่อนไม่มีช่องนี้: ถ้าเคยตอบแล้ว ถือว่าตอบล่าสุดตอน lastSeen
    answeredAt:
      numOrNull(raw.answeredAt) ?? (correct + wrong > 0 && lastSeen > 0 ? lastSeen : null),
    promotedAt: numOrNull(raw.promotedAt),
  };
}

/** ตรวจ/ซ่อมข้อมูลความคืบหน้าที่อ่านมาจาก storage หรือไฟล์สำรอง */
export function sanitizeProgress(raw: unknown): ProgressData {
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.scripts)) return EMPTY_PROGRESS;
  const scripts: Record<string, ScriptProgress> = {};
  for (const [scriptId, chars] of Object.entries(raw.scripts)) {
    if (!isRecord(chars)) continue;
    const out: Record<string, CharStat> = {};
    for (const [charId, stat] of Object.entries(chars)) out[charId] = sanitizeStat(stat);
    scripts[scriptId] = out;
  }
  return { version: 1, scripts };
}

/**
 * รวมความคืบหน้าสองชุด (เช่นนำเข้าไฟล์สำรองจากอีกเครื่อง)
 * ตัวที่มีทั้งสองฝั่ง ใช้ฝั่งที่ฝึกล่าสุด — คืนจำนวนตัวที่เปลี่ยนไป
 */
export function mergeProgress(
  local: ProgressData,
  incoming: ProgressData,
): { data: ProgressData; changed: number } {
  let changed = 0;
  const scripts: Record<string, ScriptProgress> = { ...local.scripts };
  for (const [scriptId, chars] of Object.entries(incoming.scripts)) {
    const merged: Record<string, CharStat> = { ...scripts[scriptId] };
    for (const [charId, stat] of Object.entries(chars)) {
      const mine = merged[charId];
      if (!mine || stat.lastSeen > mine.lastSeen) {
        merged[charId] = stat;
        changed++;
      }
    }
    scripts[scriptId] = merged;
  }
  return { data: { version: 1, scripts }, changed };
}
