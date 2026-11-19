import { buildDeck as buildLineDeck, lesson as lineLesson, segment as lineSegment, type LessonInput, type SegmentInput } from '../line/build';
import { kanaToRomaji } from './romaji';
import type { VocabDeck, VocabWord, WordKind } from './types';

/**
 * ตัวช่วยเขียนข้อมูลคำศัพท์ให้สั้น อ่านง่าย — คำอยู่ในบท บทอยู่ในช่วง แล้ว buildDeck รวมเป็นชุด
 *
 *   w('mizu', 'みず', '水', 'น้ำ (น้ำเปล่า)', 'noun', 'หมายเหตุ')
 *
 * kanji = '' ถ้าปกติเขียนด้วยคานะ · โรมาจิสร้างจากคานะให้เอง (ใส่ romaji เองเฉพาะวลีที่มี は/เว้นวรรค)
 */
export function w(
  id: string,
  kana: string,
  kanji: string,
  thai: string,
  kind: WordKind,
  note?: string,
  romaji?: string,
): VocabWord {
  return {
    id,
    kana,
    ...(kanji ? { kanji } : {}),
    romaji: romaji ?? kanaToRomaji(kana),
    thai,
    kind,
    ...(note ? { note } : {}),
  };
}

export const lesson = (id: string, name: string, title: string, words: readonly VocabWord[]): LessonInput<VocabWord> =>
  lineLesson(id, name, title, words);

/** ช่วงที่ยังไม่เปิด: ใส่ lessons ว่าง */
export const segment = (
  id: string,
  name: string,
  title: string,
  lessons: readonly LessonInput<VocabWord>[] = [],
): SegmentInput<VocabWord> => lineSegment(id, name, title, lessons);

export const buildDeck = (
  meta: Pick<VocabDeck, 'id' | 'progressKey' | 'name' | 'letter'>,
  input: readonly SegmentInput<VocabWord>[],
): VocabDeck => buildLineDeck(meta, input);
