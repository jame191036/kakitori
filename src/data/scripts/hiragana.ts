import type { ScriptPack, StrokeSet } from '../types';
import { HIRAGANA_WORDS } from './hiraganaWords';
import { buildKana, kanaGroups } from './kanaShared';

// เรียงตาม KANA_SOUNDS (a i u e o, ka … , pa pi pu pe po)
const CHARS =
  'あいうえお' + 'かきくけこ' + 'さしすせそ' + 'たちつてと' + 'なにぬねの' +
  'はひふへほ' + 'まみむめも' + 'やゆよ' + 'らりるれろ' + 'わを' + 'ん' +
  'がぎぐげご' + 'ざじずぜぞ' + 'だぢづでど' + 'ばびぶべぼ' + 'ぱぴぷぺぽ';

const chars = buildKana(CHARS, {
  a: { similar: 'おめぬ' },
  i: { similar: 'りこ' },
  u: { similar: 'つらろ' },
  e: { similar: 'んるろ' },
  o: { similar: 'あむす' },
  ka: { similar: 'やわ' },
  ki: {
    similar: 'さちま',
    note: 'แบบตัวพิมพ์บางฟอนต์ขีดล่างจะต่อกัน แต่เวลาเขียนด้วยมือนิยมแยกเป็น 4 ขีด',
  },
  ku: { similar: 'へし' },
  ke: { similar: 'はほに' },
  ko: { similar: 'にい' },
  sa: {
    similar: 'ちき',
    note: 'แบบตัวพิมพ์บางฟอนต์ขีดล่างจะต่อกัน แต่เวลาเขียนด้วยมือนิยมแยกเป็น 3 ขีด',
  },
  shi: { similar: 'つく' },
  su: { similar: 'むお' },
  se: { similar: 'さけや' },
  so: { similar: 'てろ' },
  ta: { similar: 'なに' },
  chi: { similar: 'さら' },
  tsu: { similar: 'うし', note: 'ออกเสียงคล้าย "ทสึ" หรือ "สึ" โดยแตะปลายลิ้นที่ฟันบนก่อน' },
  te: { similar: 'そつ' },
  to: { similar: 'くし' },
  na: { similar: 'たは' },
  ni: { similar: 'こたけ' },
  nu: { similar: 'めねあ' },
  ne: { similar: 'れわぬ' },
  no: { similar: 'めあ' },
  ha: { similar: 'ほけ', note: 'เมื่อใช้เป็นคำช่วย (เช่น わたしは) จะอ่านว่า "wa" (วะ)' },
  hi: { similar: 'いし' },
  fu: {
    similar: 'う',
    note: 'เสียงอยู่ระหว่าง "ฟุ" กับ "ฮุ" — เป่าลมผ่านริมฝีปากเบาๆ ไม่ใช้ฟันแตะปาก',
  },
  he: { similar: 'く', note: 'เมื่อใช้เป็นคำช่วยบอกทิศทาง จะอ่านว่า "e" (เอะ)' },
  ho: { similar: 'はま' },
  ma: { similar: 'ほもよ' },
  mi: { similar: 'むめ' },
  mu: { similar: 'すおみ' },
  me: { similar: 'ぬあの' },
  mo: { similar: 'しま' },
  ya: { similar: 'かせ' },
  yu: { similar: 'よの' },
  yo: { similar: 'まゆ' },
  ra: {
    similar: 'うち',
    note: 'เสียง r ของญี่ปุ่นอยู่ระหว่าง "ร" กับ "ล" (ลิ้นแตะเพดานเบาๆ ครั้งเดียว)',
  },
  ri: { similar: 'いに' },
  ru: { similar: 'ろれ' },
  re: { similar: 'わねる' },
  ro: { similar: 'るら' },
  wa: { similar: 'れね' },
  wo: { similar: 'おも', note: 'ออกเสียงเหมือน お (o) ใช้เป็นคำช่วยบอกกรรมเท่านั้น' },
  n: {
    similar: 'えそ',
    note: 'เป็นเสียงตัวสะกด ไม่ใช้ขึ้นต้นคำ ออกเสียงเป็น น/ง/ม ตามเสียงที่ตามมา',
  },
  za: { note: 'เสียง z — คล้าย "ซ" แต่มีเสียงสั่นในลำคอ' },
  di: { note: 'ออกเสียงเหมือน じ (ji) พบได้ไม่บ่อย' },
  du: { note: 'ออกเสียงเหมือน ず (zu) พบได้ไม่บ่อย' },
}, HIRAGANA_WORDS);

export const hiragana: ScriptPack = {
  id: 'hiragana',
  name: 'ฮิรางานะ',
  nameJa: 'ひらがな',
  nameEn: 'Hiragana',
  description:
    'ตัวอักษรพื้นฐานของภาษาญี่ปุ่น ใช้เขียนคำญี่ปุ่นแท้ คำช่วย และส่วนท้ายของคำกริยา — เป็นชุดแรกที่ควรเรียน',
  counterpart: 'katakana',
  groups: kanaGroups('あかさたなはまやらわんがざだばぱ'),
  chars,
  loadStrokes: () =>
    import('../strokes/hiragana.json').then((m) => m.default as unknown as StrokeSet),
};
