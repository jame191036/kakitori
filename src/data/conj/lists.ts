import type { Form } from './types';

/**
 * รายการที่คัดด้วยมือ (id ของคำในสายคำศัพท์ N5) — อยู่ในตารางตรวจเนื้อหาให้ผู้รู้ภาษาญี่ปุ่นดูด้วย
 */

/** คำหลอก: ลงท้ายเสียง i/e + る เหมือนกลุ่ม 2 แต่เป็นกลุ่ม 1 (เทียบกับพจนานุกรม JMdict แล้ว) */
export const TRICKY_GROUP1: readonly string[] = ['kaeru', 'hairu', 'hashiru', 'shiru', 'kiru-cut', 'iru-need'];

/**
 * คำที่ตั้งใจทำไม่ได้ (เช่น ฝนตก เข้าใจ หาย) — ไม่ออกข้อในรูปที่ชวน อยาก ต้อง ไม่ต้อง หรือขออย่า (WILL_FORMS)
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

export const WILL_FORMS: readonly Form[] = ['masenka', 'mashou', 'tai', 'nakereba', 'nakutemo', 'naide'];

/** ตั้งใจทำไม่ได้ แต่ขออย่าทำได้ตามปกติ: わすれないで ください · なくさないで ください */
export const CAN_NAIDE: readonly string[] = ['wasureru', 'nakusu'];

/**
 * รูปที่แทบไม่ได้ใช้ของคำนั้น — ไม่เอามาออกข้อ
 * - いる "ต้องการ" ในรูป て・た ซ้ำกับ いく ด้วย
 * - いい + かったです สอนในบทของ いい แล้ว (よかった) ไม่ต้องมีการ์ดแยก
 */
export const SKIP_FORMS: Readonly<Record<string, readonly Form[]>> = {
  'iru-need': ['te', 'ta'],
  ii: ['kattadesu'],
};

/** คุณศัพท์ な ที่ไม่เอามาออกข้อ: おなじ ไม่เติม な หน้าคำนาม · いろいろ/けっこう ไม่ใช้ในรูปปฏิเสธและอดีตตามปกติ */
export const NA_LEFT_OUT: readonly string[] = ['onaji', 'iroiro', 'kekkou'];

/** คุณศัพท์ な ที่ลงท้าย い (หน้าตาเหมือนคุณศัพท์ い) */
export const NA_LOOKS_I: readonly string[] = ['kirei', 'kirai', 'yuumei'];
