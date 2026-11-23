import { buildDeck, segment } from './build';
import { HOTERU } from './hoteru';
import { KAIMONO } from './kaimono';
import { KIHON } from './kihon';
import { MICHI } from './michi';
import { NORIMONO } from './norimono';
import { RESTAURANT } from './restaurant';
import type { TravelPhrase } from './types';

/**
 * สายท่องเที่ยว — วลีตามสถานการณ์ 10 ช่วง (แผน: docs/travel-plan.md)
 * - ประโยคที่พูด (say) และประโยคที่จะได้ยินจากพนักงาน/ประกาศ (hear)
 * - คานะตัวใหญ่ + แบบเขียนจริงตัวเล็ก + โรมาจิ (โรมาจิสร้างจากคานะอัตโนมัติ — src/data/travel/build.ts)
 * - วลีและคำแปลเขียนโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ (อยู่ในตารางตรวจเนื้อหา)
 *
 * เปิดช่วงตามลำดับเสมอ (เลขสถานีของบทเดิมจะได้ไม่เปลี่ยน) · id ของวลีและบทห้ามเปลี่ยน
 */
export const TRAVEL_DECK = buildDeck<TravelPhrase>({ id: 'travel', progressKey: 'travel', name: 'ท่องเที่ยว', letter: 'T' }, [
  KIHON,
  NORIMONO,
  RESTAURANT,
  KAIMONO,
  MICHI,
  HOTERU,
  segment('kuukou', 'くうこう', 'สนามบิน ตรวจคนเข้าเมือง'),
  segment('kankou', 'かんこう', 'เที่ยวชม'),
  segment('komatta', 'こまったとき', 'เหตุฉุกเฉิน'),
  segment('hyouji', 'ひょうじ', 'ป้ายที่เห็นบ่อย'),
]);
