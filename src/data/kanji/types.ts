import type { LineDeck } from '../line/types';

/**
 * คันจิ (สายคันจิ N5) — แต่ละตัวเป็น "รายการ" ของสายบทเรียน (ใช้ตรรกะสถานี/ตรา/ทบทวนร่วมกับคำศัพท์)
 * - id = ตัวคันจิเอง (เช่น '日') — เป็น key ของความคืบหน้า **ห้ามเปลี่ยน**
 * - คำอ่านแสดงเฉพาะที่ใช้ในคำศัพท์ N5 ของเว็บ (ผู้ใช้เลือกแล้ว) พร้อมคำตัวอย่างจากคลังคำศัพท์
 */

/** อง (音 เสียงจีน) / คุง (訓 เสียงญี่ปุ่น) */
export type ReadingKind = 'on' | 'kun';

export interface KanjiReading {
  /** คำอ่านเป็นฮิรางานะ (อองก็เขียนฮิรางานะ จะได้เทียบกับคำตัวอย่างง่าย) — หลายรูปคั่นด้วย ・ เช่น 'ひ・び' */
  kana: string;
  kind: ReadingKind;
  /** id คำศัพท์ N5 ที่ใช้คำอ่านนี้ (แสดงเป็นคำตัวอย่าง) */
  words: readonly string[];
}

/** ตัวอย่างที่ไม่อยู่ในคลังคำศัพท์ (เช่น 円 → 百円) */
export interface KanjiExtraExample {
  written: string;
  kana: string;
  thai: string;
}

export interface KanjiEntry {
  /** = ตัวคันจิ */
  id: string;
  char: string;
  /** จำนวนขีด (จาก KANJIDIC2 — เทสตรวจว่าตรงกับข้อมูลลำดับขีด KanjiVG) */
  strokes: number;
  /** ความหมายภาษาไทย (ชื่อ thai เพื่อใช้ตัวช่วยเลือกตัวหลอกร่วมกับคำศัพท์) */
  thai: string;
  readings: readonly KanjiReading[];
  /** คำที่อ่านพิเศษทั้งคำ ไม่ได้อ่านตามคำอ่านของแต่ละตัว (เช่น 今日 = きょう) — id คำศัพท์ */
  special?: readonly string[];
  extra?: readonly KanjiExtraExample[];
  note?: string;
}

export type KanjiDeck = LineDeck<KanjiEntry>;
