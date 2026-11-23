import { KANJI_N5, KANJI_N5_ALL } from '../kanji/n5';
import { N5_DECK } from '../vocab/n5';

/**
 * ตัวช่วยของเทส (ไม่ได้ใช้ในเว็บ): ตรวจว่าคันจิในประโยคเป็นคันจิ N5 และคำอ่านตรงกับคลังคำศัพท์/คันจิ
 * ใช้ร่วมกันระหว่างประโยคในสายไวยากรณ์และข้อสอบจำลอง
 */

/** คำอ่านที่ไม่ได้มาจากคลังคำศัพท์/คันจิโดยตรง (ผู้พัฒนายืนยันเอง — เพิ่มทีละคำ พร้อมเหตุผล) */
export const EXTRA_READINGS: Record<string, readonly string[]> = {
  日本: ['にほん'], // ชื่อประเทศ ไม่อยู่ในรายการคำศัพท์ N5
  日本語: ['にほんご'],
  何: ['なん'], // なに → なん เมื่อตามด้วย です / の / ลักษณนาม
  人: ['にん'], // ลักษณนามนับคน (さんにん)
  分: ['ふん', 'ぷん'], // นับนาที
  来: ['き', 'こ'], // くる เป็นคำกริยากลุ่ม 3: 来ます/来て = き · 来ない = こ
};

export const HAN = /\p{Script=Han}/u;

export const isN5Kanji = (ch: string) => KANJI_N5_ALL.includes(ch);

const kanjiForms = (char: string) =>
  (KANJI_N5.words[char]?.readings ?? []).flatMap((r) => r.kana.split('・').map((f) => f.replace(/\(.*\)/, '')));

/** คำอ่านของชิ้นข้อความ {漢字|かな} ถูกต้องตามคลังคำศัพท์ / คันจิ / รายการยกเว้น */
export function readingOk({ text, ruby }: { text: string; ruby?: string }): boolean {
  if (!ruby) return true;
  if (EXTRA_READINGS[text]?.includes(ruby)) return true;
  if ([...text].length === 1 && kanjiForms(text).includes(ruby)) return true;
  return Object.values(N5_DECK.words).some((w) => (w.kanji ?? '').includes(text) && w.kana.includes(ruby));
}

/** ปัญหาของชิ้นข้อความ: คันจินอก N5 · คันจิไม่มีคำอ่าน · คำอ่านไม่ตรง ('' = ไม่มีปัญหา) */
export function kanjiProblem(seg: { text: string; ruby?: string }): string {
  const chars = [...seg.text].filter((c) => HAN.test(c));
  const outside = chars.filter((c) => !isN5Kanji(c));
  if (outside.length) return `${outside.join('')} ไม่ใช่คันจิ N5`;
  if (chars.length && !seg.ruby) return `${seg.text} ไม่มีคำอ่าน`;
  if (!readingOk(seg)) return `${seg.text} อ่าน ${seg.ruby} ไม่ตรงกับคลังคำ`;
  return '';
}
