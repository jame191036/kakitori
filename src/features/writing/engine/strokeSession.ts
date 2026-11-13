import { centroid, clamp, resample, translate, type Point } from './geometry';
import { matchStroke, type MismatchReason } from './strokeMatcher';

/**
 * ตัวควบคุมการ "ตรวจทีละขีด" (pure state machine — ไม่ผูกกับ UI)
 * ใช้ทั้งในโหมดเขียนทับ โหมดตรวจทีละขีด และข้อสอบแบบเขียน
 */

export interface SessionConfig {
  /** ความผ่อนปรนของการตรวจ (ดู MatchOptions.leniency) */
  leniency: number;
  /**
   * ชดเชยตำแหน่งอัตโนมัติ — ใช้ตอนไม่มีเส้นนำ
   * (ผู้ใช้อาจเขียนเยื้องไปทั้งตัว ระบบจะเลื่อนตามขีดที่ผ่านแล้ว)
   */
  compensateOffset: boolean;
  /** เขียนผิดขีดเดิมกี่ครั้งจึงแสดงคำใบ้ */
  hintAfter: number;
}

export interface StrokeSessionState {
  readonly total: number;
  /** จำนวนขีดที่เขียนผ่านแล้ว (= index ของขีดที่ต้องเขียนต่อไป) */
  readonly done: number;
  /** จำนวนครั้งที่เขียนผิดทั้งหมด */
  readonly mistakes: number;
  /** จำนวนครั้งที่ผิดในขีดปัจจุบัน */
  readonly currentMisses: number;
  /** จำนวนขีดที่ต้องพึ่งคำใบ้ */
  readonly hintsUsed: number;
  /** ระยะชดเชยตำแหน่งปัจจุบัน */
  readonly offset: Point;
  /** ส่วนต่างตำแหน่งของแต่ละขีดที่ผ่านแล้ว */
  readonly deltas: readonly Point[];
}

export type WrongReason = MismatchReason | 'order';

export type StrokeFeedback =
  | { kind: 'correct'; index: number }
  | {
      kind: 'wrong';
      index: number;
      reason: WrongReason;
      /** ถ้าเขียนผิดลำดับ: ขีดที่ผู้ใช้เขียนจริงๆ คือขีดที่เท่าไร */
      matchedIndex?: number;
      /** ควรแสดงคำใบ้ของขีดนี้แล้วหรือยัง */
      showHint: boolean;
    };

export const MAX_OFFSET = 25;
const FIRST_STROKE_BONUS = 1.35;

export function createSession(total: number): StrokeSessionState {
  return {
    total,
    done: 0,
    mistakes: 0,
    currentMisses: 0,
    hintsUsed: 0,
    offset: { x: 0, y: 0 },
    deltas: [],
  };
}

export const isComplete = (s: StrokeSessionState): boolean => s.done >= s.total;

function averageOffset(deltas: readonly Point[]): Point {
  if (deltas.length === 0) return { x: 0, y: 0 };
  const c = centroid(deltas);
  const len = Math.hypot(c.x, c.y);
  if (len <= MAX_OFFSET) return c;
  const k = MAX_OFFSET / len;
  return { x: c.x * k, y: c.y * k };
}

export function submitStroke(
  state: StrokeSessionState,
  refs: readonly (readonly Point[])[],
  userRaw: readonly Point[],
  config: SessionConfig,
): { state: StrokeSessionState; feedback: StrokeFeedback } {
  const index = state.done;
  const ref = refs[index];
  if (!ref || isComplete(state)) {
    return { state, feedback: { kind: 'correct', index } };
  }

  const firstUnguided = config.compensateOffset && index === 0;
  const leniency = config.leniency * (firstUnguided ? FIRST_STROKE_BONUS : 1);
  const user = config.compensateOffset
    ? translate(userRaw, state.offset.x, state.offset.y)
    : [...userRaw];

  const result = matchStroke(user, ref, { leniency });

  if (result.ok) {
    let deltas = state.deltas;
    let offset = state.offset;
    if (config.compensateOffset) {
      const rc = centroid(resample(ref, 16));
      const uc = centroid(resample(userRaw, 16));
      deltas = [...state.deltas, { x: rc.x - uc.x, y: rc.y - uc.y }];
      offset = averageOffset(deltas);
    }
    return {
      state: {
        ...state,
        done: index + 1,
        currentMisses: 0,
        deltas,
        offset,
      },
      feedback: { kind: 'correct', index },
    };
  }

  // ผิด — ตรวจว่าเป็นการเขียนขีดอื่นที่ยังไม่ถึงคิวหรือไม่ (ผิดลำดับ)
  let reason: WrongReason = result.reason ?? 'shape';
  let matchedIndex: number | undefined;
  if (reason === 'shape') {
    for (let j = index + 1; j < refs.length; j++) {
      if (matchStroke(user, refs[j]!, { leniency }).ok) {
        reason = 'order';
        matchedIndex = j;
        break;
      }
    }
  }

  const currentMisses = state.currentMisses + 1;
  const showHint = currentMisses >= config.hintAfter;
  const hintsUsed = state.hintsUsed + (currentMisses === config.hintAfter ? 1 : 0);
  return {
    state: { ...state, mistakes: state.mistakes + 1, currentMisses, hintsUsed },
    feedback: { kind: 'wrong', index, reason, matchedIndex, showHint },
  };
}

/** ข้อความอธิบายข้อผิดพลาดเป็นภาษาไทย */
export function describeWrong(reason: WrongReason, matchedIndex?: number): string {
  switch (reason) {
    case 'direction':
      return 'ทิศทางผิด — ลองเขียนกลับด้าน';
    case 'order':
      return matchedIndex !== undefined
        ? `ลำดับขีดผิด — นั่นคือขีดที่ ${matchedIndex + 1}`
        : 'ลำดับขีดผิด';
    case 'tooShort':
      return 'ขีดสั้นเกินไป — ลากให้ยาวตามแบบ';
    case 'shape':
    default:
      return 'ยังไม่ตรง — ลองดูตำแหน่งและรูปร่างอีกครั้ง';
  }
}

export const clampLeniency = (v: number): number => clamp(v, 0.5, 2);
