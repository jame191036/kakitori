/**
 * คู่คำที่ต่างกันแค่ตัวควบ / っ / เสียงยาว — ใช้ในบทเรียน "ตัวเล็กและเสียงยาว" (หน้า /start)
 * และแบบฝึก "ฟังแล้วเลือกคำที่ได้ยิน"
 *
 * ⚠️ เนื้อหาภาษาญี่ปุ่น — ควรให้ผู้รู้ภาษาญี่ปุ่นตรวจ (หน้า /start ไม่อยู่ในตาราง docs/content-review)
 * โรมาจิสะกดตามตัวคานะแบบเดียวกับทั้งเว็บ (おう = ou, ー = สระซ้ำ)
 */

export interface PairWord {
  kana: string;
  /** รูปคันจิที่ใช้กันทั่วไป (ถ้าปกติเขียนด้วยคันจิ) */
  kanji?: string;
  romaji: string;
  meaning: string;
}

export type PairKind = 'yoon' | 'sokuon' | 'long';

export interface MinimalPair {
  kind: PairKind;
  /** คำที่ "ไม่มี" ตัวควบ/っ/เสียงยาว */
  plain: PairWord;
  /** คำที่ "มี" ตัวควบ/っ/เสียงยาว */
  marked: PairWord;
}

const w = (kana: string, romaji: string, meaning: string, kanji?: string): PairWord =>
  kanji ? { kana, kanji, romaji, meaning } : { kana, romaji, meaning };

export const MINIMAL_PAIRS: readonly MinimalPair[] = [
  // ตัวควบ: อ่านรวบ 1 พยางค์ vs ตัวใหญ่อ่านแยก
  {
    kind: 'yoon',
    plain: w('びよういん', 'biyouin', 'ร้านเสริมสวย', '美容院'),
    marked: w('びょういん', 'byouin', 'โรงพยาบาล', '病院'),
  },
  // っ: หยุดค้างสั้นๆ แล้วพยัญชนะตัวถัดไปซ้ำ
  { kind: 'sokuon', plain: w('おと', 'oto', 'เสียง', '音'), marked: w('おっと', 'otto', 'สามี', '夫') },
  { kind: 'sokuon', plain: w('さか', 'saka', 'ทางลาด / เนิน', '坂'), marked: w('さっか', 'sakka', 'นักเขียน', '作家') },
  { kind: 'sokuon', plain: w('かこ', 'kako', 'อดีต', '過去'), marked: w('かっこ', 'kakko', 'วงเล็บ', '括弧') },
  // เสียงยาว: ฮิรางานะเขียนสระซ้ำ / คาตาคานะใช้ ー
  {
    kind: 'long',
    plain: w('おばさん', 'obasan', 'ป้า / น้าผู้หญิง (หญิงวัยกลางคน)'),
    marked: w('おばあさん', 'obaasan', 'ย่า / ยาย (หญิงสูงอายุ)'),
  },
  {
    kind: 'long',
    plain: w('おじさん', 'ojisan', 'ลุง / น้าผู้ชาย (ชายวัยกลางคน)'),
    marked: w('おじいさん', 'ojiisan', 'ปู่ / ตา (ชายสูงอายุ)'),
  },
  { kind: 'long', plain: w('ゆき', 'yuki', 'หิมะ', '雪'), marked: w('ゆうき', 'yuuki', 'ความกล้า', '勇気') },
  { kind: 'long', plain: w('とり', 'tori', 'นก', '鳥'), marked: w('とおり', 'toori', 'ถนน', '通り') },
  { kind: 'long', plain: w('ビル', 'biru', 'ตึก (building)'), marked: w('ビール', 'biiru', 'เบียร์ (beer)') },
];

export const pairsOf = (kind: PairKind) => MINIMAL_PAIRS.filter((p) => p.kind === kind);
