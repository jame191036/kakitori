/**
 * URL ของเว็บ — สร้างผ่านฟังก์ชันในไฟล์นี้เสมอ (ไม่เขียน path เองในแต่ละหน้า)
 *
 * โครงเมนู (หน้าศูนย์รวมทีละชั้น):
 *   /                         หน้าแรก — เลือกหมวด (ตัวอักษร · ท่องเที่ยว · ชีวิตประจำวัน · การ์ตูน · N5)
 *   /kana                     หมวดตัวอักษร — เลือกฮิรางานะ/คาตาคานะ + บทเรียน
 *   /kana/:script             ชุดตัวอักษร — เมนูย่อย + ตาราง
 *   /kana/:script/practice/…  คัดตัวอักษร · /quiz แบบทดสอบ · /review ทบทวน · /worksheet พิมพ์แบบฝึก
 *   /review                   ทบทวน (รวมทุกชุด)
 *   /n5                       หมวด JLPT N5 — สายคำศัพท์ (คันจิ/ไวยากรณ์ภายหลัง)
 *   /n5/vocab                 สายคำศัพท์ N5 — แผนที่บท + ตรา
 *   /n5/vocab/:lesson         บทเรียน: เรียน → ฝึก → ทดสอบ
 *   /n5/vocab/review          ทบทวนคำศัพท์ (คำที่ถึงรอบ · คำที่ผิดบ่อย) — ?start=due เริ่มทบทวนทันที
 * URL เดิม (/hiragana/…) ส่งต่อมาที่ /kana/hiragana/… ให้อัตโนมัติ
 */

export const KANA_ROOT = '/kana';
export const REVIEW_ROOT = '/review';
export const N5_ROOT = '/n5';

/** สายคำศัพท์ N5 / บทเรียน เช่น vocabPath('family') → /n5/vocab/family */
export function vocabPath(lessonId?: string): string {
  return `${N5_ROOT}/vocab${lessonId ? `/${lessonId}` : ''}`;
}

/** หน้าทบทวนคำศัพท์ N5 — start = เริ่มทบทวนชุดนั้นทันที (ใช้จากการ์ด "วันนี้") */
export function vocabReviewPath(start?: 'due' | 'weak'): string {
  return `${vocabPath()}/review${start ? `?start=${start}` : ''}`;
}

/** หน้าในชุดตัวอักษร เช่น scriptPath('hiragana', 'practice/ka') → /kana/hiragana/practice/ka */
export function scriptPath(scriptId: string, rest = ''): string {
  return `${KANA_ROOT}/${scriptId}${rest ? `/${rest}` : ''}`;
}
