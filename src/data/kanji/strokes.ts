import { use } from 'react';
import type { StrokeSet } from '../types';

let promise: Promise<StrokeSet> | null = null;

/** ข้อมูลลำดับขีดของคันจิ N5 (KanjiVG) — โหลดครั้งเดียวตอนเข้าหน้าคันจิ แยกจากไฟล์หลักของเว็บ */
export function kanjiStrokesPromise(): Promise<StrokeSet> {
  if (!promise) {
    const p = import('../strokes/kanji-n5.json').then((m) => m.default as unknown as StrokeSet);
    // ถ้าโหลดไม่สำเร็จ ให้ลองใหม่ได้ในครั้งถัดไป
    p.catch(() => {
      if (promise === p) promise = null;
    });
    promise = p;
  }
  return promise;
}

/** ใช้ภายใน <Suspense> — จะ suspend จนกว่าข้อมูลลำดับขีดจะโหลดเสร็จ */
export function useKanjiStrokes(): StrokeSet {
  return use(kanjiStrokesPromise());
}
