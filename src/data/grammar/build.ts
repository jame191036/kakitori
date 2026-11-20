import { buildDeck as buildLineDeck, lesson as lineLesson, segment as lineSegment, type LessonInput, type SegmentInput } from '../line/build';
import { parseInline, parseSentence, plainOf } from './sentence';
import type { GrammarDeck, GrammarPoint } from './types';

/** ประโยคตัวอย่าง: [markup ภาษาญี่ปุ่น, คำแปลไทย, ตัวเลือก] */
export type ExampleInput = readonly [
  ja: string,
  thai: string,
  opts?: {
    /** ตัวเลือกผิดเฉพาะประโยคนี้ (แทนของทั้งข้อ) */
    wrong?: readonly string[];
    /** ใช้ทำข้อเรียงประโยค — ใส่เฉพาะประโยคที่เรียงได้แบบเดียว */
    arrange?: boolean;
  },
];

/**
 * ตัวช่วยเขียนรูปไวยากรณ์ให้สั้น:
 *
 *   g('wa-desu', 'A は B です', 'A เป็น / คือ B', ['คำอธิบาย…'],
 *     [['わたし[は] {学生|がくせい} です。', 'ฉันเป็นนักเรียน', { arrange: true }]],
 *     ['を', 'に', 'で'])
 *
 * wrong = ตัวเลือกผิดของข้อเติมคำ (ตัวที่ตรงกับคำตอบจะถูกตัดออกเอง)
 */
export function g(
  id: string,
  pattern: string,
  title: string,
  explain: readonly string[],
  examples: readonly ExampleInput[],
  wrong: readonly string[],
  note?: string,
): GrammarPoint {
  return {
    id,
    pattern,
    title,
    explain,
    ...(note ? { note } : {}),
    examples: examples.map(([ja, thai, opts = {}]) => {
      const sentence = parseSentence(ja);
      return {
        sentence,
        thai,
        wrong: (opts.wrong ?? wrong).filter((w) => plainOf(parseInline(w)) !== sentence.target),
        arrange: opts.arrange ?? false,
      };
    }),
  };
}

export const lesson = (id: string, name: string, title: string, items: readonly GrammarPoint[]): LessonInput<GrammarPoint> =>
  lineLesson(id, name, title, items);

export const segment = (
  id: string,
  name: string,
  title: string,
  lessons: readonly LessonInput<GrammarPoint>[] = [],
): SegmentInput<GrammarPoint> => lineSegment(id, name, title, lessons);

export const buildDeck = (
  meta: Pick<GrammarDeck, 'id' | 'progressKey' | 'name' | 'letter'>,
  input: readonly SegmentInput<GrammarPoint>[],
): GrammarDeck => buildLineDeck(meta, input);
