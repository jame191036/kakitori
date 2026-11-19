import { N5_DECK } from './n5';
import type { VocabDeck, VocabWord, WordKind } from './types';

export type { VocabDeck, VocabLesson, VocabSegment, VocabWord, WordKind } from './types';
// บท/ช่วง/เลขสถานี ใช้ร่วมกับคันจิ
export { getLesson, lessonCode, lessonWords, openSegments, segmentOf } from '../line';

export const vocabDecks: readonly VocabDeck[] = [N5_DECK];

export function getDeck(id: string | undefined): VocabDeck | undefined {
  return vocabDecks.find((d) => d.id === id);
}

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
  prenoun: 'คำขยายนาม',
  prt: 'คำช่วย',
};

/** ตัวคานะทีละตัวของคำ (ตัวเล็ก ゃ っ และ ー นับเป็น 1 ตัว) — ใช้เรียงตัวอักษรและฝึกเขียน */
export const kanaOf = (word: VocabWord): string[] => [...word.kana];
