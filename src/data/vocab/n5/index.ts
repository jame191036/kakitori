import { buildDeck, segment } from '../build';
import { BODY } from './body';
import { FOOD } from './food';
import { HOME } from './home';
import { NATURE } from './nature';
import { NUMBERS } from './numbers';
import { PEOPLE } from './people';
import { SCHOOL } from './school';
import { TIME } from './time';
import { TOWN } from './town';

/**
 * คำศัพท์ JLPT N5 — แบ่งเป็นช่วงตามหัวข้อ (ช่วงละหลายบท บทละ ~8 คำ = 1 สถานี)
 *
 * ที่มา
 * - รายการคำ: JLPT N5 ของ Jonathan Waller (tanos.co.uk, CC BY) ผ่านชุดข้อมูล
 *   github.com/stephenmk/yomitan-jlpt-vocab (CC BY-SA 4.0) — ใช้แค่ "คำไหนอยู่ใน N5"
 *   (ตั้งแต่ปี 2010 ไม่มีรายการคำ N5 อย่างเป็นทางการ ทุกรายการเป็นการประมาณ)
 * - คำอ่าน/คันจิ: ตรวจกับพจนานุกรม JMdict (EDRDG, CC BY-SA 4.0) · ใช้รูปเขียนที่นิยมในปัจจุบัน
 *   และไม่ใส่คันจิให้คำที่ปกติเขียนด้วยคานะ
 * - ความหมายภาษาไทยและหมายเหตุ: เขียนโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ (ดู docs/content-review)
 * - ข้อมูลคำศัพท์ชุดนี้ (รวมความหมายไทย) เผยแพร่ภายใต้ CC BY-SA 4.0 ตามแหล่งที่มา
 *
 * คำซ้ำในรายการต้นทางรวมเป็นการ์ดเดียว (เช่น し/よん, いく/ゆく) และคำเก่าที่ใช้น้อยแล้วอยู่ช่วงสุดท้าย
 * แผนว่าคำไหนอยู่ช่วงไหน: docs/n5-vocab-plan.md — ช่วงที่ยังไม่เปิดมีแค่ชื่อ (lessons ว่าง = 工事中)
 * เปิดช่วงใหม่ต่อท้ายเสมอ เพื่อให้เลขสถานีของบทเดิมไม่เปลี่ยน
 */
export const N5_DECK = buildDeck({ id: 'n5', progressKey: 'vocab-n5', name: 'คำศัพท์ N5', letter: 'N' }, [
  PEOPLE,
  NUMBERS,
  FOOD,
  TIME,
  HOME,
  TOWN,
  SCHOOL,
  BODY,
  NATURE,
  segment('actions', 'うごき', 'คำกริยาในชีวิตประจำวัน'),
  segment('describe', 'ようす', 'คำบอกลักษณะ'),
  segment('words', 'ことば', 'คำชี้ คำถาม และคำเชื่อม'),
  segment('old', 'むかし', 'คำที่ใช้น้อยลงแล้ว'),
]);
