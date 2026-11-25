import { buildDeck } from '../build';
import { GROUPS } from './groups';
import { I_ADJ } from './i-adj';
import { JISHO } from './jisho';
import { MASU } from './masu';
import { NA_ADJ } from './na-adj';
import { NAI } from './nai';
import { TA } from './ta-form';
import { TE } from './te-form';

/**
 * ผันคำ N5 — 8 ช่วง 22 บท 78 กฎ (แผนและกติกา: docs/n5-conj-plan.md)
 *
 * - การ์ด 1 ใบ = กฎ 1 ข้อ ข้อคำถามสุ่มคำใหม่ทุกครั้ง · รูปผันสร้างจากกฎใน conjugate.ts
 * - คำกริยาและคำคุณศัพท์มาจากสายคำศัพท์ N5 (และคำนาม + する) คำอธิบายเขียนโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ
 *
 * เปิดช่วงใหม่ต่อท้ายเสมอ (เลขสถานีของบทเดิมจะได้ไม่เปลี่ยน) · id ของกฎและบทห้ามเปลี่ยน
 */
export const CONJ_N5 = buildDeck({ id: 'conj-n5', progressKey: 'conj-n5', name: 'ผันคำ N5', letter: 'C' }, [
  GROUPS,
  MASU,
  TE,
  TA,
  NAI,
  JISHO,
  I_ADJ,
  NA_ADJ,
]);
