import type { LineDeck, LineLesson, LineSegment } from '../line/types';
import type { Sentence } from './sentence';

/** ประโยคตัวอย่างของรูปไวยากรณ์ */
export interface GrammarExample {
  sentence: Sentence;
  /** คำแปลภาษาไทย (ใช้เป็นคำใบ้ในข้อเติมคำด้วย จึงต้องชัดพอให้มีคำตอบเดียว) */
  thai: string;
  /** ตัวเลือกผิดของข้อเติมคำ (markup แบบ parseInline) — ต้องผิดจริงเมื่อเทียบกับคำแปล */
  wrong: readonly string[];
  /** ใช้ทำข้อเรียงประโยคได้ (มีลำดับที่ถูกแบบเดียว) */
  arrange: boolean;
}

/** รูปไวยากรณ์ 1 ข้อ = 1 รายการในสาย (ความคืบหน้าเก็บตาม id) */
export interface GrammarPoint {
  /** รหัสถาวร — ห้ามเปลี่ยน (เป็น key ของความคืบหน้า) */
  id: string;
  /** รูปประโยค เช่น 'A は B です' */
  pattern: string;
  /** ความหมาย/ชื่อเรียกภาษาไทยสั้นๆ */
  title: string;
  /** คำอธิบายภาษาไทย (ย่อหน้าละรายการ) */
  explain: readonly string[];
  note?: string;
  examples: readonly GrammarExample[];
}

export type GrammarLesson = LineLesson;
export type GrammarSegment = LineSegment;
export type GrammarDeck = LineDeck<GrammarPoint>;
