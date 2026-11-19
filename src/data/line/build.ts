import type { LineDeck, LineLesson, LineSegment } from './types';

/**
 * ตัวช่วยประกอบสายบทเรียน: รายการอยู่ในบท บทอยู่ในช่วง แล้ว buildDeck รวมเป็นชุด
 * (ใช้ทั้งคำศัพท์และคันจิ — ตรวจ id ซ้ำตอนโหลด เพื่อไม่ให้ความคืบหน้าปนกัน)
 */

export interface LessonInput<T extends { id: string }> {
  id: string;
  name: string;
  title: string;
  words: readonly T[];
}

export interface SegmentInput<T extends { id: string }> {
  id: string;
  name: string;
  title: string;
  lessons: readonly LessonInput<T>[];
}

export function lesson<T extends { id: string }>(
  id: string,
  name: string,
  title: string,
  words: readonly T[],
): LessonInput<T> {
  return { id, name, title, words };
}

/** ช่วงที่ยังไม่เปิด: ใส่ lessons ว่าง */
export function segment<T extends { id: string }>(
  id: string,
  name: string,
  title: string,
  lessons: readonly LessonInput<T>[] = [],
): SegmentInput<T> {
  return { id, name, title, lessons };
}

export function buildDeck<T extends { id: string }>(
  meta: Pick<LineDeck, 'id' | 'progressKey' | 'name' | 'letter'>,
  input: readonly SegmentInput<T>[],
): LineDeck<T> {
  const words: Record<string, T> = {};
  const lessonIds = new Set<string>();
  const segments: LineSegment[] = input.map((s) => ({
    id: s.id,
    name: s.name,
    title: s.title,
    lessons: s.lessons.map((l): LineLesson => {
      if (lessonIds.has(l.id)) throw new Error(`บทซ้ำ: ${l.id}`);
      lessonIds.add(l.id);
      for (const word of l.words) {
        if (words[word.id]) throw new Error(`รายการซ้ำ: ${word.id}`);
        words[word.id] = word;
      }
      return { id: l.id, name: l.name, title: l.title, words: l.words.map((x) => x.id) };
    }),
  }));
  if (new Set(segments.map((s) => s.id)).size !== segments.length) throw new Error('ช่วงซ้ำ');
  return { ...meta, segments, lessons: segments.flatMap((s) => s.lessons), words };
}
