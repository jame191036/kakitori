import { scriptList } from '../scripts';

/**
 * แปลงคำคานะเป็นโรมาจิแบบ Hepburn ที่สะกดตามตัวคานะ (แบบเดียวกับทั้งเว็บ)
 * - おう = ou, えい = ei (ไม่ใช้ ō), ー = ซ้ำสระตัวก่อนหน้า (コーヒー = koohii)
 * - っ/ッ = ซ้อนพยัญชนะตัวถัดไป (っち = tchi), ん ก่อนสระหรือ y = n' (きんようび = kin'youbi)
 * - は/へ ที่เป็นคำช่วยแปลงไม่ได้อัตโนมัติ → ให้คำนั้นระบุโรมาจิเอง (เช่น こんにちは)
 * ใช้ตารางเสียงของชุดตัวอักษรที่เว็บสอน + ตัวผสมของคำทับศัพท์ (ティ フォ …)
 */
const TABLE = new Map<string, string>();
for (const pack of scriptList) {
  for (const c of pack.chars) if (c.group !== 'small') TABLE.set(c.char, c.romaji);
}

/** เสียงที่มีเฉพาะในคำทับศัพท์ (ใช้ ァィゥェォ ตัวเล็ก) — เว็บยังไม่ได้สอนเป็นตัวอักษร */
const LOANWORD_SOUNDS: Record<string, string> = {
  ティ: 'ti',
  ディ: 'di',
  ファ: 'fa',
  フィ: 'fi',
  フェ: 'fe',
  フォ: 'fo',
  ウィ: 'wi',
  ウェ: 'we',
  ウォ: 'wo',
  シェ: 'she',
  ジェ: 'je',
  チェ: 'che',
  トゥ: 'tu', // タトゥー (รอยสัก)
  ドゥ: 'du',
};
for (const [k, r] of Object.entries(LOANWORD_SOUNDS)) TABLE.set(k, r);

/** ตัวเล็กของคำทับศัพท์ที่ยังไม่มีข้อมูลลำดับขีด (ใช้ฝึกเขียนไม่ได้) */
export const LOANWORD_SMALL_KANA = 'ァィゥェォ';

export function kanaToRomaji(kana: string): string {
  const syllables: string[] = [];
  let double = false;
  for (let i = 0; i < kana.length; ) {
    const ch = kana[i]!;
    if (ch === 'っ' || ch === 'ッ') {
      double = true;
      i++;
      continue;
    }
    if (ch === 'ー') {
      const prev = syllables.at(-1);
      if (!prev) throw new Error(`ー ต้องตามหลังเสียงอื่น: ${kana}`);
      syllables.push(prev.at(-1)!);
      i++;
      continue;
    }
    const pair = kana.slice(i, i + 2);
    const len = pair.length === 2 && TABLE.has(pair) ? 2 : 1;
    const syl = TABLE.get(kana.slice(i, i + len));
    if (!syl) throw new Error(`แปลงโรมาจิไม่ได้: ${kana} (${kana.slice(i, i + len)})`);
    syllables.push(double ? (syl.startsWith('ch') ? 't' : syl[0]) + syl : syl);
    double = false;
    i += len;
  }
  if (double) throw new Error(`っ ต้องมีเสียงตามหลัง: ${kana}`);
  return syllables
    .map((s, i) => (s === 'n' && /^[aiueoy]/.test(syllables[i + 1] ?? '') ? "n'" : s))
    .join('');
}
