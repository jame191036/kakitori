import { boundingBox, type Point } from './geometry';
import { matchStroke } from './strokeMatcher';

/**
 * ให้คะแนน "เขียนอิสระ" — ผู้ใช้เขียนทั้งตัวเองโดยไม่มีเส้นนำ แล้วตรวจทีเดียว
 * ระบบจะปรับขนาดและตำแหน่งลายมือให้ตรงกับต้นแบบก่อน (วัดแค่รูปร่าง/ลำดับ/ทิศทาง)
 */

export type StrokeStatus = 'good' | 'ok' | 'direction' | 'order' | 'shape' | 'missing' | 'extra';

export interface StrokeResult {
  index: number;
  status: StrokeStatus;
  /** คะแนนของขีดนี้ 0–1 */
  score: number;
}

export interface FreeWriteResult {
  /** คะแนนรวม 0–100 */
  score: number;
  stars: 0 | 1 | 2 | 3;
  userCount: number;
  refCount: number;
  strokes: StrokeResult[];
  /** ลายมือผู้ใช้หลังปรับขนาด/ตำแหน่งให้ตรงต้นแบบ (ใช้แสดงผลเทียบ) */
  normalized: Point[][];
}

const LENIENCY = 1.15;

/** ปรับลายมือผู้ใช้ให้มีขนาด/ตำแหน่งเดียวกับต้นแบบ (คงสัดส่วนเดิม) */
export function normalizeToReference(
  user: readonly (readonly Point[])[],
  refs: readonly (readonly Point[])[],
): Point[][] {
  const ub = boundingBox(user.flat());
  const rb = boundingBox(refs.flat());
  const us = Math.max(ub.width, ub.height);
  const rs = Math.max(rb.width, rb.height);
  const s = us > 1 ? rs / us : 1;
  return user.map((stroke) =>
    stroke.map((p) => ({ x: (p.x - ub.cx) * s + rb.cx, y: (p.y - ub.cy) * s + rb.cy })),
  );
}

export function starsFor(score: number): 0 | 1 | 2 | 3 {
  if (score >= 85) return 3;
  if (score >= 65) return 2;
  if (score >= 40) return 1;
  return 0;
}

export function scoreFreeWrite(
  user: readonly (readonly Point[])[],
  refs: readonly (readonly Point[])[],
  leniency = 1,
): FreeWriteResult {
  const strokes = user.filter((s) => s.length > 0);
  if (strokes.length === 0) {
    return {
      score: 0,
      stars: 0,
      userCount: 0,
      refCount: refs.length,
      strokes: refs.map((_, index) => ({ index, status: 'missing', score: 0 })),
      normalized: [],
    };
  }

  const normalized = normalizeToReference(strokes, refs);
  const opts = { leniency: LENIENCY * leniency };
  const results: StrokeResult[] = [];

  for (let i = 0; i < Math.max(refs.length, normalized.length); i++) {
    const ref = refs[i];
    const mine = normalized[i];
    if (!mine) {
      results.push({ index: i, status: 'missing', score: 0 });
      continue;
    }
    if (!ref) {
      results.push({ index: i, status: 'extra', score: 0 });
      continue;
    }
    const m = matchStroke(mine, ref, opts);
    if (m.ok) {
      results.push({
        index: i,
        status: m.similarity >= 0.75 ? 'good' : 'ok',
        score: Math.max(0.6, m.similarity),
      });
    } else if (m.reason === 'direction') {
      results.push({ index: i, status: 'direction', score: 0.25 });
    } else if (refs.some((r, j) => j !== i && matchStroke(mine, r, opts).ok)) {
      results.push({ index: i, status: 'order', score: 0.4 });
    } else {
      results.push({ index: i, status: 'shape', score: Math.min(0.4, m.similarity * 0.5) });
    }
  }

  const denom = Math.max(refs.length, normalized.length);
  const sum = results.reduce((acc, r) => acc + r.score, 0);
  const score = Math.round((sum / denom) * 100);
  return {
    score,
    stars: starsFor(score),
    userCount: normalized.length,
    refCount: refs.length,
    strokes: results,
    normalized,
  };
}
