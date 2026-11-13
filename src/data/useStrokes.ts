import { use } from 'react';
import type { ScriptId, ScriptPack, StrokeData, StrokeSet } from './types';

const cache = new Map<ScriptId, Promise<StrokeSet>>();

/** คืน promise ของข้อมูลลำดับขีด (โหลดครั้งเดียวต่อชุดแล้วเก็บไว้) */
export function strokeSetPromise(pack: ScriptPack): Promise<StrokeSet> {
  let p = cache.get(pack.id);
  if (!p) {
    p = pack.loadStrokes();
    cache.set(pack.id, p);
    // ถ้าโหลดไม่สำเร็จ ให้ลองใหม่ได้ในครั้งถัดไป
    p.catch(() => cache.delete(pack.id));
  }
  return p;
}

/** ใช้ภายใน <Suspense> — จะ suspend จนกว่าข้อมูลลำดับขีดจะโหลดเสร็จ */
export function useStrokeSet(pack: ScriptPack): StrokeSet {
  return use(strokeSetPromise(pack));
}

export function useStrokeData(pack: ScriptPack, char: string): StrokeData | undefined {
  return useStrokeSet(pack).chars[char];
}
