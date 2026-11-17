import { KANA_ROOT } from './paths';

/**
 * หมวดหลักของเว็บ (หน้าแรก) — หมวดที่ยังไม่มี to จะแสดงเป็น "เร็วๆ นี้" (กดไม่ได้)
 * glyph = ตัวอักษรประดับหน้าหมวด: 旅 (ท่องเที่ยว) 日 (วัน/ชีวิตประจำวัน) 漫 (มังงะ)
 */
export interface Section {
  id: string;
  name: string;
  /** บรรทัดรองใต้ชื่อ */
  desc: string;
  glyph: string;
  to?: string;
}

export const SECTIONS: readonly Section[] = [
  {
    id: 'kana',
    name: 'ตัวอักษร',
    desc: 'ฮิรางานะ · คาตาคานะ — อ่านและเขียนตัวอักษรพื้นฐาน เริ่มที่หมวดนี้ก่อน',
    glyph: 'あ',
    to: KANA_ROOT,
  },
  { id: 'travel', name: 'ใช้ท่องเที่ยว', desc: 'วลีตามสถานการณ์ สนามบิน โรงแรม ร้านอาหาร ซื้อของ', glyph: '旅' },
  { id: 'daily', name: 'ใช้ในชีวิตประจำวัน', desc: 'คำศัพท์และประโยคสุภาพที่ใช้บ่อย', glyph: '日' },
  { id: 'anime', name: 'ดูการ์ตูน / ซีรีส์', desc: 'ภาษาพูดแบบกันเอง และฝึกฟัง', glyph: '漫' },
  { id: 'jlpt-n5', name: 'สอบ JLPT N5', desc: 'คันจิ คำศัพท์ ไวยากรณ์ และข้อสอบจำลอง', glyph: 'N5' },
];
