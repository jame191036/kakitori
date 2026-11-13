import type { ScriptPack, StrokeSet } from '../types';
import { buildKana, kanaGroups } from './kanaShared';
import { KATAKANA_WORDS } from './katakanaWords';

// เรียงตาม KANA_SOUNDS (a i u e o, ka … , pa pi pu pe po)
const CHARS =
  'アイウエオ' + 'カキクケコ' + 'サシスセソ' + 'タチツテト' + 'ナニヌネノ' +
  'ハヒフヘホ' + 'マミムメモ' + 'ヤユヨ' + 'ラリルレロ' + 'ワヲ' + 'ン' +
  'ガギグゲゴ' + 'ザジズゼゾ' + 'ダヂヅデド' + 'バビブベボ' + 'パピプペポ';

const chars = buildKana(CHARS, {
  a: { similar: 'マヤフ' },
  i: { similar: 'トノ' },
  u: { similar: 'ワラフ' },
  e: { similar: 'ユコニ', note: 'หน้าตาคล้ายคันจิ 工' },
  o: { similar: 'ホキ' },
  ka: { similar: 'ヤナ', note: 'หน้าตาคล้ายคันจิ 力 (แรง)' },
  ki: { similar: 'チオモ' },
  ku: { similar: 'ケタワ' },
  ke: { similar: 'クタ' },
  ko: { similar: 'ユロエ' },
  sa: { similar: 'セナキ' },
  shi: {
    similar: 'ツミン',
    note: 'สองขีดแรกเรียงอยู่ทางซ้าย และขีดยาวลากจากล่างขึ้นบน — ต่างจาก ツ ที่สองขีดแรกอยู่ด้านบนและขีดยาวลากจากบนลงล่าง',
  },
  su: { similar: 'ヌラフ' },
  se: { similar: 'サヒヤ' },
  so: {
    similar: 'ンリツ',
    note: 'ขีดแรกค่อนไปทางแนวตั้ง และขีดยาวลากจากบนลงล่าง — ต่างจาก ン ที่ขีดแรกค่อนไปทางแนวนอนและขีดยาวลากจากล่างขึ้นบน',
  },
  ta: { similar: 'クケヌ', note: 'หน้าตาคล้ายคันจิ 夕 (เย็น)' },
  chi: { similar: 'テキ' },
  tsu: {
    similar: 'シソン',
    note: 'สองขีดแรกอยู่ด้านบน และขีดยาวลากจากบนลงล่าง — ต่างจาก シ · ออกเสียงคล้าย "ทสึ"',
  },
  te: { similar: 'チラ' },
  to: { similar: 'イ' },
  na: { similar: 'メチサ' },
  ni: { similar: 'コエミ', note: 'หน้าตาคล้ายคันจิ 二 (สอง)' },
  nu: { similar: 'スメネ' },
  ne: { similar: 'ホヌ' },
  no: { similar: 'メソ' },
  ha: { similar: 'ルソ', note: 'หน้าตาคล้ายคันจิ 八 (แปด)' },
  hi: { similar: 'セレ' },
  fu: { similar: 'ラウヲ', note: 'เสียงอยู่ระหว่าง "ฟุ" กับ "ฮุ" — เป่าลมผ่านริมฝีปากเบาๆ' },
  he: { similar: 'クフ', note: 'หน้าตาเกือบเหมือน へ ของฮิรางานะ' },
  ho: { similar: 'オネキ' },
  ma: { similar: 'アムヤ' },
  mi: { similar: 'シニツ' },
  mu: { similar: 'マア' },
  me: { similar: 'ナノヌ' },
  mo: { similar: 'キセ' },
  ya: { similar: 'セマカ' },
  yu: { similar: 'コヨエ' },
  yo: { similar: 'ユコヲ' },
  ra: {
    similar: 'フウテ',
    note: 'เสียง r ของญี่ปุ่นอยู่ระหว่าง "ร" กับ "ล" (ลิ้นแตะเพดานเบาๆ ครั้งเดียว)',
  },
  ri: { similar: 'ソルン' },
  ru: { similar: 'レハリ' },
  re: { similar: 'ルヒ' },
  ro: { similar: 'コユ', note: 'หน้าตาคล้ายคันจิ 口 (ปาก) แต่เขียนเล็กกว่า' },
  wa: { similar: 'ウクフ' },
  wo: { similar: 'ヨフラ', note: 'ออกเสียงเหมือน オ (o) ใช้น้อยมากในคาตาคานะ' },
  n: {
    similar: 'ソシツ',
    note: 'ขีดแรกค่อนไปทางแนวนอน และขีดยาวลากจากล่างขึ้นบน — ต่างจาก ソ · เป็นเสียงตัวสะกด ไม่ใช้ขึ้นต้นคำ',
  },
  za: { note: 'เสียง z — คล้าย "ซ" แต่มีเสียงสั่นในลำคอ' },
  di: { note: 'ออกเสียงเหมือน ジ (ji) พบได้น้อยมาก' },
  du: { note: 'ออกเสียงเหมือน ズ (zu) พบได้น้อยมาก' },
}, KATAKANA_WORDS);

export const katakana: ScriptPack = {
  id: 'katakana',
  name: 'คาตาคานะ',
  nameJa: 'カタカナ',
  nameEn: 'Katakana',
  description:
    'ตัวอักษรชุดที่สองของภาษาญี่ปุ่น ใช้เขียนคำทับศัพท์ ชื่อต่างชาติ และคำเลียนเสียง — มีเสียงเหมือนฮิรางานะทุกตัว แต่เส้นตรงและเป็นมุมมากกว่า',
  counterpart: 'hiragana',
  groups: kanaGroups('アカサタナハマヤラワンガザダバパ'),
  chars,
  loadStrokes: () =>
    import('../strokes/katakana.json').then((m) => m.default as unknown as StrokeSet),
};
