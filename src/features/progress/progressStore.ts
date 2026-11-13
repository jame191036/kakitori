import { createPersistentStore, isRecord, useStore } from '../../lib/persistentStore';
import {
  applyAnswer,
  applyPractice,
  emptyStat,
  type CharStat,
  type ProgressData,
  type ScriptProgress,
} from './progressLogic';

export const PROGRESS_KEY = 'jp-learn:progress:v1';

const initial: ProgressData = { version: 1, scripts: {} };

const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

function sanitizeStat(raw: unknown): CharStat {
  if (!isRecord(raw)) return emptyStat();
  return {
    box: Math.max(0, Math.min(5, Math.round(num(raw.box, 0)))),
    correct: Math.max(0, num(raw.correct, 0)),
    wrong: Math.max(0, num(raw.wrong, 0)),
    practiced: Math.max(0, num(raw.practiced, 0)),
    bestScore: typeof raw.bestScore === 'number' ? raw.bestScore : null,
    lastSeen: num(raw.lastSeen, 0),
    lastWrong: typeof raw.lastWrong === 'number' ? raw.lastWrong : null,
  };
}

function sanitize(raw: unknown): ProgressData {
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.scripts)) return initial;
  const scripts: Record<string, ScriptProgress> = {};
  for (const [scriptId, chars] of Object.entries(raw.scripts)) {
    if (!isRecord(chars)) continue;
    const out: Record<string, CharStat> = {};
    for (const [charId, stat] of Object.entries(chars)) out[charId] = sanitizeStat(stat);
    scripts[scriptId] = out;
  }
  return { version: 1, scripts };
}

export const progressStore = createPersistentStore<ProgressData>(PROGRESS_KEY, initial, sanitize);

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

/** บันทึกผลตอบคำถาม/ผลการเขียนที่ตัดสินถูก-ผิดได้ */
export function recordAnswer(scriptId: string, charId: string, correct: boolean): void {
  updateChar(scriptId, charId, (s) => applyAnswer(s, correct, Date.now()));
}

/** บันทึกว่าฝึกเขียนตัวนี้แล้ว (และคะแนนเขียนอิสระ ถ้ามี) */
export function recordPractice(scriptId: string, charId: string, score?: number): void {
  updateChar(scriptId, charId, (s) => applyPractice(s, Date.now(), score));
}

export function resetProgress(scriptId: string): void {
  progressStore.set((prev) => {
    const scripts = { ...prev.scripts };
    delete scripts[scriptId];
    return { ...prev, scripts };
  });
}
