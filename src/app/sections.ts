import { KANA_ROOT, N5_ROOT } from './paths';

/**
 * หมวดหลักของเว็บ = "สายรถไฟ" บนหน้าแรก — หมวดที่ยังไม่มี to แสดงเป็น 工事中 (กำลังสร้าง กดไม่ได้)
 * glyph = ตัวอักษรในวงป้ายสาย: 旅 (ท่องเที่ยว) 日 (วัน/ชีวิตประจำวัน) 漫 (มังงะ)
 * tone = สีประจำสาย (ตัวแปร CSS --line-<tone> ใน global.css)
 */
export interface Section {
  id: string;
  name: string;
  /** บรรทัดรองใต้ชื่อ */
  desc: string;
  glyph: string;
  tone: 'kana' | 'travel' | 'daily' | 'anime' | 'n5';
  to?: string;
}

export const SECTIONS: readonly Section[] = [
  {
    id: 'kana',
    name: 'ตัวอักษร',
    desc: 'ฮิรางานะ · คาตาคานะ — อ่านและเขียนตัวอักษรพื้นฐาน เริ่มที่หมวดนี้ก่อน',
    glyph: 'あ',
    tone: 'kana',
    to: KANA_ROOT,
  },
  {
    id: 'travel',
    name: 'ใช้ท่องเที่ยว',
    desc: 'วลีตามสถานการณ์ สนามบิน โรงแรม ร้านอาหาร ซื้อของ',
    glyph: '旅',
    tone: 'travel',
  },
  { id: 'daily', name: 'ใช้ในชีวิตประจำวัน', desc: 'คำศัพท์และประโยคสุภาพที่ใช้บ่อย', glyph: '日', tone: 'daily' },
  { id: 'anime', name: 'ดูการ์ตูน / ซีรีส์', desc: 'ภาษาพูดแบบกันเอง และฝึกฟัง', glyph: '漫', tone: 'anime' },
  {
    id: 'jlpt-n5',
    name: 'สอบ JLPT N5',
    desc: 'คำศัพท์ · คันจิ (เปิดแล้ว) · ไวยากรณ์และข้อสอบจำลองตามมา',
    glyph: 'N5',
    tone: 'n5',
    to: N5_ROOT,
  },
];
