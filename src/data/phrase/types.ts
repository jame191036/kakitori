import type { Sentence } from '../grammar/sentence';
import type { LineDeck } from '../line/types';

/**
 * สายวลี (ท่องเที่ยว · ชีวิตประจำวัน · การ์ตูน) — วลี = 1 รายการในสาย
 *
 * say = ประโยคที่เราพูด · hear = ประโยคที่จะได้ยิน (พนักงาน / ประกาศ — แค่ฟังให้ออก ไม่ต้องพูดเอง)
 * · sign = ป้าย (อ่านให้ออก — แสดงตัวหนังสือบนป้ายตัวใหญ่)
 */
export type PhraseKind = 'say' | 'hear' | 'sign';

/** ข้อความภาษาญี่ปุ่น 1 ประโยคในรูปที่แสดง: คานะใหญ่ · แบบเขียนจริง · โรมาจิ */
export interface PhraseText {
  /** คานะเว้นวรรคตามชิ้น + เครื่องหมายท้าย เช่น 'きっぷは どこで かえますか？' (แสดงตัวใหญ่) */
  kana: string;
  /** แบบเขียนจริง + เครื่องหมายท้าย เช่น '切符はどこで買えますか？' */
  written: string;
  /** โรมาจิ เว้นวรรคตามชิ้น เช่น 'kippu wa doko de kaemasu ka?' */
  romaji: string;
}

export interface Phrase extends PhraseText {
  /** รหัสถาวร — ห้ามเปลี่ยน (เป็น key ของความคืบหน้า) */
  id: string;
  kind: PhraseKind;
  /** ประโยคแบบเขียนจริง (มีคันจิพร้อมคำอ่าน) — ใช้เสียงอ่าน */
  sentence: Sentence;
  /** ประโยคเป็นคานะล้วน แบ่งชิ้นเหมือน sentence — ใช้ทำข้อเรียงประโยค */
  kanaSentence: Sentence;
  /** ความหมายไทย (ไม่ซ้ำกันทั้งสาย — ใช้เป็นตัวเลือก) */
  thai: string;
  /** ใช้เมื่อไร / ระวังอะไร */
  note?: string;
  /** แบบกันเอง (ใช้กับเพื่อน / คนสนิท) — แสดงคู่กันในการ์ดเรียน ไม่ได้ถาม */
  casual?: PhraseText;
  /** แบบสุภาพ (สายการ์ตูน: วลีหลักเป็นแบบกันเอง) — แสดงคู่กันในการ์ดเรียน ไม่ได้ถาม */
  polite?: PhraseText;
  /** คำเตือน เช่น คำหยาบ / ภาษาการ์ตูนที่ชีวิตจริงไม่ใช้ — แสดงเป็นกล่องเตือนในการ์ดเรียน */
  caution?: string;
  /** ใช้ทำข้อเรียงประโยคได้ (เรียงได้แบบเดียว) */
  arrange: boolean;
  /** id ของวลีที่ใช้แทนกันได้ในบางสถานการณ์ — ห้ามเป็นตัวหลอกของกันและกัน */
  avoid?: readonly string[];
}

/** บทสนทนาตัวอย่าง 1 บรรทัด */
export interface DialogueLine extends PhraseText {
  /** ชื่อผู้พูด (ภาษาไทย) */
  speaker: string;
  /** ฝั่งของผู้พูด: a = ซ้าย · b = ขวา (ผู้เรียนมักเป็นฝั่ง b) */
  side: 'a' | 'b';
  thai: string;
}

export interface Dialogue {
  /** สถานการณ์ (ภาษาไทย) */
  scene: string;
  lines: readonly DialogueLine[];
}

export interface PhraseDeck extends LineDeck<Phrase> {
  /** บทสนทนาตัวอย่างของแต่ละบท (key = id ของบท) */
  dialogues?: Readonly<Record<string, Dialogue>>;
  /** หัวข้อกล่องบทสนทนา (ค่าเริ่มต้น "บทสนทนาตัวอย่าง" · สายการ์ตูน = "ฉากตัวอย่าง") */
  dialogueLabel?: string;
}
