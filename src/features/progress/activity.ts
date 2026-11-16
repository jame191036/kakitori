import { dayKey, dayNumber, dayNumberFromKey } from '../../lib/day';
import { isRecord } from '../../lib/isRecord';

/**
 * กิจกรรมรายวัน (pure functions) — ใช้นับเป้ารายวันและวันที่ฝึกต่อเนื่อง (streak)
 * - 1 ครั้ง = ตอบคำถาม 1 ข้อ หรือเขียนเสร็จ 1 ตัว
 * - วันที่ "ถึงเป้า" เท่านั้นที่นับต่อ streak
 * - วันที่ถึงเป้าแล้วจะถูกจำไว้ (เปลี่ยนเป้าภายหลังก็ไม่ทำให้วันเก่าหลุด)
 */

export const GOAL_OPTIONS = [5, 10, 20, 30] as const;
export const DEFAULT_GOAL = 10;

export interface DayActivity {
  count: number;
  goalMet: boolean;
}

export interface ActivityData {
  version: 1;
  /** key = "YYYY-MM-DD" ตามเวลาท้องถิ่น */
  days: Readonly<Record<string, DayActivity>>;
}

export const EMPTY_ACTIVITY: ActivityData = { version: 1, days: {} };

/** เพิ่มกิจกรรมวันนี้ — คืนข้อมูลใหม่ และบอกว่าเพิ่งถึงเป้าวันนี้พอดีหรือไม่ */
export function addActivity(
  data: ActivityData,
  now: number,
  goal: number,
  amount = 1,
): { data: ActivityData; reachedGoal: boolean } {
  const key = dayKey(now);
  const prev = data.days[key] ?? { count: 0, goalMet: false };
  const count = prev.count + amount;
  const goalMet = prev.goalMet || count >= goal;
  return {
    data: { ...data, days: { ...data.days, [key]: { count, goalMet } } },
    reachedGoal: goalMet && !prev.goalMet,
  };
}

export interface StreakInfo {
  /** จำนวนวันที่ถึงเป้าติดกัน จนถึงวันนี้ (หรือเมื่อวาน ถ้าวันนี้ยังไม่ถึงเป้า) */
  current: number;
  best: number;
  todayCount: number;
  todayMet: boolean;
  /** มีกิจกรรมบ้างหรือยัง (ไว้ซ่อนการ์ดสำหรับผู้ใช้ใหม่) */
  hasAny: boolean;
}

export function streakInfo(data: ActivityData, now: number, goal: number): StreakInfo {
  const today = dayNumber(now);
  const todayData = data.days[dayKey(now)];
  const todayCount = todayData?.count ?? 0;
  const todayMet = !!todayData && (todayData.goalMet || todayData.count >= goal);

  const met = new Set<number>();
  for (const [key, d] of Object.entries(data.days)) {
    const n = dayNumberFromKey(key);
    if (n !== null && d.goalMet) met.add(n);
  }
  if (todayMet) met.add(today);

  let current = 0;
  for (let d = todayMet ? today : today - 1; met.has(d); d--) current++;

  let best = 0;
  for (const d of met) {
    if (met.has(d - 1)) continue; // ไม่ใช่วันแรกของช่วง
    let len = 1;
    while (met.has(d + len)) len++;
    best = Math.max(best, len);
  }

  return {
    current,
    best,
    todayCount,
    todayMet,
    hasAny: Object.keys(data.days).length > 0,
  };
}

export function sanitizeActivity(raw: unknown): ActivityData {
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.days)) return EMPTY_ACTIVITY;
  const days: Record<string, DayActivity> = {};
  for (const [key, d] of Object.entries(raw.days)) {
    if (dayNumberFromKey(key) === null || !isRecord(d)) continue;
    const count = typeof d.count === 'number' && Number.isFinite(d.count) ? Math.max(0, Math.round(d.count)) : 0;
    days[key] = { count, goalMet: d.goalMet === true };
  }
  return { version: 1, days };
}

/** รวมกิจกรรมสองชุด: วันเดียวกันใช้จำนวนที่มากกว่า (นำเข้าไฟล์เดิมซ้ำก็ไม่นับเพิ่ม) — คืนจำนวนวันที่เปลี่ยนไป */
export function mergeActivity(
  local: ActivityData,
  incoming: ActivityData,
): { data: ActivityData; changed: number } {
  let changed = 0;
  const days: Record<string, DayActivity> = { ...local.days };
  for (const [key, d] of Object.entries(incoming.days)) {
    const mine = days[key];
    const next = mine
      ? { count: Math.max(mine.count, d.count), goalMet: mine.goalMet || d.goalMet }
      : d;
    if (!mine || next.count !== mine.count || next.goalMet !== mine.goalMet) changed++;
    days[key] = next;
  }
  return { data: { version: 1, days }, changed };
}

export function sanitizeGoal(raw: unknown): number {
  return GOAL_OPTIONS.includes(raw as never) ? (raw as number) : DEFAULT_GOAL;
}
