import type { LineDeck, LineLesson, LineSegment } from '../line/types';

/** กลุ่มของคำกริยา (3 = する / くる) */
export type VerbGroup = 1 | 2 | 3;

/** รูปผันที่สายนี้สอน (ลำดับ = ลำดับในบทเรียน) */
export const VERB_FORMS = [
  'masu',
  'masen',
  'mashita',
  'masendeshita',
  'masenka',
  'mashou',
  'tai',
  'te',
  'ta',
] as const;
export type VerbForm = (typeof VERB_FORMS)[number];

export interface FormInfo {
  /** ท้ายรูปเป็นภาษาญี่ปุ่น (ชิปในหน้าฝึกอิสระ) */
  ja: string;
  /** ชื่อสั้นภาษาไทย */
  thai: string;
  /** โจทย์ในข้อคำถาม — บอกความหมายแทนท้ายรูป ไม่ให้เฉลยตัวเอง */
  ask: string;
}

export const FORM_INFO: Readonly<Record<VerbForm, FormInfo>> = {
  masu: { ja: 'ます', thai: 'สุภาพ', ask: 'รูป ます (สุภาพ)' },
  masen: { ja: 'ません', thai: 'ไม่… (สุภาพ)', ask: 'ปฏิเสธ: ไม่… (สุภาพ)' },
  mashita: { ja: 'ました', thai: '…แล้ว (สุภาพ)', ask: 'อดีต: …แล้ว (สุภาพ)' },
  masendeshita: { ja: 'ませんでした', thai: 'ไม่ได้… (สุภาพ)', ask: 'ปฏิเสธในอดีต: ไม่ได้… (สุภาพ)' },
  masenka: { ja: 'ませんか', thai: 'ชวนแบบถาม', ask: 'ชวนแบบถาม: …ด้วยกันไหม' },
  mashou: { ja: 'ましょう', thai: 'ชวน …กันเถอะ', ask: 'ชวน: …กันเถอะ' },
  tai: { ja: 'たい', thai: 'อยาก…', ask: 'อยาก…' },
  te: { ja: 'て', thai: 'รูปเชื่อม', ask: 'รูป て' },
  ta: { ja: 'た', thai: 'อดีต (กันเอง)', ask: 'รูป た (อดีต แบบกันเอง)' },
};

export interface ConjVerb {
  id: string;
  /** คำนามหน้า する เช่น べんきょう ('' = คำกริยาธรรมดา) */
  prefix: string;
  /** รูปพจนานุกรมเป็นคานะ (รวม prefix) */
  kana: string;
  /** รูปที่เขียนด้วยคันจิตามปกติ */
  kanji?: string;
  thai: string;
  group: VerbGroup;
  /** รูปที่ไม่เอามาออกข้อ (ใช้ไม่เป็นธรรมชาติ) */
  skip: readonly VerbForm[];
}

/** การ์ดกฎ 1 ใบ = 1 รายการในสาย (ความคืบหน้าเก็บตาม id) */
export interface ConjRule {
  /** รหัสถาวร — ห้ามเปลี่ยน (เป็น key ของความคืบหน้า) */
  id: string;
  /** หัวการ์ด เช่น 'たべる → たべます' */
  pattern: string;
  /** กฎสั้นๆ ภาษาไทย */
  title: string;
  /** คำอธิบาย (ย่อหน้าละรายการ) */
  explain: readonly string[];
  note?: string;
  /** รูปที่กฎนี้สอน — null = กฎแยกกลุ่ม */
  form: VerbForm | null;
  /** id ของคำที่ใช้กฎนี้ (สุ่มออกข้อ) */
  words: readonly string[];
  /** id ของคำตัวอย่างบนการ์ด */
  examples: readonly string[];
  /** ตัวเลือกผิดเน้นต่างกันที่ไหน: ตัวคำก่อนท้ายรูป (stem) หรือท้ายรูป (ending) */
  focus: 'stem' | 'ending';
  /** กฎรวม (คำในกฎซ้ำกับการ์ดอื่น) — หน้าฝึกอิสระไม่นับเป็นกฎของคำนั้น */
  mixed?: boolean;
}

export type ConjDeck = LineDeck<ConjRule>;
export type ConjLesson = LineLesson;
export type ConjSegment = LineSegment;
