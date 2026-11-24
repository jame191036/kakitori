import { buildPhraseDeck } from '../phrase/build';
import { DENWA } from './denwa';
import { JIKOSHOUKAI } from './jikoshoukai';
import { KIMOCHI } from './kimochi';
import { MANAA } from './manaa';
import { SASOU } from './sasou';
import { SHIGOTO } from './shigoto';
import { SUMAI } from './sumai';
import { TETSUZUKI } from './tetsuzuki';
import { ZATSUDAN } from './zatsudan';

/**
 * สายชีวิตประจำวัน — วลีคุยกับคนญี่ปุ่นและใช้ชีวิตในญี่ปุ่น 9 ช่วง (แผน: docs/daily-plan.md)
 * - ภาษาสุภาพ (です/ます) เป็นหลัก · วลีที่ใช้กับเพื่อนบ่อยมีแบบกันเองคู่กัน (casual)
 * - ทุกบทมีบทสนทนาตัวอย่าง (dialogLesson) · โครงข้อมูลและหน้าเรียนใช้ร่วมกับสายท่องเที่ยว (src/data/phrase)
 * - วลี บทสนทนา และคำแปลเขียนโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ (อยู่ในตารางตรวจเนื้อหา)
 *
 * เปิดช่วงตามลำดับเสมอ (เลขสถานีของบทเดิมจะได้ไม่เปลี่ยน) · id ของวลีและบทห้ามเปลี่ยน
 */
export const DAILY_DECK = buildPhraseDeck({ id: 'daily', progressKey: 'daily', name: 'ชีวิตประจำวัน', letter: 'D' }, [
  MANAA,
  JIKOSHOUKAI,
  SASOU,
  ZATSUDAN,
  SHIGOTO,
  DENWA,
  SUMAI,
  TETSUZUKI,
  KIMOCHI,
]);
