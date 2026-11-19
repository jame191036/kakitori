import { buildDeck } from '../build';
import { ACTIONS } from './actions';
import { DESCRIBE } from './describe';
import { NATURE } from './nature';
import { NUMBERS } from './numbers';
import { PEOPLE } from './people';
import { PLACES } from './places';
import { TIME } from './time';

/**
 * คันจิ JLPT N5 — 103 ตัว ตามระดับ JLPT แบบเดิม (ระดับ 4) ใน KANJIDIC2 แบ่งเป็นช่วงตามหัวข้อ
 *
 * ที่มา
 * - รายการคันจิ จำนวนขีด คำอ่าน (อง/คุง): KANJIDIC2 (EDRDG, CC BY-SA 4.0)
 *   (ตั้งแต่ปี 2010 ไม่มีรายการคันจิ N5 อย่างเป็นทางการ — รายการนี้เป็นแบบที่ใช้กันทั่วไป)
 * - ลำดับขีด: KanjiVG (CC BY-SA 3.0) → src/data/strokes/kanji-n5.json
 * - แสดงเฉพาะคำอ่านที่ใช้ในคำศัพท์ N5 ของเว็บ พร้อมคำตัวอย่างจากคลังคำศัพท์ (ผู้ใช้เลือกแล้ว)
 * - ความหมายภาษาไทยและหมายเหตุ: เขียนโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ
 *
 * เปิดช่วงใหม่ต่อท้ายเสมอ (เลขสถานีของบทเดิมจะได้ไม่เปลี่ยน) · id ของคันจิ (= ตัวคันจิ) และบทห้ามเปลี่ยน
 */
export const KANJI_N5 = buildDeck({ id: 'kanji-n5', progressKey: 'kanji-n5', name: 'คันจิ N5', letter: 'KJ' }, [
  NUMBERS,
  TIME,
  PEOPLE,
  NATURE,
  DESCRIBE,
  ACTIONS,
  PLACES,
]);

/** คันจิทั้ง 103 ตัวของ N5 (ตามลำดับช่วง) — ใช้ตรวจว่าเปิดครบ และใช้ทำฟอนต์ชุดย่อย */
export const KANJI_N5_ALL =
  '一二三四五六七八九十百千万円日月火水木金土年時分半午今前後毎週間先人子女男父母友名口目耳手足山川雨天気空花魚上下中外右左東西南北大小高安新古長白多少行来出入食飲見聞読書話言買休会立学校生国語本店駅道電車社何';
