import { createMemoryStore, createPersistentStore, useStore } from '../../lib/persistentStore';
import { settingsStore, updateSettings } from '../settings/settings';
import {
  addActivity,
  EMPTY_ACTIVITY,
  mergeActivity,
  sanitizeActivity,
  streakInfo,
  type ActivityData,
} from './activity';
import {
  applyAnswer,
  applyPractice,
  EMPTY_PROGRESS,
  mergeProgress,
  sanitizeProgress,
  type CharStat,
  type ProgressData,
  type ScriptProgress,
} from './progressLogic';

export const PROGRESS_KEY = 'jp-learn:progress:v1';
export const ACTIVITY_KEY = 'jp-learn:activity:v1';

export const progressStore = createPersistentStore<ProgressData>(
  PROGRESS_KEY,
  EMPTY_PROGRESS,
  sanitizeProgress,
);

/** จำนวนครั้งที่ฝึกในแต่ละวัน (เป้ารายวัน + streak) */
export const activityStore = createPersistentStore<ActivityData>(
  ACTIVITY_KEY,
  EMPTY_ACTIVITY,
  sanitizeActivity,
);

/** สัญญาณ "เพิ่งถึงเป้าวันนี้" ให้แสดงแจ้งเตือน (ไม่บันทึกลงเครื่อง) — ค่า = streak ณ ตอนนั้น */
export const goalReachedSignal = createMemoryStore<number | null>(null);

export function useScriptProgress(scriptId: string): ScriptProgress | undefined {
  return useStore(progressStore).scripts[scriptId];
}

function updateChar(scriptId: string, charId: string, fn: (s: CharStat | undefined) => CharStat) {
  progressStore.set((prev) => {
    const script = prev.scripts[scriptId] ?? {};
    return {
      ...prev,
      scripts: { ...prev.scripts, [scriptId]: { ...script, [charId]: fn(script[charId]) } },
    };
  });
}

/** นับกิจกรรม 1 ครั้ง (ตอบ 1 ข้อ / เขียนเสร็จ 1 ตัว) */
function countActivity(now: number) {
  const goal = settingsStore.get().dailyGoal;
  const { data, reachedGoal } = addActivity(activityStore.get(), now, goal);
  activityStore.set(data);
  if (reachedGoal) goalReachedSignal.set(streakInfo(data, now, goal).current);
}

/** เปลี่ยนเป้ารายวัน — ถ้าวันนี้ฝึกถึงเป้าใหม่แล้ว ให้นับวันนี้เลย (ไม่อย่างนั้นพรุ่งนี้ streak จะหลุด) */
export function setDailyGoal(goal: number): void {
  updateSettings({ dailyGoal: goal });
  const { data, reachedGoal } = addActivity(activityStore.get(), Date.now(), goal, 0);
  if (reachedGoal) activityStore.set(data);
}

/** บันทึกผลตอบคำถามในแบบทดสอบ */
export function recordAnswer(scriptId: string, charId: string, correct: boolean): void {
  const now = Date.now();
  updateChar(scriptId, charId, (s) => applyAnswer(s, correct, now));
  countActivity(now);
}

/**
 * บันทึกว่าเขียนตัวนี้เสร็จ 1 ครั้ง
 * - score: คะแนนเขียนอิสระ (ถ้ามี)
 * - correct: ผลตัดสินถูก/ผิด (ไม่ใส่ = ไม่นับเป็นการตอบ เช่นโหมดเขียนทับ)
 */
export function recordPractice(
  scriptId: string,
  charId: string,
  opts: { score?: number; correct?: boolean } = {},
): void {
  const now = Date.now();
  updateChar(scriptId, charId, (s) => {
    const practiced = applyPractice(s, now, opts.score);
    return opts.correct === undefined ? practiced : applyAnswer(practiced, opts.correct, now);
  });
  countActivity(now);
}

export function resetProgress(scriptId: string): void {
  progressStore.set((prev) => {
    const scripts = { ...prev.scripts };
    delete scripts[scriptId];
    return { ...prev, scripts };
  });
}

/** รวมข้อมูลจากไฟล์สำรองเข้ากับข้อมูลในเครื่อง — คืนจำนวนตัวอักษรและจำนวนวันที่อัปเดต */
export function importData(incoming: { progress: ProgressData; activity: ActivityData }): {
  chars: number;
  days: number;
} {
  const p = mergeProgress(progressStore.get(), incoming.progress);
  const a = mergeActivity(activityStore.get(), incoming.activity);
  if (p.changed) progressStore.set(p.data);
  if (a.changed) activityStore.set(a.data);
  return { chars: p.changed, days: a.changed };
}
