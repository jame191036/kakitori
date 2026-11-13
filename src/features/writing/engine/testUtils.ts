import strokesJson from '../../../data/strokes/hiragana.json';
import type { StrokeSet } from '../../../data/types';
import type { Point } from './geometry';

/** ข้อมูลลำดับขีดฮิรางานะ (ใช้ในเทสเท่านั้น) */
export const hiraganaStrokes = strokesJson as unknown as StrokeSet;

/** ตัวสุ่มแบบกำหนด seed ได้ เพื่อให้เทสได้ผลเหมือนเดิมทุกครั้ง */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface HandOptions {
  /** มือสั่น (สุ่มต่อจุด) */
  jitter?: number;
  /** เส้นโค้งเบี้ยวแบบนุ่มๆ */
  wobble?: number;
  dx?: number;
  dy?: number;
  /** ขยาย/ย่อรอบจุดกลางกรอบ (54.5, 54.5) */
  scale?: number;
}

/** จำลองลายมือคน: เลื่อน ย่อขยาย เบี้ยว และสั่นเล็กน้อย */
export function simulateHand(
  pts: readonly Point[],
  random: () => number,
  { jitter = 1, wobble = 2.5, dx = 0, dy = 0, scale = 1 }: HandOptions = {},
): Point[] {
  const phase = random() * Math.PI * 2;
  return pts.map((p, i) => {
    const t = i / Math.max(1, pts.length - 1);
    const w = Math.sin(t * Math.PI * 2 + phase) * wobble;
    return {
      x: (p.x - 54.5) * scale + 54.5 + dx + w + (random() - 0.5) * 2 * jitter,
      y: (p.y - 54.5) * scale + 54.5 + dy + w * 0.6 + (random() - 0.5) * 2 * jitter,
    };
  });
}
