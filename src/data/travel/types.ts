import type { Sentence } from '../grammar/sentence';
import type { LineDeck } from '../line/types';

/**
 * say = ประโยคที่เราพูด · hear = ประโยคที่จะได้ยิน (พนักงาน / ประกาศ — แค่ฟังให้ออก ไม่ต้องพูดเอง)
 * · sign = ป้าย (อ่านให้ออก — แสดงตัวหนังสือบนป้ายตัวใหญ่)
 */
export type PhraseKind = 'say' | 'hear' | 'sign';

/** วลี 1 รายการ = 1 รายการในสาย (ความคืบหน้าเก็บตาม id) */
export interface TravelPhrase {
  /** รหัสถาวร — ห้ามเปลี่ยน (เป็น key ของความคืบหน้า) */
  id: string;
  kind: PhraseKind;
  /** ประโยคแบบเขียนจริง (มีคันจิพร้อมคำอ่าน) — ใช้เสียงอ่านและแสดงตัวเล็ก */
  sentence: Sentence;
  /** ประโยคเป็นคานะล้วน แบ่งชิ้นเหมือน sentence — ใช้ทำข้อเรียงประโยค */
  kanaSentence: Sentence;
  /** คานะเว้นวรรคตามชิ้น + เครื่องหมายท้าย เช่น 'きっぷは どこで かえますか？' (แสดงตัวใหญ่) */
  kana: string;
  /** แบบเขียนจริง + เครื่องหมายท้าย เช่น '切符はどこで買えますか？' */
  written: string;
  /** โรมาจิ เว้นวรรคตามชิ้น เช่น 'kippu wa doko de kaemasu ka?' */
  romaji: string;
  /** ความหมายไทย (ไม่ซ้ำกันทั้งสาย — ใช้เป็นตัวเลือก) */
  thai: string;
  /** ใช้เมื่อไร / ระวังอะไร */
  note?: string;
  /** ใช้ทำข้อเรียงประโยคได้ (เรียงได้แบบเดียว) */
  arrange: boolean;
  /** id ของวลีที่ใช้แทนกันได้ในบางสถานการณ์ — ห้ามเป็นตัวหลอกของกันและกัน */
  avoid?: readonly string[];
}

export type TravelDeck = LineDeck<TravelPhrase>;
