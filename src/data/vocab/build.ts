import { kanaToRomaji } from './romaji';
import type { VocabDeck, VocabLesson, VocabSegment, VocabWord, WordKind } from './types';

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

export interface LessonInput {
  id: string;
  name: string;
  title: string;
  words: readonly VocabWord[];
}

export interface SegmentInput {
  id: string;
  name: string;
  title: string;
  lessons: readonly LessonInput[];
}

export function lesson(id: string, name: string, title: string, words: readonly VocabWord[]): LessonInput {
  return { id, name, title, words };
}

/** ช่วงที่ยังไม่เปิด: ใส่ lessons ว่าง */
export function segment(id: string, name: string, title: string, lessons: readonly LessonInput[] = []): SegmentInput {
  return { id, name, title, lessons };
}

/** รวมช่วง → ชุดคำ (ตรวจ id ซ้ำตอนโหลด เพื่อไม่ให้ความคืบหน้าปนกัน) */
export function buildDeck(meta: Pick<VocabDeck, 'id' | 'progressKey' | 'name' | 'letter'>, input: readonly SegmentInput[]): VocabDeck {
  const words: Record<string, VocabWord> = {};
  const lessonIds = new Set<string>();
  const segments: VocabSegment[] = input.map((s) => ({
    id: s.id,
    name: s.name,
    title: s.title,
    lessons: s.lessons.map((l): VocabLesson => {
      if (lessonIds.has(l.id)) throw new Error(`บทซ้ำ: ${l.id}`);
      lessonIds.add(l.id);
      for (const word of l.words) {
        if (words[word.id]) throw new Error(`คำซ้ำ: ${word.id}`);
        words[word.id] = word;
      }
      return { id: l.id, name: l.name, title: l.title, words: l.words.map((x) => x.id) };
    }),
  }));
  if (new Set(segments.map((s) => s.id)).size !== segments.length) throw new Error('ช่วงซ้ำ');
  return { ...meta, segments, lessons: segments.flatMap((s) => s.lessons), words };
}
