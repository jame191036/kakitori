/**
 * คำศัพท์ (หมวด JLPT ฯลฯ)
 * - id ของคำและบท = key ของความคืบหน้าใน localStorage และไฟล์สำรอง → **ห้ามเปลี่ยน id เดิม**
 *   (แก้คำอ่าน/ความหมายได้ตามสบาย แต่ id ต้องคงที่ เพื่อซิงก์/นำเข้าข้อมูลข้ามเครื่องได้ในอนาคต)
 */

/** ชนิดคำ (แสดงเป็นป้ายเล็กๆ บนการ์ดคำ) */
export type WordKind = 'expr' | 'num' | 'noun' | 'pron' | 'verb' | 'adj-i' | 'adj-na' | 'adv';

export interface VocabWord {
  /** รหัสถาวร (โรมาจิ + ตัวแยกถ้าซ้ำ) เช่น 'mizu', 'hashi-bridge' */
  id: string;
  /** คำอ่านเป็นคานะ (ฮิรางานะ หรือคาตาคานะสำหรับคำทับศัพท์) — แสดงตัวใหญ่ และใช้ฝึกเขียน */
  kana: string;
  /** รูปที่เขียนด้วยคันจิตามปกติ (ไม่ใส่ = ปกติเขียนด้วยคานะ) — แสดงตัวเล็ก */
  kanji?: string;
  /** โรมาจิ (Hepburn: おう = ou, ー = สระซ้ำ, は ที่เป็นคำช่วยในวลี = wa) */
  romaji: string;
  /** ความหมายภาษาไทย */
  thai: string;
  kind: WordKind;
  /** หมายเหตุสั้นๆ เช่น วิธีใช้ คำอ่านอื่น */
  note?: string;
}

export interface VocabLesson {
  /** รหัสถาวรของบท */
  id: string;
  /** ชื่อบทภาษาญี่ปุ่น (คานะ) แสดงเป็นชื่อสถานี เช่น 'かぞく' */
  name: string;
  /** ชื่อบทภาษาไทย เช่น 'ครอบครัว' */
  title: string;
  /** id ของคำในบท ตามลำดับที่สอน */
  words: readonly string[];
}

export interface VocabDeck {
  /** รหัสชุดคำ — ใช้เป็น key ความคืบหน้า (ProgressData.scripts[key]) */
  id: string;
  /** key ความคืบหน้า (แยกจากชุดตัวอักษร) */
  progressKey: string;
  name: string;
  /** อักษรนำหน้าเลขสถานี เช่น 'N' → N01 */
  letter: string;
  lessons: readonly VocabLesson[];
  words: Readonly<Record<string, VocabWord>>;
}
