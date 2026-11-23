import type { ExamSeg, PassageBlock } from './text';

/**
 * ประเภทข้อ (もんだい) ตามข้อสอบ JLPT N5 จริง — https://www.jlpt.jp/e/guideline/testsections.html
 * ส่วนการฟัง (聴解) ยังไม่มี
 */
export type MondaiKind =
  | 'kanji-reading' // 漢字読み — อ่านคันจิ
  | 'orthography' // 表記 — เขียนเป็นคันจิ/คาตาคานะ
  | 'context' // 文脈規定 — เลือกคำเข้าบริบท
  | 'paraphrase' // 言い換え類義 — ประโยคความหมายใกล้กัน
  | 'grammar-form' // 文の文法1 — เลือกรูปไวยากรณ์
  | 'composition' // 文の文法2 — เรียงประโยค (ช่อง ★)
  | 'text-grammar' // 文章の文法 — ไวยากรณ์ในบทความ
  | 'reading-short' // 内容理解（短文）— อ่านบทสั้น
  | 'reading-mid' // 内容理解（中文）— อ่านบทกลาง
  | 'info'; // 情報検索 — หาข้อมูลจากประกาศ

/** หมวดย่อยของคะแนน (ข้อสอบจริงรายงาน もじ・ごい・ぶんぽう รวมกัน และ どっかい แยก — ที่นี่แยก 3 หมวดให้เห็นจุดอ่อนชัดขึ้น) */
export type ExamPart = 'vocab' | 'grammar' | 'reading';

export interface ExamQuestion {
  /** รหัสถาวร เช่น n5-1:v07 (ใช้เก็บคำตอบ — ห้ามเปลี่ยนเมื่อมีผู้ใช้แล้ว) */
  id: string;
  /** เลขข้อในส่วนนั้น (นับต่อกันทั้งส่วน แบบข้อสอบจริง) */
  no: number;
  kind: MondaiKind;
  /** โจทย์ (ข้อในบทความไม่มีโจทย์ของตัวเอง) */
  stem: ExamSeg[] | null;
  stemSrc: string | null;
  choices: ExamSeg[][];
  choiceSrc: string[];
  /** ตัวเลือกที่ถูก (0–3) */
  answer: number;
  /** ข้อเรียงประโยค: ลำดับตัวเลือก (0–3) ตามประโยคที่ถูก */
  order?: number[];
  /** คำแปลไทยของโจทย์/ประโยคที่ถูก (แสดงตอนดูเฉลย) */
  thai: string;
  /** เหตุผลสั้นๆ ว่าทำไมข้อนี้ถูก */
  explain: string;
}

export interface ExamGroup {
  /** บทความ/ประกาศ (ข้ออ่านและข้อไวยากรณ์ในบทความ) */
  passage: PassageBlock[] | null;
  passageSrc: string | null;
  passageThai: string | null;
  questions: ExamQuestion[];
}

export interface ExamMondai {
  /** もんだい ที่เท่าไรของส่วนนั้น */
  no: number;
  kind: MondaiKind;
  groups: ExamGroup[];
}

export interface ExamSection {
  id: 'v' | 'g';
  /** ชื่อส่วนแบบข้อสอบจริง */
  ja: string;
  th: string;
  minutes: number;
  mondai: ExamMondai[];
  questions: ExamQuestion[];
}

export interface ExamSet {
  id: string;
  title: string;
  sections: ExamSection[];
  questions: ExamQuestion[];
}
