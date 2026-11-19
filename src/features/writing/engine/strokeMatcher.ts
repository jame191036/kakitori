import { clamp, dist, polylineLength, resample, smooth, type Point } from './geometry';

/**
 * เทียบ "ขีดที่ผู้ใช้เขียน" กับ "ขีดต้นแบบ" (พิกัด 0–109 แบบ KanjiVG)
 *
 * หลักการ:
 * 1. สุ่มจุดทั้งสองเส้นให้มีจำนวนเท่ากันและห่างเท่าๆ กัน
 * 2. วัดระยะเฉลี่ยจุดต่อจุด (ตามลำดับ) → บอกได้ทั้งตำแหน่ง รูปร่าง และทิศทาง
 * 3. วัดระยะเฉลี่ยแบบกลับหัวเส้น → ถ้ากลับหัวแล้วใกล้กว่า แปลว่าเขียนผิดทิศ
 * 4. วัดความคล้ายของทิศทางในแต่ละช่วง เพื่อกันกรณีเขียนมั่วแต่ตำแหน่งใกล้
 */

export type MismatchReason = 'tooShort' | 'direction' | 'shape';

export interface StrokeComparison {
  /** ระยะเฉลี่ยจุดต่อจุด (หน่วย 0–109) */
  meanDist: number;
  /** ระยะเฉลี่ยเมื่อกลับทิศเส้นผู้ใช้ */
  reverseDist: number;
  /** ความคล้ายของทิศทาง −1 ถึง 1 */
  dirSim: number;
  /** ระยะที่ยอมรับได้ */
  tolerance: number;
  userLength: number;
  refLength: number;
}

export interface StrokeMatch {
  ok: boolean;
  reason?: MismatchReason;
  /** ความเหมือน 0–1 (ใช้คิดคะแนน) */
  similarity: number;
  comparison: StrokeComparison;
}

export interface MatchOptions {
  /** ความผ่อนปรน: 1 = ปกติ, มากกว่า 1 = ตรวจหลวมขึ้น, น้อยกว่า 1 = เข้มขึ้น */
  leniency?: number;
}

const SAMPLES = 32;
const DIR_SAMPLES = 9;
const BASE_TOLERANCE = 10;
const MIN_DIR_SIM = 0.5;

export function toleranceFor(refLength: number, leniency = 1): number {
  return (BASE_TOLERANCE + refLength * 0.04) * leniency;
}

function meanPairDistance(a: readonly Point[], b: readonly Point[], reverseA: boolean): number {
  let sum = 0;
  const n = a.length;
  for (let i = 0; i < n; i++) sum += dist(a[reverseA ? n - 1 - i : i]!, b[i]!);
  return sum / n;
}

/**
 * ความคล้ายของทิศทางในแต่ละช่วงของเส้น
 * ขีดสั้น (เช่น เครื่องหมายขุ่น ゛) แบ่งช่วงน้อยลง ไม่อย่างนั้นแค่มือสั่นนิดเดียวทิศก็เพี้ยน
 */
function directionSimilarity(user: readonly Point[], ref: readonly Point[], refLength: number): number {
  const samples = clamp(Math.round(refLength / 8), 2, DIR_SAMPLES - 1) + 1;
  const a = resample(user, samples);
  const b = resample(ref, samples);
  let sum = 0;
  let count = 0;
  for (let i = 1; i < samples; i++) {
    const ax = a[i]!.x - a[i - 1]!.x;
    const ay = a[i]!.y - a[i - 1]!.y;
    const bx = b[i]!.x - b[i - 1]!.x;
    const by = b[i]!.y - b[i - 1]!.y;
    const la = Math.hypot(ax, ay);
    const lb = Math.hypot(bx, by);
    if (la < 1e-6 || lb < 1e-6) continue;
    sum += (ax * bx + ay * by) / (la * lb);
    count++;
  }
  return count ? sum / count : 0;
}

export function compareStroke(
  userRaw: readonly Point[],
  ref: readonly Point[],
  leniency = 1,
): StrokeComparison {
  // เกลี่ยอาการมือสั่นก่อนเทียบ (สำคัญกับขีดสั้นของคันจิ — ไม่กระทบรูปร่างของขีดยาว)
  const user = smooth(userRaw);
  const u = resample(user, SAMPLES);
  const r = resample(ref, SAMPLES);
  const refLength = polylineLength(ref);
  return {
    meanDist: meanPairDistance(u, r, false),
    reverseDist: meanPairDistance(u, r, true),
    dirSim: directionSimilarity(user, ref, refLength),
    tolerance: toleranceFor(refLength, leniency),
    userLength: polylineLength(user),
    refLength,
  };
}

export function matchStroke(
  user: readonly Point[],
  ref: readonly Point[],
  options: MatchOptions = {},
): StrokeMatch {
  const c = compareStroke(user, ref, options.leniency ?? 1);
  // คลาดเคลื่อนนิดหน่อยแทบไม่เสียคะแนน แต่เกินระยะที่ยอมรับแล้วคะแนนลดเร็ว
  // (ที่ระยะ = tolerance ได้ 0.6, ครึ่งหนึ่งได้ ~0.86)
  const similarity = clamp(1 - 0.4 * (c.meanDist / c.tolerance) ** 1.5, 0, 1);

  if (user.length < 2 || c.userLength < Math.max(1.5, c.refLength * 0.2)) {
    return { ok: false, reason: 'tooShort', similarity: 0, comparison: c };
  }
  if (c.meanDist <= c.tolerance && c.dirSim >= MIN_DIR_SIM) {
    return { ok: true, similarity, comparison: c };
  }
  if (c.reverseDist <= c.tolerance && c.reverseDist < c.meanDist) {
    return { ok: false, reason: 'direction', similarity: similarity * 0.3, comparison: c };
  }
  return { ok: false, reason: 'shape', similarity, comparison: c };
}
