/**
 * โครงสร้างข้อมูลกลางของ "ชุดตัวอักษร" (script pack)
 *
 * ทุกหน้า (คัดตัวอักษร / แบบทดสอบ / ทบทวน / พิมพ์แบบฝึก) ทำงานกับ ScriptPack
 * แบบเดียวกัน ดังนั้นการเพิ่มคาตาคานะหรือคันจิในอนาคต = เพิ่มไฟล์ข้อมูลชุดใหม่
 * แล้วลงทะเบียนใน src/data/scripts/index.ts โดยไม่ต้องแก้หน้าจอ
 */

/** รหัสชุดตัวอักษร — เพิ่ม 'kanji' ฯลฯ ได้ในอนาคต */
export type ScriptId = 'hiragana' | 'katakana';

/**
 * ประเภทของกลุ่มตัวอักษร
 * - small: ตัวเล็ก (ゃ ゅ ょ っ) และ ー — ไม่มีเสียงของตัวเอง ฝึกเขียนได้แต่ไม่ออกข้อสอบ
 * - yoon: ตัวควบ (きゃ …) — ประกอบจาก 2 ตัว ไม่มีลำดับขีดของตัวเอง ฝึกอ่าน/ฟัง/ทำข้อสอบ ไม่ฝึกเขียน
 */
export type GroupKind = 'basic' | 'dakuten' | 'handakuten' | 'small' | 'yoon';

export interface CharGroup {
  /** รหัสกลุ่ม (ไม่ซ้ำในชุดเดียวกัน) เช่น 'ka' */
  id: string;
  /** ตัวอักษรแรกของแถว ใช้แสดงชื่อแถว เช่น 'か' */
  head: string;
  /** โรมาจิของแถว เช่น 'ka' */
  romaji: string;
  kind: GroupKind;
}

export interface CharEntry {
  /** slug ที่ไม่ซ้ำในชุด ใช้ใน URL และเป็น key ของข้อมูลความคืบหน้า เช่น 'ka', 'di' */
  id: string;
  /** ตัวอักษร เช่น 'か' */
  char: string;
  /** โรมาจิหลัก (Hepburn) */
  romaji: string;
  /** โรมาจิแบบอื่นที่ถือว่าถูกเหมือนกัน เช่น を = wo / o */
  romajiAlt?: readonly string[];
  /** คำอ่านภาษาไทยโดยประมาณ */
  thai: string;
  /** รหัสกลุ่ม (CharGroup.id) */
  group: string;
  /** คอลัมน์ในตาราง 0–4 (a i u e o) — ตัวควบใช้ 0 / 2 / 4 (ya yu yo) แบบเดียวกับแถว や */
  col: number;
  /**
   * ตัวควบ: ตัวอักษรที่ประกอบกัน เช่น ['き', 'ゃ'] (char = 'きゃ')
   * ไม่มีข้อมูลลำดับขีดของตัวเอง — ฝึกเขียนแยกทีละตัวจากตัวที่ประกอบ
   */
  parts?: readonly string[];
  /** หมายเหตุเพิ่มเติม (ภาษาไทย) */
  note?: string;
  /** สำหรับตัวขุ่น/ครึ่งขุ่น: ตัวอักษรต้นแบบ เช่น が → か */
  base?: string;
  /** ตัวอักษรที่หน้าตาคล้ายกันและมักสับสน (ใช้ทำตัวเลือกหลอกในแบบทดสอบ) */
  similar?: readonly string[];
  /** คำศัพท์ตัวอย่างที่มีตัวอักษรนี้ */
  example?: ExampleWord;
}

export interface ExampleWord {
  /** คำที่เขียนด้วยคานะ เช่น 'あめ' */
  kana: string;
  /** รูปคันจิที่ใช้กันทั่วไป (ถ้าปกติเขียนด้วยคันจิ) เช่น '雨' */
  kanji?: string;
  /** โรมาจิ — สะกดตามตัวคานะ (おう = ou, ー = สระซ้ำ) */
  romaji: string;
  /** ความหมายภาษาไทย */
  meaning: string;
  /** คำต้นทางของคำทับศัพท์ เช่น 'ice' */
  origin?: string;
}

/** ข้อมูลลำดับขีดของตัวอักษร 1 ตัว (พิกัดใน viewBox 0 0 109 109 ตาม KanjiVG) */
export interface StrokeData {
  /** SVG path `d` ของแต่ละขีด เรียงตามลำดับการเขียน */
  strokes: readonly string[];
  /** ตำแหน่งตัวเลขลำดับขีด [x, y] */
  numbers: readonly (readonly [number, number])[];
}

export interface StrokeSet {
  viewBox: number;
  chars: Readonly<Record<string, StrokeData>>;
}

export interface ScriptPack {
  id: ScriptId;
  /** ชื่อภาษาไทย เช่น 'ฮิรางานะ' */
  name: string;
  /** ชื่อภาษาญี่ปุ่น เช่น 'ひらがな' */
  nameJa: string;
  /** ชื่อภาษาอังกฤษ เช่น 'Hiragana' */
  nameEn: string;
  description: string;
  /**
   * ชุดคู่ที่มีเสียงตรงกันทีละตัว (เช่น ฮิรางานะ ↔ คาตาคานะ) — จับคู่ด้วย CharEntry.id
   * ใช้ทำข้อสอบแบบจับคู่
   */
  counterpart?: ScriptId;
  groups: readonly CharGroup[];
  chars: readonly CharEntry[];
  /** โหลดข้อมูลลำดับขีดแบบ lazy (แยกไฟล์ ไม่โหลดจนกว่าจะใช้) */
  loadStrokes: () => Promise<StrokeSet>;
}
