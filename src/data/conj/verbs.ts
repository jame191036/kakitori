import { N5_DECK } from '../vocab/n5';
import { NOT_VOLITIONAL, SKIP_FORMS, TRICKY_GROUP1 } from './lists';
import type { ConjVerb, VerbForm, VerbGroup } from './types';

/**
 * คำกริยาที่ใช้ฝึกผัน = คำกริยาทุกคำในสายคำศัพท์ N5 + คำนาม + する
 * กลุ่มของคำกริยาคิดจากกฎ (ตัวท้าย る และเสียงหน้า る) แล้วแก้ด้วยรายการคำหลอก — มีเทสต์ตรวจทุกคำ
 */

/** คานะที่เสียงเป็น i หรือ e (ตัวหน้า る ของกลุ่ม 2) */
const I_E = new Set('いきしちにひみりぎじぢびぴえけせてねへめれげぜでべぺ');

/** する / くる — กลุ่ม 3 */
const GROUP3 = new Set(['suru', 'kuru']);

/** หน้าตาเหมือนกลุ่ม 2 (ลงท้ายเสียง i/e + る) */
export const looksLikeGroup2 = (kana: string) => kana.length >= 2 && kana.endsWith('る') && I_E.has(kana.at(-2)!);

function groupOf(id: string, kana: string): VerbGroup {
  if (GROUP3.has(id)) return 3;
  return looksLikeGroup2(kana) && !TRICKY_GROUP1.includes(id) ? 2 : 1;
}

/** คำนาม + する ที่สายคำศัพท์สอนไว้แล้ว: id ของคำนาม → ความหมายของคำกริยา */
export const SURU_NOUNS: Readonly<Record<string, string>> = {
  benkyou: 'เรียน / อ่านหนังสือ',
  renshuu: 'ฝึก / ซ้อม',
  shitsumon: 'ถาม (คำถาม)',
  ryouri: 'ทำอาหาร',
  sentaku: 'ซักผ้า',
  souji: 'ทำความสะอาด',
  kaimono: 'ซื้อของ',
  sanpo: 'เดินเล่น',
  ryokou: 'ไปเที่ยว / เดินทาง',
  kekkon: 'แต่งงาน',
  kopii: 'ถ่ายเอกสาร',
};

function skipOf(id: string): VerbForm[] {
  return [...(NOT_VOLITIONAL.includes(id) ? (['masenka', 'mashou', 'tai'] as const) : []), ...(SKIP_FORMS[id] ?? [])];
}

const own: ConjVerb[] = Object.values(N5_DECK.words)
  .filter((w) => w.kind === 'verb')
  .map((w) => ({
    id: w.id,
    prefix: '',
    kana: w.kana,
    ...(w.kanji ? { kanji: w.kanji } : {}),
    thai: w.thai,
    group: groupOf(w.id, w.kana),
    skip: skipOf(w.id),
  }));

const suru: ConjVerb[] = Object.entries(SURU_NOUNS).map(([id, thai]) => {
  const noun = N5_DECK.words[id];
  if (!noun) throw new Error(`ไม่มีคำนามนี้ในสายคำศัพท์: ${id}`);
  return {
    id: `${id}-suru`,
    prefix: noun.kana,
    kana: `${noun.kana}する`,
    ...(noun.kanji ? { kanji: `${noun.kanji}する` } : {}),
    thai,
    group: 3,
    skip: [],
  };
});

export const CONJ_VERBS: readonly ConjVerb[] = [...own, ...suru];

const byId = new Map(CONJ_VERBS.map((v) => [v.id, v]));

export function verbById(id: string): ConjVerb {
  const v = byId.get(id);
  if (!v) throw new Error(`ไม่มีคำกริยานี้: ${id}`);
  return v;
}

/** ตัวท้ายของรูปพจนานุกรม (กลุ่ม 1 ใช้เลือกกฎ) */
export const endingOf = (v: ConjVerb) => v.kana.at(-1)!;
export const canUse = (v: ConjVerb, form: VerbForm) => !v.skip.includes(form);
