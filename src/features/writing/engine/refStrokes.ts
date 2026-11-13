import type { StrokeData } from '../../../data/types';
import { polylineLength, type Point } from './geometry';
import { flattenPath } from './svgPath';

const cache = new WeakMap<StrokeData, Point[][]>();

/** แปลงขีดต้นแบบทุกขีดของตัวอักษรเป็น polyline (cache ไว้ต่อตัวอักษร) */
export function referenceStrokes(data: StrokeData): Point[][] {
  let out = cache.get(data);
  if (!out) {
    out = data.strokes.map((d) => flattenPath(d));
    cache.set(data, out);
  }
  return out;
}

/** ความยาวของแต่ละขีด (ใช้กำหนดความเร็วแอนิเมชัน) */
export function strokeLengths(data: StrokeData): number[] {
  return referenceStrokes(data).map(polylineLength);
}
