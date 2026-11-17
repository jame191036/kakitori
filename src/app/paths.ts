/**
 * URL ของเว็บ — สร้างผ่านฟังก์ชันในไฟล์นี้เสมอ (ไม่เขียน path เองในแต่ละหน้า)
 *
 * โครงเมนู (หน้าศูนย์รวมทีละชั้น):
 *   /                         หน้าแรก — เลือกหมวด (ตัวอักษร · ท่องเที่ยว · ชีวิตประจำวัน · การ์ตูน · N5)
 *   /kana                     หมวดตัวอักษร — เลือกฮิรางานะ/คาตาคานะ + บทเรียน
 *   /kana/:script             ชุดตัวอักษร — เมนูย่อย + ตาราง
 *   /kana/:script/practice/…  คัดตัวอักษร · /quiz แบบทดสอบ · /review ทบทวน · /worksheet พิมพ์แบบฝึก
 *   /review                   ทบทวน (รวมทุกชุด)
 * URL เดิม (/hiragana/…) ส่งต่อมาที่ /kana/hiragana/… ให้อัตโนมัติ
 */

export const KANA_ROOT = '/kana';
export const REVIEW_ROOT = '/review';

/** หน้าในชุดตัวอักษร เช่น scriptPath('hiragana', 'practice/ka') → /kana/hiragana/practice/ka */
export function scriptPath(scriptId: string, rest = ''): string {
  return `${KANA_ROOT}/${scriptId}${rest ? `/${rest}` : ''}`;
}
