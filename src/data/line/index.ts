import type { LineDeck, LineLesson, LineSegment } from './types';

export type { LineDeck, LineLesson, LineSegment } from './types';

export function getLesson(deck: LineDeck, id: string | undefined): LineLesson | undefined {
  return deck.lessons.find((l) => l.id === id);
}

export function lessonWords<T extends { id: string }>(deck: LineDeck<T>, lesson: LineLesson): T[] {
  return lesson.words.map((id) => deck.words[id]!);
}

/** เลขสถานีของบท เช่น N03 (นับต่อเนื่องข้ามช่วง) */
export function lessonCode(deck: LineDeck, lesson: LineLesson): string {
  return `${deck.letter}${String(deck.lessons.indexOf(lesson) + 1).padStart(2, '0')}`;
}

/** ช่วงที่บทนี้อยู่ */
export function segmentOf(deck: LineDeck, lesson: LineLesson): LineSegment | undefined {
  return deck.segments.find((s) => s.lessons.includes(lesson));
}

/** ช่วงที่เปิดแล้ว (มีบทเรียน) */
export const openSegments = (deck: LineDeck): LineSegment[] => deck.segments.filter((s) => s.lessons.length > 0);
