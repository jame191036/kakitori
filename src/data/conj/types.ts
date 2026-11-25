import type { LineDeck, LineLesson, LineSegment } from '../line/types';

/** กลุ่มของคำกริยา (3 = する / くる) */
export type VerbGroup = 1 | 2 | 3;

/** ชนิดคำที่ผันได้: คำกริยา · คุณศัพท์ い · คุณศัพท์ な */
export type ConjKind = 'verb' | 'i' | 'na';

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
  'nai',
  'nakereba',
  'nakutemo',
  'naide',
] as const;
export const I_FORMS = ['kunai', 'katta', 'kunakatta', 'kute', 'ku', 'kattadesu'] as const;
export const NA_FORMS = [
  'jaarimasen',
  'deshita',
  'jaarimasendeshita',
  'janai',
  'datta',
  'janakatta',
  'na',
  'de',
  'ni',
] as const;

export type VerbForm = (typeof VERB_FORMS)[number];
export type IForm = (typeof I_FORMS)[number];
export type NaForm = (typeof NA_FORMS)[number];
export type Form = VerbForm | IForm | NaForm;

export const FORMS_OF: Readonly<Record<ConjKind, readonly Form[]>> = { verb: VERB_FORMS, i: I_FORMS, na: NA_FORMS };
export const ALL_FORMS: readonly Form[] = [...VERB_FORMS, ...I_FORMS, ...NA_FORMS];

export interface FormInfo {
  kind: ConjKind;
  /** ท้ายรูปเป็นภาษาญี่ปุ่น (ชิปในหน้าฝึกอิสระ) */
  ja: string;
  /** ชื่อสั้นภาษาไทย */
  thai: string;
  /** โจทย์ในข้อคำถาม — บอกความหมายแทนท้ายรูป ไม่ให้เฉลยตัวเอง */
  ask: string;
}

const v = (ja: string, thai: string, ask: string): FormInfo => ({ kind: 'verb', ja, thai, ask });
const i = (ja: string, thai: string, ask: string): FormInfo => ({ kind: 'i', ja, thai, ask });
const na = (ja: string, thai: string, ask: string): FormInfo => ({ kind: 'na', ja, thai, ask });

export const FORM_INFO: Readonly<Record<Form, FormInfo>> = {
  masu: v('ます', 'สุภาพ', 'รูป ます (สุภาพ)'),
  masen: v('ません', 'ไม่… (สุภาพ)', 'ปฏิเสธ: ไม่… (สุภาพ)'),
  mashita: v('ました', '…แล้ว (สุภาพ)', 'อดีต: …แล้ว (สุภาพ)'),
  masendeshita: v('ませんでした', 'ไม่ได้… (สุภาพ)', 'ปฏิเสธในอดีต: ไม่ได้… (สุภาพ)'),
  masenka: v('ませんか', 'ชวนแบบถาม', 'ชวนแบบถาม: …ด้วยกันไหม'),
  mashou: v('ましょう', 'ชวน …กันเถอะ', 'ชวน: …กันเถอะ'),
  tai: v('たい', 'อยาก…', 'อยาก…'),
  te: v('て', 'รูปเชื่อม', 'รูป て'),
  ta: v('た', 'อดีต (กันเอง)', 'รูป た (อดีต แบบกันเอง)'),
  nai: v('ない', 'ไม่… (กันเอง)', 'รูป ない (ไม่… แบบกันเอง)'),
  nakereba: v('なければ', 'ต้อง…', 'ต่อด้วย なりません: ต้อง…'),
  nakutemo: v('なくても', 'ไม่ต้อง…ก็ได้', 'ต่อด้วย いいです: ไม่ต้อง…ก็ได้'),
  naide: v('ないで', 'กรุณาอย่า…', 'ต่อด้วย ください: กรุณาอย่า…'),
  kunai: i('くない', 'ไม่…', 'ปฏิเสธ: ไม่…'),
  katta: i('かった', 'อดีต', 'อดีต: ตอนนั้น…'),
  kunakatta: i('くなかった', 'ไม่… (อดีต)', 'ปฏิเสธในอดีต: ตอนนั้นไม่…'),
  kute: i('くて', 'เชื่อม: …และ…', 'เชื่อมกับคำอื่น: …และ…'),
  ku: i('く', 'กลายเป็น…', 'ต่อด้วย なります: กลายเป็น…'),
  kattadesu: i('かったです', 'อดีต (สุภาพ)', 'อดีต: ตอนนั้น… (สุภาพ)'),
  jaarimasen: na('じゃありません', 'ไม่… (สุภาพ)', 'ปฏิเสธ: ไม่… (สุภาพ)'),
  deshita: na('でした', 'อดีต (สุภาพ)', 'อดีต: ตอนนั้น… (สุภาพ)'),
  jaarimasendeshita: na('じゃありませんでした', 'ไม่… (อดีต สุภาพ)', 'ปฏิเสธในอดีต: ตอนนั้นไม่… (สุภาพ)'),
  janai: na('じゃない', 'ไม่… (กันเอง)', 'ปฏิเสธ: ไม่… (กันเอง)'),
  datta: na('だった', 'อดีต (กันเอง)', 'อดีต: ตอนนั้น… (กันเอง)'),
  janakatta: na('じゃなかった', 'ไม่… (อดีต กันเอง)', 'ปฏิเสธในอดีต: ตอนนั้นไม่… (กันเอง)'),
  na: na('な', 'ขยายคำนาม', 'ขยายคำนาม (วางหน้าคำนาม)'),
  de: na('で', 'เชื่อม: …และ…', 'เชื่อมกับคำอื่น: …และ…'),
  ni: na('に', 'กลายเป็น…', 'ต่อด้วย なります: กลายเป็น…'),
};

export interface ConjWord {
  id: string;
  kind: ConjKind;
  /** คำนามหน้า する เช่น べんきょう ('' = คำธรรมดา) */
  prefix: string;
  /** รูปพจนานุกรมเป็นคานะ (รวม prefix) · คุณศัพท์ な = ไม่มี な */
  kana: string;
  /** รูปที่เขียนด้วยคันจิตามปกติ */
  kanji?: string;
  thai: string;
  /** กลุ่มของคำกริยา (คุณศัพท์ = null) */
  group: VerbGroup | null;
  /** รูปที่ไม่เอามาออกข้อ (ใช้ไม่เป็นธรรมชาติ) */
  skip: readonly Form[];
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
  form: Form | null;
  /** id ของคำที่ใช้กฎนี้ (สุ่มออกข้อ) */
  words: readonly string[];
  /** id ของคำตัวอย่างบนการ์ด */
  examples: readonly string[];
  /** ตัวเลือกผิดเน้นต่างกันที่ไหน: ตัวคำก่อนท้ายรูป (stem) หรือท้ายรูป (ending) */
  focus: 'stem' | 'ending';
  /** กฎรวม (คำในกฎซ้ำกับการ์ดอื่น) — หน้าฝึกอิสระไม่นับเป็นกฎของคำนั้น */
  mixed?: boolean;
  /** กฎย้อนกลับ: จากรูปนี้หารูปพจนานุกรม */
  reverse?: boolean;
}

export type ConjDeck = LineDeck<ConjRule>;
export type ConjLesson = LineLesson;
export type ConjSegment = LineSegment;
