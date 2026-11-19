import { buildDeck as buildLineDeck, lesson as lineLesson, segment as lineSegment, type LessonInput, type SegmentInput } from '../line/build';
import type { KanjiDeck, KanjiEntry, KanjiExtraExample, ReadingKind } from './types';

/**
 * ตัวช่วยเขียนข้อมูลคันจิให้สั้น:
 *
 *   k('日', 4, 'วัน / ดวงอาทิตย์', [['にち', 'on', ['mainichi']], ['ひ・び', 'kun', ['getsuyoubi']]], { special: ['kyou'] })
 *
 * readings = [คำอ่าน (ฮิรางานะ), อง/คุง, id คำศัพท์ N5 ที่ใช้คำอ่านนี้]
 */
export function k(
  char: string,
  strokes: number,
  thai: string,
  readings: readonly (readonly [string, ReadingKind, readonly string[]])[],
  opts: { special?: readonly string[]; extra?: readonly KanjiExtraExample[]; note?: string } = {},
): KanjiEntry {
  return {
    id: char,
    char,
    strokes,
    thai,
    readings: readings.map(([kana, kind, words]) => ({ kana, kind, words })),
    ...(opts.special?.length ? { special: opts.special } : {}),
    ...(opts.extra?.length ? { extra: opts.extra } : {}),
    ...(opts.note ? { note: opts.note } : {}),
  };
}

export const lesson = (id: string, name: string, title: string, items: readonly KanjiEntry[]): LessonInput<KanjiEntry> =>
  lineLesson(id, name, title, items);

export const segment = (
  id: string,
  name: string,
  title: string,
  lessons: readonly LessonInput<KanjiEntry>[] = [],
): SegmentInput<KanjiEntry> => lineSegment(id, name, title, lessons);

export const buildDeck = (
  meta: Pick<KanjiDeck, 'id' | 'progressKey' | 'name' | 'letter'>,
  input: readonly SegmentInput<KanjiEntry>[],
): KanjiDeck => buildLineDeck(meta, input);
