import type { CharEntry, ScriptPack } from '../../data/types';

/**
 * ตรรกะความคืบหน้า (pure functions) — ใช้ระบบ "กล่องทบทวน" แบบ Leitner
 * - ตอบ/เขียนถูก → เลื่อนขึ้น 1 กล่อง (สูงสุด MAX_BOX = จำได้แล้ว)
 * - ตอบ/เขียนผิด → กลับไปกล่อง 0
 * - ตัวที่อยู่กล่องต่ำจะถูกสุ่มมาถามบ่อยกว่า
 */

export const MAX_BOX = 5;

export interface CharStat {
  box: number;
  correct: number;
  wrong: number;
  /** จำนวนครั้งที่ฝึกเขียน */
  practiced: number;
  /** คะแนนเขียนอิสระสูงสุด */
  bestScore: number | null;
  lastSeen: number;
  lastWrong: number | null;
}

export type ScriptProgress = Readonly<Record<string, CharStat>>;

export interface ProgressData {
  version: 1;
  scripts: Readonly<Record<string, ScriptProgress>>;
}

export const emptyStat = (): CharStat => ({
  box: 0,
  correct: 0,
  wrong: 0,
  practiced: 0,
  bestScore: null,
  lastSeen: 0,
  lastWrong: null,
});

export function applyAnswer(stat: CharStat | undefined, correct: boolean, now: number): CharStat {
  const s = stat ?? emptyStat();
  return correct
    ? { ...s, box: Math.min(MAX_BOX, s.box + 1), correct: s.correct + 1, lastSeen: now }
    : { ...s, box: 0, wrong: s.wrong + 1, lastSeen: now, lastWrong: now };
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
