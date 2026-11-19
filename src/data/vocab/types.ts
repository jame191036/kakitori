/**
 * คำศัพท์ (หมวด JLPT ฯลฯ)
 * - id ของคำและบท = key ของความคืบหน้าใน localStorage และไฟล์สำรอง → **ห้ามเปลี่ยน id เดิม**
 *   (แก้คำอ่าน/ความหมายได้ตามสบาย แต่ id ต้องคงที่ เพื่อซิงก์/นำเข้าข้อมูลข้ามเครื่องได้ในอนาคต)
 * - ชุดคำ (deck) → ช่วง (segment, 区間) → บท (lesson = 1 สถานี) → คำ
 */

import type { LineDeck, LineLesson, LineSegment } from '../line/types';

/** ชนิดคำ (แสดงเป็นป้ายเล็กๆ บนการ์ดคำ) */
export type WordKind =
  | 'expr'
  | 'num'
  | 'noun'
  | 'pron'
  | 'q'
  | 'verb'
  | 'adj-i'
  | 'adj-na'
  | 'adv'
  | 'conj'
  /** คำขยายนาม (連体詞) ต้องมีคำนามตามหลัง เช่น この, おおきな */
  | 'prenoun'
  /** คำช่วย เช่น より, など */
  | 'prt';

export interface VocabWord {
  /** รหัสถาวร (โรมาจิ + ตัวแยกถ้าซ้ำ) เช่น 'mizu', 'hashi-bridge' */
  id: string;
  /** คำอ่านเป็นคานะ (ฮิรางานะ หรือคาตาคานะสำหรับคำทับศัพท์) — แสดงตัวใหญ่ และใช้ฝึกเขียน */
  kana: string;
  /** รูปที่เขียนด้วยคันจิตามปกติ (ไม่ใส่ = ปกติเขียนด้วยคานะ) — แสดงตัวเล็ก */
  kanji?: string;
  /** โรมาจิ (Hepburn: おう = ou, ー = สระซ้ำ, は ที่เป็นคำช่วยในวลี = wa) — ปกติสร้างจากคานะอัตโนมัติ */
  romaji: string;
  /**
   * ความหมายภาษาไทย — คั่นความหมายย่อยด้วย " / " และขยายความในวงเล็บ
   * (ตัวหลอกในข้อสอบจะไม่ใช้คำที่มีความหมายย่อยซ้ำกับคำตอบ เช่น "พี่ชาย" กับ "พี่ชาย (ของเรา)")
   */
  thai: string;
  kind: WordKind;
  /** หมายเหตุสั้นๆ เช่น วิธีใช้ คำอ่านอื่น */
  note?: string;
}

/** บท / ช่วง / ชุด ใช้โครงสายบทเรียนร่วมกับคันจิ (ดู data/line/types.ts) */
export type VocabLesson = LineLesson;
export type VocabSegment = LineSegment;
export type VocabDeck = LineDeck<VocabWord>;
