import { buildDeck } from '../build';
import { ADJECTIVE } from './adjective';
import { BASICS } from './basics';
import { COMPARE } from './compare';
import { INVITE } from './invite';
import { MORE } from './more';
import { PLACE } from './place';
import { PLAIN } from './plain';
import { TE_FORM } from './te-form';
import { VERBS } from './verbs';

/**
 * ไวยากรณ์ JLPT N5 — 77 รูป 30 บท 9 ช่วง (แผนและกติกาเนื้อหา: docs/n5-grammar-plan.md)
 *
 * - ไม่มีรายการไวยากรณ์ N5 อย่างเป็นทางการ — ใช้รายการตามที่ตำราเรียนระดับต้นทั่วไปสอน
 * - คำอธิบาย ประโยคตัวอย่าง และคำแปล เขียนโดยผู้พัฒนา (ผู้ใช้เลือกแล้ว) ใช้เฉพาะคำศัพท์ N5 ของเว็บ
 *   และคันจิ N5 — ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ (อยู่ในตารางตรวจเนื้อหา)
 *
 * เปิดช่วงใหม่ต่อท้ายเสมอ (เลขสถานีของบทเดิมจะได้ไม่เปลี่ยน) · id ของรูปไวยากรณ์และบทห้ามเปลี่ยน
 */
export const GRAMMAR_N5 = buildDeck({ id: 'grammar-n5', progressKey: 'grammar-n5', name: 'ไวยากรณ์ N5', letter: 'G' }, [
  BASICS,
  PLACE,
  VERBS,
  INVITE,
  ADJECTIVE,
  COMPARE,
  TE_FORM,
  PLAIN,
  MORE,
]);
