import { buildDeck, segment } from '../build';
import { GROUPS } from './groups';
import { MASU } from './masu';
import { TA } from './ta-form';
import { TE } from './te-form';

/**
 * ผันคำ N5 — เปิดช่วง 1–4 (11 บท 37 กฎ) จากทั้งหมด 8 ช่วง (แผนและกติกา: docs/n5-conj-plan.md)
 *
 * - การ์ด 1 ใบ = กฎ 1 ข้อ ข้อคำถามสุ่มคำใหม่ทุกครั้ง · รูปผันสร้างจากกฎใน conjugate.ts
 * - คำกริยามาจากสายคำศัพท์ N5 (และคำนาม + する) คำอธิบายเขียนโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ
 *
 * เปิดช่วงใหม่ต่อท้ายเสมอ (เลขสถานีของบทเดิมจะได้ไม่เปลี่ยน) · id ของกฎและบทห้ามเปลี่ยน
 */
export const CONJ_N5 = buildDeck({ id: 'conj-n5', progressKey: 'conj-n5', name: 'ผันคำ N5', letter: 'C' }, [
  GROUPS,
  MASU,
  TE,
  TA,
  segment('nai', 'ないけい', 'รูป ない'),
  segment('jisho', 'じしょけい', 'ย้อนหารูปพจนานุกรม'),
  segment('i-adj', 'いけいようし', 'คุณศัพท์ い'),
  segment('na-adj', 'なけいようし', 'คุณศัพท์ な'),
]);
