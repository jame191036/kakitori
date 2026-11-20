import { buildDeck, segment } from '../build';
import { BASICS } from './basics';
import { PLACE } from './place';
import { VERBS } from './verbs';

/**
 * ไวยากรณ์ JLPT N5 — ประมาณ 75 รูป แบ่งเป็น 9 ช่วง (แผนทั้งสาย: docs/n5-grammar-plan.md)
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
  segment('invite', 'さそう', 'ชวนและอยาก'),
  segment('adjective', 'けいようし', 'คำคุณศัพท์'),
  segment('compare', 'くらべる', 'เปรียบเทียบและเหตุผล'),
  segment('te-form', 'てけい', 'รูป て'),
  segment('plain-form', 'ふつうけい', 'รูปธรรมดา'),
  segment('more', 'いろいろ', 'รูปอื่นๆ ที่ใช้บ่อย'),
]);
