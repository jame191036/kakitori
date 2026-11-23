import type { ExamSet } from '../types';
import { EXAM_SET_1 } from './set1';
import { EXAM_SET_2 } from './set2';

/**
 * ข้อสอบจำลอง JLPT N5 — ส่วนความรู้ภาษา (ตัวอักษร คำศัพท์ ไวยากรณ์) และการอ่าน (ยังไม่มีการฟัง)
 * โครงสร้างตามข้อสอบจริง: https://www.jlpt.jp/e/guideline/testsections.html
 * จำนวนข้อเป็นตัวเลขโดยประมาณ (เว็บทางการไม่บอกจำนวนข้อของแต่ละแบบแล้ว) — ดู docs/n5-exam-plan.md
 * ต่อชุดใหม่ท้ายรายการเสมอ · id ของชุดและข้อห้ามเปลี่ยน (ผลสอบในเครื่องผู้ใช้อ้างถึง)
 */
export const EXAM_SETS: readonly ExamSet[] = [EXAM_SET_1, EXAM_SET_2];

export function getExamSet(id: string | undefined): ExamSet | undefined {
  return EXAM_SETS.find((s) => s.id === id);
}
