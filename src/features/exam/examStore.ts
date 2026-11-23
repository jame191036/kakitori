import type { ExamSet } from '../../data/exam/types';
import { isRecord } from '../../lib/isRecord';
import { createPersistentStore } from '../../lib/persistentStore';
import { recordActivity } from '../progress/progressStore';
import { answeredCount } from './examLogic';

/**
 * ข้อสอบจำลองในเครื่อง: ข้อสอบที่กำลังทำ (ทำต่อได้หลังปิดหน้า) + ประวัติผลสอบ
 * (ยังไม่อยู่ในไฟล์สำรองความคืบหน้า)
 */

export interface ExamAttempt {
  /** = เวลาที่ส่ง (ms) เป็นข้อความ */
  id: string;
  setId: string;
  finishedAt: number;
  timed: boolean;
  answers: Record<string, number>;
  /** เวลาที่ใช้ของแต่ละส่วน (วินาที) */
  seconds: number[];
}

export interface ExamSession {
  setId: string;
  /** ส่วนที่กำลังทำ (0 = คำศัพท์, 1 = ไวยากรณ์และการอ่าน) */
  section: number;
  /** เริ่มส่วนนี้แล้วหรือยัง (ระหว่างส่วน = หน้าพัก) */
  started: boolean;
  startedAt: number;
  /** หมดเวลาเมื่อไร (ms) — null = ไม่จับเวลา */
  deadline: number | null;
  timed: boolean;
  answers: Record<string, number>;
  seconds: number[];
  /** ข้อที่เปิดอยู่ (ลำดับในส่วนนั้น) */
  current: number;
}

export interface ExamData {
  version: 1;
  /** ค่าตั้ง: จับเวลาเหมือนสอบจริง */
  timed: boolean;
  attempts: ExamAttempt[];
  session: ExamSession | null;
}

export const EXAM_KEY = 'jp-learn:exam:v1';
const MAX_ATTEMPTS = 50;
const EMPTY: ExamData = { version: 1, timed: true, attempts: [], session: null };

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

function sanitizeAnswers(raw: unknown): Record<string, number> {
  if (!isRecord(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) if (Number.isInteger(v) && (v as number) >= 0 && (v as number) < 4) out[k] = v as number;
  return out;
}

const sanitizeSeconds = (raw: unknown) => (Array.isArray(raw) ? raw.map((x) => Math.max(0, num(x))).slice(0, 2) : []);

function sanitizeAttempt(raw: unknown): ExamAttempt | null {
  if (!isRecord(raw) || typeof raw.setId !== 'string') return null;
  const finishedAt = num(raw.finishedAt);
  if (!finishedAt) return null;
  return {
    id: typeof raw.id === 'string' ? raw.id : String(finishedAt),
    setId: raw.setId,
    finishedAt,
    timed: raw.timed !== false,
    answers: sanitizeAnswers(raw.answers),
    seconds: sanitizeSeconds(raw.seconds),
  };
}

function sanitizeSession(raw: unknown): ExamSession | null {
  if (!isRecord(raw) || typeof raw.setId !== 'string') return null;
  const section = raw.section === 1 ? 1 : 0;
  return {
    setId: raw.setId,
    section,
    started: raw.started === true,
    startedAt: num(raw.startedAt),
    deadline: typeof raw.deadline === 'number' ? raw.deadline : null,
    timed: raw.timed !== false,
    answers: sanitizeAnswers(raw.answers),
    seconds: sanitizeSeconds(raw.seconds).slice(0, section),
    current: Math.max(0, Math.floor(num(raw.current))),
  };
}

export function sanitizeExamData(raw: unknown): ExamData {
  if (!isRecord(raw)) return EMPTY;
  return {
    version: 1,
    timed: raw.timed !== false,
    attempts: (Array.isArray(raw.attempts) ? raw.attempts : [])
      .map(sanitizeAttempt)
      .filter((a): a is ExamAttempt => a !== null)
      .slice(-MAX_ATTEMPTS),
    session: sanitizeSession(raw.session),
  };
}

export const examStore = createPersistentStore<ExamData>(EXAM_KEY, EMPTY, sanitizeExamData);

const setSession = (fn: (s: ExamSession) => ExamSession) =>
  examStore.set((d) => (d.session ? { ...d, session: fn(d.session) } : d));

export function setTimedPreference(timed: boolean): void {
  examStore.set((d) => ({ ...d, timed }));
}

/** เริ่มชุดใหม่ (ทิ้งข้อสอบที่ทำค้างไว้ถ้ามี) และเริ่มจับเวลาส่วนแรกทันที */
export function startExam(set: ExamSet, timed: boolean, now = Date.now()): void {
  examStore.set((d) => ({
    ...d,
    timed,
    session: {
      setId: set.id,
      section: 0,
      started: true,
      startedAt: now,
      deadline: timed ? now + set.sections[0]!.minutes * 60_000 : null,
      timed,
      answers: {},
      seconds: [],
      current: 0,
    },
  }));
}

/** เริ่มส่วนถัดไป (จากหน้าพักระหว่างส่วน) */
export function beginSection(set: ExamSet, now = Date.now()): void {
  setSession((s) => ({
    ...s,
    started: true,
    startedAt: now,
    deadline: s.timed ? now + set.sections[s.section]!.minutes * 60_000 : null,
    current: 0,
  }));
}

export function chooseAnswer(questionId: string, choice: number): void {
  setSession((s) => ({ ...s, answers: { ...s.answers, [questionId]: choice } }));
}

export function goToQuestion(index: number): void {
  setSession((s) => ({ ...s, current: index }));
}

/**
 * ส่งส่วนที่กำลังทำ — ส่วนสุดท้าย: บันทึกผลสอบและคืน id ของผลสอบ · ส่วนอื่น: ไปหน้าพัก (คืน null)
 * now ใช้คิดเวลาที่ใช้ (หมดเวลา: ไม่เกินเวลาของส่วนนั้น)
 */
export function submitSection(set: ExamSet, now = Date.now()): string | null {
  const s = examStore.get().session;
  if (!s || s.setId !== set.id || !s.started) return null;
  const end = s.deadline === null ? now : Math.min(now, s.deadline);
  const seconds = [...s.seconds, Math.max(0, Math.round((end - s.startedAt) / 1000))];
  if (s.section < set.sections.length - 1) {
    examStore.set((d) => ({ ...d, session: { ...s, section: s.section + 1, started: false, seconds, current: 0 } }));
    return null;
  }
  const attempt: ExamAttempt = {
    id: String(now),
    setId: set.id,
    finishedAt: now,
    timed: s.timed,
    answers: s.answers,
    seconds,
  };
  examStore.set((d) => ({ ...d, session: null, attempts: [...d.attempts, attempt].slice(-MAX_ATTEMPTS) }));
  // ทำข้อสอบเสร็จ = ฝึกไปเท่าจำนวนข้อที่ตอบ (นับเป้ารายวัน/streak)
  recordActivity(answeredCount(set.questions, s.answers));
  return attempt.id;
}

export function discardSession(): void {
  examStore.set((d) => ({ ...d, session: null }));
}
