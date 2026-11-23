import { buildDeck } from './build';
import { HOTERU } from './hoteru';
import { HYOUJI } from './hyouji';
import { KAIMONO } from './kaimono';
import { KANKOU } from './kankou';
import { KIHON } from './kihon';
import { KOMATTA } from './komatta';
import { KUUKOU } from './kuukou';
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
  KUUKOU,
  KANKOU,
  KOMATTA,
  HYOUJI,
]);
