import type { VerbForm } from './types';

/**
 * รายการที่คัดด้วยมือ (id ของคำในสายคำศัพท์ N5) — อยู่ในตารางตรวจเนื้อหาให้ผู้รู้ภาษาญี่ปุ่นดูด้วย
 */

/** คำหลอก: ลงท้ายเสียง i/e + る เหมือนกลุ่ม 2 แต่เป็นกลุ่ม 1 (เทียบกับพจนานุกรม JMdict แล้ว) */
export const TRICKY_GROUP1: readonly string[] = ['kaeru', 'hairu', 'hashiru', 'shiru', 'kiru-cut', 'iru-need'];

/**
 * คำที่ปกติไม่ใช้กับ ませんか · ましょう · たい (ไม่ใช่เรื่องที่ตั้งใจทำหรือชวนกันทำได้ เช่น ฝนตก เข้าใจ หาย)
 * คัดโดยผู้พัฒนา ยังไม่ได้ให้ผู้รู้ภาษาญี่ปุ่นตรวจ — บางคำ (เช่น しりたい "อยากรู้") ใช้ได้จริง แต่ตัดออกให้ง่าย
 */
export const NOT_VOLITIONAL: readonly string[] = [
  'aru',
  'iru-need',
  'naru',
  'wakaru',
  'dekiru',
  'shiru',
  'wasureru',
  'nakusu',
  'komaru',
  'tsukareru',
  'umareru',
  'shinu',
  'furu',
  'hareru',
  'kumoru',
  'fuku-blow',
  'saku',
  'naku',
  'aku',
  'shimaru',
  'kieru',
  'hajimaru',
  'owaru',
  'tomaru',
  'tsuku',
  'kakaru',
  'chigau',
];

/** รูปที่แทบไม่ได้ใช้ของคำนั้น — ไม่เอามาออกข้อ (いる "ต้องการ" ในรูป て・た ซ้ำกับ いく ด้วย) */
export const SKIP_FORMS: Readonly<Record<string, readonly VerbForm[]>> = {
  'iru-need': ['te', 'ta'],
};
