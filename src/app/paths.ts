/**
 * URL ของเว็บ — สร้างผ่านฟังก์ชันในไฟล์นี้เสมอ (ไม่เขียน path เองในแต่ละหน้า)
 *
 * โครงเมนู (หน้าศูนย์รวมทีละชั้น):
 *   /                         หน้าแรก — เลือกหมวด (ตัวอักษร · ท่องเที่ยว · ชีวิตประจำวัน · การ์ตูน · N5)
 *   /kana                     หมวดตัวอักษร — เลือกฮิรางานะ/คาตาคานะ + บทเรียน
 *   /kana/:script             ชุดตัวอักษร — เมนูย่อย + ตาราง
 *   /kana/:script/practice/…  คัดตัวอักษร · /quiz แบบทดสอบ · /review ทบทวน · /worksheet พิมพ์แบบฝึก
 *   /review                   ทบทวน (รวมทุกชุด)
 *   /n5                       หมวด JLPT N5 — สายคำศัพท์ · สายคันจิ · สายไวยากรณ์
 *   /n5/vocab                 สายคำศัพท์ N5 — แผนที่บท + ตรา
 *   /n5/vocab/:lesson         บทเรียน: เรียน → ฝึก → ทดสอบ
 *   /n5/vocab/review          ทบทวนคำศัพท์ (คำที่ถึงรอบ · คำที่ผิดบ่อย) — ?start=due เริ่มทบทวนทันที
 *   /n5/kanji                 สายคันจิ N5 · /n5/kanji/:lesson บทเรียน: เรียน → ฝึกเขียน → ทดสอบ
 *   /n5/kanji/review          ทบทวนคันจิ (ตัวที่ถึงรอบ · ตัวที่ผิดบ่อย)
 *   /n5/grammar               สายไวยากรณ์ N5 · /n5/grammar/:lesson บทเรียน · /n5/grammar/review ทบทวน
 *   /n5/exam                  ข้อสอบจำลอง N5 — เลือกชุด + ประวัติผลสอบ
 *   /n5/exam/:set             ทำข้อสอบชุดนั้น · ?result=<id> ดูผลสอบครั้งนั้น
 * URL เดิม (/hiragana/…) ส่งต่อมาที่ /kana/hiragana/… ให้อัตโนมัติ
 */

export const KANA_ROOT = '/kana';
export const REVIEW_ROOT = '/review';
export const N5_ROOT = '/n5';

/** สายคำศัพท์ N5 / บทเรียน เช่น vocabPath('family') → /n5/vocab/family */
export function vocabPath(lessonId?: string): string {
  return `${N5_ROOT}/vocab${lessonId ? `/${lessonId}` : ''}`;
}

/** สายคันจิ N5 / บทเรียน เช่น kanjiPath('k-days') → /n5/kanji/k-days */
export function kanjiPath(lessonId?: string): string {
  return `${N5_ROOT}/kanji${lessonId ? `/${lessonId}` : ''}`;
}

/** หน้าทบทวนคำศัพท์ N5 — start = เริ่มทบทวนชุดนั้นทันที (ใช้จากการ์ด "วันนี้") */
export function vocabReviewPath(start?: 'due' | 'weak'): string {
  return `${vocabPath()}/review${start ? `?start=${start}` : ''}`;
}

/** หน้าทบทวนคันจิ N5 — start = เริ่มทบทวนชุดนั้นทันที (ใช้จากการ์ด "วันนี้") */
export function kanjiReviewPath(start?: 'due' | 'weak'): string {
  return `${kanjiPath()}/review${start ? `?start=${start}` : ''}`;
}

/** สายไวยากรณ์ N5 / บทเรียน เช่น grammarPath('g-desu') → /n5/grammar/g-desu */
export function grammarPath(lessonId?: string): string {
  return `${N5_ROOT}/grammar${lessonId ? `/${lessonId}` : ''}`;
}

/** หน้าทบทวนไวยากรณ์ N5 — start = เริ่มทบทวนชุดนั้นทันที (ใช้จากการ์ด "วันนี้") */
export function grammarReviewPath(start?: 'due' | 'weak'): string {
  return `${grammarPath()}/review${start ? `?start=${start}` : ''}`;
}

/** ข้อสอบจำลอง N5 / ชุด / ผลสอบ เช่น examPath('1', '1795…') → /n5/exam/1?result=1795… */
export function examPath(setId?: string, resultId?: string): string {
  return `${N5_ROOT}/exam${setId ? `/${setId}` : ''}${setId && resultId ? `?result=${resultId}` : ''}`;
}

/** หน้าในชุดตัวอักษร เช่น scriptPath('hiragana', 'practice/ka') → /kana/hiragana/practice/ka */
export function scriptPath(scriptId: string, rest = ''): string {
  return `${KANA_ROOT}/${scriptId}${rest ? `/${rest}` : ''}`;
}
