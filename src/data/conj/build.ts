import { buildDeck as buildLineDeck, lesson as lineLesson, segment as lineSegment, type LessonInput, type SegmentInput } from '../line/build';
import { TRICKY_GROUP1 } from './lists';
import { FORM_INFO, type ConjDeck, type ConjRule, type ConjWord, type Form } from './types';
import { canUse, CONJ_WORDS, endingOf, wordById } from './words';

/** เลือกคำของกฎ: ส่งเงื่อนไข หรือรายการ id */
export type WordPick = readonly string[] | ((v: ConjWord) => boolean);

interface RuleOpts {
  note?: string;
  focus?: ConjRule['focus'];
  mixed?: boolean;
  reverse?: boolean;
}

/**
 * ตัวช่วยเขียนการ์ดกฎให้สั้น:
 *
 *   rule('te-mu', 'む → んで', 'ลงท้าย む: む → んで', ['คำอธิบาย…'], 'te', g1('む'), ['nomu', 'yomu', 'yasumu'])
 *
 * form = รูปที่สอน (null = กฎแยกกลุ่ม) · คำคนละชนิดและคำที่ไม่ใช้รูปนั้น (ConjWord.skip) ถูกตัดออกเอง
 */
export function rule(
  id: string,
  pattern: string,
  title: string,
  explain: readonly string[],
  form: Form | null,
  pick: WordPick,
  examples: readonly string[],
  { note, focus = 'stem', mixed, reverse }: RuleOpts = {},
): ConjRule {
  const kind = form ? FORM_INFO[form].kind : 'verb';
  const all = typeof pick === 'function' ? CONJ_WORDS.filter((v) => v.kind === kind && pick(v)) : pick.map(wordById);
  const words = all.filter((v) => !form || canUse(v, form)).map((v) => v.id);
  if (!words.length) throw new Error(`กฎไม่มีคำ: ${id}`);
  for (const x of examples) if (!words.includes(x)) throw new Error(`คำตัวอย่างไม่อยู่ในกฎ: ${id} / ${x}`);
  return {
    id,
    pattern,
    title,
    explain,
    ...(note ? { note } : {}),
    form,
    words,
    examples,
    focus,
    ...(mixed ? { mixed } : {}),
    ...(reverse ? { reverse } : {}),
  };
}

// ── เงื่อนไขที่ใช้บ่อย ──

export const isTricky = (v: ConjWord) => TRICKY_GROUP1.includes(v.id);

/** กลุ่ม 1 ที่ลงท้ายด้วยตัวในรายการ (ไม่รวมคำหลอก ซึ่งมีการ์ดของตัวเอง) */
export const g1 =
  (endings: string) =>
  (v: ConjWord): boolean =>
    v.group === 1 && endings.includes(endingOf(v)) && !isTricky(v);

export const g2 = (v: ConjWord) => v.group === 2;
export const isSuru = (v: ConjWord) => v.group === 3 && v.kana.endsWith('する');
export const every = () => true;

export const lesson = (id: string, name: string, title: string, items: readonly ConjRule[]): LessonInput<ConjRule> =>
  lineLesson(id, name, title, items);

export const segment = (
  id: string,
  name: string,
  title: string,
  lessons: readonly LessonInput<ConjRule>[] = [],
): SegmentInput<ConjRule> => lineSegment(id, name, title, lessons);

export const buildDeck = (
  meta: Pick<ConjDeck, 'id' | 'progressKey' | 'name' | 'letter'>,
  input: readonly SegmentInput<ConjRule>[],
): ConjDeck => buildLineDeck(meta, input);
