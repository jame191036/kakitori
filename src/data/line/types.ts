/**
 * โครงของ "สายบทเรียน" ที่ใช้ร่วมกันระหว่างคำศัพท์และคันจิ:
 * ชุด (deck) → ช่วง (segment, 区間) → บท (lesson = 1 สถานี) → รายการ (คำ / ตัวคันจิ)
 * - id ของรายการและบท = key ของความคืบหน้าใน localStorage และไฟล์สำรอง → **ห้ามเปลี่ยน id เดิม**
 * - ตรรกะสถานี ตรา และรอบทบทวน (features/line/lineLogic.ts) ใช้แค่ id จึงใช้ได้กับทุกชนิดรายการ
 */

export interface LineLesson {
  /** รหัสถาวรของบท */
  id: string;
  /** ชื่อบทภาษาญี่ปุ่น แสดงเป็นชื่อสถานี เช่น 'かぞく' */
  name: string;
  /** ชื่อบทภาษาไทย เช่น 'ครอบครัว' */
  title: string;
  /** id ของรายการในบท ตามลำดับที่สอน */
  words: readonly string[];
}

/** ช่วงของสาย (区間) — กลุ่มบทตามหัวข้อ */
export interface LineSegment {
  /** รหัสถาวรของช่วง */
  id: string;
  /** ชื่อช่วงภาษาญี่ปุ่น เช่น 'しょくじ' */
  name: string;
  /** ชื่อช่วงภาษาไทย */
  title: string;
  /** บทในช่วงนี้ — ว่าง = ยังไม่เปิด (แสดงป้าย 工事中) */
  lessons: readonly LineLesson[];
}

/** ชุดบทเรียนแบบสาย — T = ชนิดรายการ (คำศัพท์ / คันจิ) */
export interface LineDeck<T extends { id: string } = { id: string }> {
  /** รหัสชุด */
  id: string;
  /** key ความคืบหน้า (ProgressData.scripts[key]) */
  progressKey: string;
  name: string;
  /** อักษรนำหน้าเลขสถานี เช่น 'N' → N01 */
  letter: string;
  segments: readonly LineSegment[];
  /** ทุกบทของทุกช่วงที่เปิดแล้ว เรียงต่อกัน (เลขสถานีนับต่อเนื่องข้ามช่วง) */
  lessons: readonly LineLesson[];
  /** รายการทั้งหมดตาม id (ชื่อ words ใช้ร่วมกันทุกชนิดรายการ) */
  words: Readonly<Record<string, T>>;
}
