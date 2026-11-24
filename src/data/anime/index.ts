import { buildPhraseDeck } from '../phrase/build';
import { FANTASY } from './fantasy';
import { GAKKOU } from './gakkou';
import { HANASHIKATA } from './hanashikata';
import { OYAKUSOKU } from './oyakusoku';
import { REACTION } from './reaction';
import { RENAI } from './renai';
import { TATAKAI } from './tatakai';
import { TOMODACHI } from './tomodachi';
import { YOBIKATA } from './yobikata';

/**
 * สายการ์ตูน / ซีรีส์ — สำนวนที่ได้ยินบ่อยและวิธีพูดแบบการ์ตูน 9 ช่วง (แผน: docs/anime-plan.md)
 * - วลีหลักเป็นแบบกันเอง (แบบที่ตัวละครพูด) · มีแบบสุภาพคู่กัน (polite) · คำหยาบ/ภาษาการ์ตูนมีคำเตือน (caution)
 * - วลีที่ห้ามพูดจริง (คำด่า · คำห้วน) เป็นชนิด "ได้ยิน" = ฟังให้เข้าใจพอ
 * - ข้อเรียงประโยคเป็นข้อเพิ่มในแบบฝึก (arrangeExtra): เรียงวลี (arrange) หรือเรียงแบบสุภาพ (arrangePolite) วลีละอย่างเดียว
 * - ฮารุโตะเรียกตัวเองว่า 僕 (ผม) ส่วนเคนตะและเร็นใช้ 俺 (ฉัน) — คำแทนตัวบอกนิสัยตัวละคร อย่าใช้ปนกันในฉาก
 * - ทุกบทมีฉากตัวอย่าง · ตัวละครและประโยคทั้งหมดแต่งขึ้นเอง ไม่ได้ยกมาจากการ์ตูนเรื่องใด
 * - วลี ฉาก และคำแปลเขียนโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ (อยู่ในตารางตรวจเนื้อหา)
 *
 * เปิดช่วงตามลำดับเสมอ (เลขสถานีของบทเดิมจะได้ไม่เปลี่ยน) · id ของวลีและบทห้ามเปลี่ยน
 */
export const ANIME_DECK = buildPhraseDeck(
  { id: 'anime', progressKey: 'anime', name: 'การ์ตูน', letter: 'A', dialogueLabel: 'ฉากตัวอย่าง', arrangeExtra: true },
  [
    REACTION,
    YOBIKATA,
    HANASHIKATA,
    GAKKOU,
    TOMODACHI,
    TATAKAI,
    RENAI,
    FANTASY,
    OYAKUSOKU,
  ],
);
