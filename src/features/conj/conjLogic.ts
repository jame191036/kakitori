import { conjugate, POLITE_END, tilesOf, wrongForms } from '../../data/conj/conjugate';
import { CONJ_N5 } from '../../data/conj/n5';
import type { ConjDeck, ConjRule, ConjVerb, VerbForm, VerbGroup } from '../../data/conj/types';
import { CONJ_VERBS, canUse, verbById } from '../../data/conj/verbs';
import { isTricky } from '../../data/conj/build';
import { lessonWords, type LineLesson } from '../../data/line';
import { shuffle, type Rng } from '../../lib/shuffle';

/**
 * คำถามของสายผันคำ (ตรรกะสถานี/ตรา/ทบทวนใช้ features/line/lineLogic.ts ร่วมกับสายอื่น)
 * - group: คำนี้กลุ่มไหน
 * - pick:  คำไหนอยู่กลุ่มที่ถาม
 * - form:  ดูคำ → เลือกรูปที่ผันถูก
 * - build: ดูคำ → เรียงคานะเป็นรูปที่ถาม
 * - back:  ดูรูปที่ผันแล้ว → เลือกรูปพจนานุกรม
 * ทุกข้อมีคำตอบเดียว: ตัวเลือกที่ผันแล้วเขียนเหมือนกัน (เช่น いって จาก いく และ いう) ไม่มาอยู่ข้อเดียวกัน
 */

export type ConjQType = 'group' | 'pick' | 'form' | 'build' | 'back';

export interface ConjChoice {
  key: string;
  /** ตัวเลือกที่เป็นคำกริยา (แสดงคานะ + คันจิ) */
  word?: ConjVerb;
}

export interface ConjQuestion {
  id: string;
  type: ConjQType;
  rule: ConjRule;
  word: ConjVerb;
  /** รูปที่ถาม (null = ข้อแยกกลุ่ม) */
  form: VerbForm | null;
  choices: ConjChoice[];
  /** key ของคำตอบ · build = คานะของรูปที่ถูก */
  answer: string;
  /** build: ชิ้นที่สลับแล้ว (มีตัวหลอกปน) */
  tiles: string[];
  /** build: จำนวนช่อง */
  slots: number;
}

const GROUPS: readonly VerbGroup[] = [1, 2, 3];

const unique = <T>(list: readonly T[], key: (x: T) => string): T[] =>
  list.filter((x, i) => list.findIndex((y) => key(y) === key(x)) === i);

// ───────────── ตัวเลือก ─────────────

function formChoices(v: ConjVerb, form: VerbForm, focus: ConjRule['focus'], rng: Rng): ConjChoice[] {
  const right = conjugate(v, form);
  const wrong = wrongForms(v, form);
  const stem = shuffle(wrong.stem, rng);
  const ending = shuffle(wrong.ending, rng);
  // ข้อที่สอนท้ายรูป: ท้ายผิด 2 ตัว + ตัวคำผิด 1 ตัว · ข้อที่สอนตัวคำ: ตัวคำผิดเป็นหลัก (รูป た มีท้ายผิดปน 1 ตัว)
  const first =
    focus === 'ending' ? [...ending.slice(0, 2), ...stem.slice(0, 1)] : form === 'ta' ? [...ending.slice(0, 1), ...stem] : stem;
  const picked = [...new Set([...first, ...stem, ...ending])].slice(0, 3);
  return shuffle([right, ...picked], rng).map((key) => ({ key }));
}

/** ชิ้นของข้อเรียง: ชิ้นที่ถูก + ตัวหลอก 3 ชิ้นจากรูปที่มักผันผิด */
function buildTiles(v: ConjVerb, form: VerbForm, rng: Rng): string[] {
  const own = tilesOf(v, form);
  const end = POLITE_END[form];
  const wrong = shuffle(wrongForms(v, form).stem, rng).map((w) => w.slice(v.prefix.length));
  const chars = end ? wrong.map((w) => w.slice(0, -end.length).at(-1) ?? '') : wrong.flatMap((w) => [...w]);
  const ends = end ? shuffle(Object.values(POLITE_END), rng).filter((e) => e !== end) : [];
  const extra = [...new Set(chars)].filter((c) => c && !own.includes(c));
  return shuffle([...own, ...(end ? [...extra.slice(0, 2), ends[0]!] : extra.slice(0, 3))], rng);
}

/** ตัวเลือกรูปพจนานุกรม: คำอื่นที่ขึ้นต้นเหมือนกันก่อน · ไม่ใช้คำที่เขียนเหมือนกัน หรือผันแล้วได้เหมือนกัน */
function backChoices(v: ConjVerb, form: VerbForm, rng: Rng): ConjChoice[] {
  const shown = conjugate(v, form);
  const pool = shuffle(
    CONJ_VERBS.filter((x) => !x.prefix && x.kana !== v.kana && conjugate(x, form) !== shown),
    rng,
  );
  const near = pool.filter((x) => x.kana[0] === v.kana[0]);
  const same = pool.filter((x) => x.kana.length === v.kana.length);
  const picked = unique([...near.slice(0, 2), ...same, ...pool], (x) => x.kana).slice(0, 3);
  return shuffle([v, ...picked], rng).map((word) => ({ key: word.id, word }));
}

/** "คำไหนเป็นกลุ่ม X": คำจากกลุ่มอื่นที่ลงท้าย る ก่อน (แยกยากกว่า) · ไม่ใช้คำหลอกและคำที่เขียนซ้ำกัน */
function pickChoices(v: ConjVerb, rng: Rng): ConjChoice[] {
  const pool = shuffle(
    CONJ_VERBS.filter(
      (x) =>
        x.group !== v.group &&
        !x.prefix &&
        !isTricky(x) &&
        x.kana !== v.kana &&
        !CONJ_VERBS.some((y) => y !== x && y.kana === x.kana && y.group !== x.group),
    ),
    rng,
  );
  const ru = pool.filter((x) => x.kana.endsWith('る'));
  const picked = unique([...ru, ...pool], (x) => x.kana).slice(0, 3);
  return shuffle([v, ...picked], rng).map((word) => ({ key: word.id, word }));
}

// ───────────── สร้างข้อ ─────────────

const canPick = (rule: ConjRule) => rule.form === null && rule.words.length >= 3;
/** คำนาม + する: ข้อย้อนกลับง่ายเกินไป (เห็นคำนามอยู่แล้ว) */
const canBack = (v: ConjVerb) => !v.prefix;

function make(type: ConjQType, rule: ConjRule, word: ConjVerb, rng: Rng, key = ''): ConjQuestion {
  const form = rule.form;
  // ใช้แบบที่ทำได้: กฎแยกกลุ่มถามกลุ่ม · กฎรูปผันถามรูป
  const t: ConjQType = !form
    ? type === 'pick' && canPick(rule)
      ? 'pick'
      : 'group'
    : type === 'build' || (type === 'back' && canBack(word))
      ? type
      : 'form';
  const q: ConjQuestion = {
    id: `${t}:${rule.id}:${word.id}:${key}`,
    type: t,
    rule,
    word,
    form,
    choices: [],
    answer: '',
    tiles: [],
    slots: 0,
  };
  if (t === 'group') {
    q.choices = GROUPS.map((g) => ({ key: String(g) }));
    q.answer = String(word.group);
  } else if (t === 'pick') {
    q.choices = pickChoices(word, rng);
    q.answer = word.id;
  } else if (form && t === 'form') {
    q.choices = formChoices(word, form, rule.focus, rng);
    q.answer = conjugate(word, form);
  } else if (form && t === 'back') {
    q.choices = backChoices(word, form, rng);
    q.answer = word.id;
  } else if (form) {
    q.tiles = buildTiles(word, form, rng);
    q.slots = tilesOf(word, form).length;
    q.answer = conjugate(word, form);
  }
  return q;
}

const practiceTypes = (rule: ConjRule): ConjQType[] =>
  rule.form ? ['form', 'build', 'back', 'form'] : canPick(rule) ? ['group', 'pick', 'group', 'pick'] : ['group', 'group'];

/** แบบฝึก: กฎละไม่เกิน 4 ข้อ คำไม่ซ้ำกันเท่าที่มี (กฎที่มีคำเดียวถามคนละแบบ) — ไม่นับเป็นผลสอบ */
export function practiceQuestions(deck: ConjDeck, lesson: LineLesson, rng: Rng = Math.random): ConjQuestion[] {
  return shuffle(
    lessonWords(deck, lesson).flatMap((rule) => {
      const words = shuffle(rule.words, rng);
      const qs = practiceTypes(rule).map((t, i) => make(t, rule, verbById(words[i % words.length]!), rng));
      return unique(qs, (q) => `${q.type}:${q.word.id}`);
    }),
    rng,
  );
}

/** ทบทวน: กฎละ 1 ข้อ คำที่สุ่มใหม่ทุกครั้ง สลับเลือกตอบกับเรียงคานะ */
function oneEach(rules: readonly ConjRule[], rng: Rng): ConjQuestion[] {
  return shuffle(rules, rng).map((rule, i) => {
    const word = verbById(rule.words[Math.floor(rng() * rule.words.length)]!);
    return make(rule.form ? (i % 2 ? 'build' : 'form') : i % 2 ? 'pick' : 'group', rule, word, rng);
  });
}

/** แบบทดสอบถามกฎละกี่ข้อ (ต้องถูกครบจึงนับว่าถูกกฎนั้น) */
export const TEST_PER_RULE = 2;

/** 2 ข้อของกฎในแบบทดสอบ: คนละแบบ คนละคำ (กฎที่มีคำเดียวถามคนละแบบ · คู่คำที่เขียนเหมือนกันถามครบทั้งสองคำ) */
function testPair(rule: ConjRule, rng: Rng): ConjQuestion[] {
  const words = shuffle(rule.words, rng).map(verbById);
  const types: ConjQType[] = rule.form ? ['form', 'build'] : canPick(rule) ? ['group', 'pick'] : ['group', 'group'];
  return types.map((t, i) => make(t, rule, words[i % words.length]!, rng));
}

/** แบบทดสอบ: กฎละ 2 ข้อ — ถูกทั้งสองข้อของทุกกฎ = ผ่านสถานี */
export function testQuestions(
  deck: ConjDeck,
  lesson: LineLesson,
  { rng = Math.random, only }: { rng?: Rng; only?: readonly string[] } = {},
): ConjQuestion[] {
  return shuffle(
    lessonWords(deck, lesson)
      .filter((r) => !only || only.includes(r.id))
      .flatMap((r) => testPair(r, rng)),
    rng,
  );
}

/** แบบทดสอบทบทวน: กฎจากหลายบท กฎละ 1 ข้อ */
export const reviewQuestions = (items: readonly ConjRule[], rng: Rng = Math.random): ConjQuestion[] => oneEach(items, rng);

// ───────────── ฝึกอิสระ ─────────────

/** 'group' = ข้อแยกกลุ่ม ที่เหลือ = รูปผัน */
export type FreeTopic = VerbForm | 'group';
export const FREE_TYPES = ['form', 'build', 'back'] as const;
export type FreeType = (typeof FREE_TYPES)[number];
export const FREE_COUNTS = [10, 20, 0] as const; // 0 = ไม่จำกัด

export interface FreePrefs {
  topics: FreeTopic[];
  groups: VerbGroup[];
  types: FreeType[];
  count: number;
}

/** กฎของคำนี้ในรูปนี้ (กฎรวมไม่นับ) — ทุกคำทุกรูปมีกฎเดียว */
export function ruleFor(word: ConjVerb, form: VerbForm | null): ConjRule | undefined {
  return Object.values(CONJ_N5.words).find((r) => !r.mixed && r.form === form && r.words.includes(word.id));
}

/** คำที่ใช้ในหัวข้อนี้ได้ ตามกลุ่มที่เลือก (ข้อแยกกลุ่มไม่กรองกลุ่ม ไม่งั้นเฉลยตัวเอง) */
export function topicWords(topic: FreeTopic, groups: readonly VerbGroup[]): ConjVerb[] {
  return CONJ_VERBS.filter((v) =>
    topic === 'group' ? !!ruleFor(v, null) : groups.includes(v.group) && canUse(v, topic),
  );
}

/** สร้างข้อฝึกอิสระ n ข้อ — สุ่มหัวข้อก่อนแล้วจึงสุ่มคำ ไม่ใช้คู่คำ+หัวข้อที่เพิ่งออก (recent) ถ้าเลี่ยงได้ */
export function freeQuestions(
  prefs: Pick<FreePrefs, 'topics' | 'groups' | 'types'>,
  n: number,
  { rng = Math.random, recent = [] }: { rng?: Rng; recent?: readonly string[] } = {},
): ConjQuestion[] {
  const pools = prefs.topics
    .map((topic) => ({ topic, words: topicWords(topic, prefs.groups) }))
    .filter((p) => p.words.length > 0);
  if (!pools.length || !prefs.types.length) return [];
  const used = [...recent];
  return Array.from({ length: n }, (_, i) => {
    let { topic, words } = pools[0]!;
    let word = words[0]!;
    for (let tries = 0; tries < 12; tries++) {
      ({ topic, words } = pools[Math.floor(rng() * pools.length)]!);
      word = words[Math.floor(rng() * words.length)]!;
      if (!used.slice(-30).includes(`${topic}:${word.id}`)) break;
    }
    used.push(`${topic}:${word.id}`);
    const form = topic === 'group' ? null : topic;
    const type = form ? prefs.types[Math.floor(rng() * prefs.types.length)]! : 'group';
    return make(type, ruleFor(word, form)!, word, rng, String(i));
  });
}

/** key ของข้อฝึกอิสระ (กันออกซ้ำ) */
export const freeKey = (q: ConjQuestion) => `${q.form ?? 'group'}:${q.word.id}`;

/** ฝึกซ้ำเฉพาะข้อที่ผิด: คำและหัวข้อเดิม สุ่มวิธีถามใหม่ */
export function retryQuestions(wrong: readonly ConjQuestion[], types: readonly FreeType[], rng: Rng = Math.random): ConjQuestion[] {
  return shuffle(unique(wrong, freeKey), rng).map((q, i) =>
    make(q.form ? types[Math.floor(rng() * types.length)]! : 'group', q.rule, q.word, rng, `r${i}`),
  );
}

/** ตัดค่าที่ไม่รู้จักออกจากค่าที่จำไว้ในเครื่อง (ค่าเก่า/ไฟล์สำรอง) */
export function cleanPrefs(raw: { topics: string[]; groups: number[]; types: string[]; count: number }, topics: readonly FreeTopic[]): FreePrefs {
  return {
    topics: topics.filter((t) => raw.topics.includes(t)),
    groups: GROUPS.filter((g) => raw.groups.includes(g)),
    types: FREE_TYPES.filter((t) => raw.types.includes(t)),
    count: FREE_COUNTS.some((c) => c === raw.count) ? raw.count : 10,
  };
}

/** หัวข้อที่เปิดสอนแล้ว: แยกกลุ่ม + ทุกรูปที่มีกฎในสาย ตามลำดับบท */
export const FREE_TOPICS: readonly FreeTopic[] = [
  'group',
  ...new Set(Object.values(CONJ_N5.words).flatMap((r) => (r.form ? [r.form] : []))),
];
