import { N5_DECK } from './n5';
import type { VocabDeck, VocabLesson, VocabSegment, VocabWord, WordKind } from './types';

export type { VocabDeck, VocabLesson, VocabSegment, VocabWord, WordKind } from './types';

export const vocabDecks: readonly VocabDeck[] = [N5_DECK];

export function getDeck(id: string | undefined): VocabDeck | undefined {
  return vocabDecks.find((d) => d.id === id);
}

export function getLesson(deck: VocabDeck, id: string | undefined): VocabLesson | undefined {
  return deck.lessons.find((l) => l.id === id);
}

export function lessonWords(deck: VocabDeck, lesson: VocabLesson): VocabWord[] {
  return lesson.words.map((id) => deck.words[id]!);
}

/** เลขสถานีของบท เช่น N03 (นับต่อเนื่องข้ามช่วง) */
export function lessonCode(deck: VocabDeck, lesson: VocabLesson): string {
  return `${deck.letter}${String(deck.lessons.indexOf(lesson) + 1).padStart(2, '0')}`;
}

/** ช่วงที่บทนี้อยู่ */
export function segmentOf(deck: VocabDeck, lesson: VocabLesson): VocabSegment | undefined {
  return deck.segments.find((s) => s.lessons.includes(lesson));
}

/** ช่วงที่เปิดแล้ว (มีบทเรียน) */
export const openSegments = (deck: VocabDeck): VocabSegment[] => deck.segments.filter((s) => s.lessons.length > 0);

export const WORD_KIND_LABEL: Record<WordKind, string> = {
  expr: 'วลี / คำทักทาย',
  num: 'ตัวเลข',
  noun: 'คำนาม',
  pron: 'สรรพนาม',
  q: 'คำถาม',
  verb: 'คำกริยา',
  'adj-i': 'คำคุณศัพท์ (い)',
  'adj-na': 'คำคุณศัพท์ (な)',
  adv: 'คำวิเศษณ์',
  conj: 'คำเชื่อม',
};

/** ตัวคานะทีละตัวของคำ (ตัวเล็ก ゃ っ และ ー นับเป็น 1 ตัว) — ใช้เรียงตัวอักษรและฝึกเขียน */
export const kanaOf = (word: VocabWord): string[] => [...word.kana];
