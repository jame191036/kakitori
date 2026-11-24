import { buildPhraseDeck, segment } from '../phrase/build';
import type { Phrase } from '../phrase/types';
import { HANASHIKATA } from './hanashikata';
import { REACTION } from './reaction';
import { YOBIKATA } from './yobikata';

/**
 * สายการ์ตูน / ซีรีส์ — สำนวนที่ได้ยินบ่อยและวิธีพูดแบบการ์ตูน 9 ช่วง (แผน: docs/anime-plan.md)
 * - วลีหลักเป็นแบบกันเอง (แบบที่ตัวละครพูด) · มีแบบสุภาพคู่กัน (polite) · คำหยาบ/ภาษาการ์ตูนมีคำเตือน (caution)
 * - วลีที่ห้ามพูดจริง (คำด่า · คำห้วน) เป็นชนิด "ได้ยิน" = ฟังให้เข้าใจพอ
 * - ทุกบทมีฉากตัวอย่าง · ตัวละครและประโยคทั้งหมดแต่งขึ้นเอง ไม่ได้ยกมาจากการ์ตูนเรื่องใด
 * - วลี ฉาก และคำแปลเขียนโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ (อยู่ในตารางตรวจเนื้อหา)
 *
 * เปิดช่วงตามลำดับเสมอ (เลขสถานีของบทเดิมจะได้ไม่เปลี่ยน) · id ของวลีและบทห้ามเปลี่ยน
 */
export const ANIME_DECK = buildPhraseDeck(
  { id: 'anime', progressKey: 'anime', name: 'การ์ตูน', letter: 'A', dialogueLabel: 'ฉากตัวอย่าง' },
  [
    REACTION,
    YOBIKATA,
    HANASHIKATA,
    segment<Phrase>('gakkou', 'がっこう', 'ชีวิตในโรงเรียน'),
    segment<Phrase>('tomodachi', 'ともだち', 'เพื่อน เที่ยวเล่น'),
    segment<Phrase>('tatakai', 'たたかい', 'ฉากต่อสู้'),
    segment<Phrase>('renai', 'れんあい', 'ความรัก'),
    segment<Phrase>('fantasy', 'ファンタジー', 'แฟนตาซี เวทมนตร์'),
    segment<Phrase>('oyakusoku', 'おやくそく', 'ประโยคเด็ดประจำการ์ตูน'),
  ],
);
