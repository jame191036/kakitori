import { N5_DECK } from '../vocab/n5';
import type { VocabWord } from '../vocab';
import { CAN_NAIDE, NA_LEFT_OUT, NOT_VOLITIONAL, SKIP_FORMS, TRICKY_GROUP1, WILL_FORMS } from './lists';
import type { ConjKind, ConjWord, Form, VerbGroup } from './types';

/**
 * คำที่ใช้ฝึกผัน = คำกริยาและคำคุณศัพท์ทุกคำในสายคำศัพท์ N5 + คำนาม + する
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

function skipOf(id: string): Form[] {
  const will = NOT_VOLITIONAL.includes(id) ? WILL_FORMS.filter((f) => f !== 'naide' || !CAN_NAIDE.includes(id)) : [];
  return [...will, ...(SKIP_FORMS[id] ?? [])];
}

const fromVocab = (w: VocabWord, kind: ConjKind): ConjWord => ({
  id: w.id,
  kind,
  prefix: '',
  kana: w.kana,
  ...(w.kanji ? { kanji: w.kanji } : {}),
  thai: w.thai,
  group: kind === 'verb' ? groupOf(w.id, w.kana) : null,
  skip: skipOf(w.id),
});

const vocab = Object.values(N5_DECK.words);

const suru: ConjWord[] = Object.entries(SURU_NOUNS).map(([id, thai]) => {
  const noun = N5_DECK.words[id];
  if (!noun) throw new Error(`ไม่มีคำนามนี้ในสายคำศัพท์: ${id}`);
  return {
    id: `${id}-suru`,
    kind: 'verb',
    prefix: noun.kana,
    kana: `${noun.kana}する`,
    ...(noun.kanji ? { kanji: `${noun.kanji}する` } : {}),
    thai,
    group: 3,
    skip: [],
  };
});

export const CONJ_VERBS: readonly ConjWord[] = [
  ...vocab.filter((w) => w.kind === 'verb').map((w) => fromVocab(w, 'verb')),
  ...suru,
];
export const CONJ_I: readonly ConjWord[] = vocab.filter((w) => w.kind === 'adj-i').map((w) => fromVocab(w, 'i'));
export const CONJ_NA: readonly ConjWord[] = vocab
  .filter((w) => w.kind === 'adj-na' && !NA_LEFT_OUT.includes(w.id))
  .map((w) => fromVocab(w, 'na'));
export const CONJ_WORDS: readonly ConjWord[] = [...CONJ_VERBS, ...CONJ_I, ...CONJ_NA];

const byId = new Map(CONJ_WORDS.map((v) => [v.id, v]));

export function wordById(id: string): ConjWord {
  const v = byId.get(id);
  if (!v) throw new Error(`ไม่มีคำนี้ในสายผันคำ: ${id}`);
  return v;
}

/** ตัวท้ายของรูปพจนานุกรม (กลุ่ม 1 ใช้เลือกกฎ) */
export const endingOf = (v: ConjWord) => v.kana.at(-1)!;
export const canUse = (v: ConjWord, form: Form) => !v.skip.includes(form);
