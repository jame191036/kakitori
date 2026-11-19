import { kanaOf, lessonWords, type VocabDeck, type VocabLesson, type VocabWord } from '../../data/vocab';
import { LOANWORD_SMALL_KANA } from '../../data/vocab/romaji';
import { shuffle, type Rng } from '../../lib/shuffle';
import { lessonOfWord, REVIEW_BATCH_SIZE } from '../line/lineLogic';

/**
 * คำถามของสายคำศัพท์ — ตรรกะสถานี ตรา และรอบทบทวนอยู่ที่ features/line/lineLogic.ts
 * (ส่งต่อจากไฟล์นี้ด้วย เพื่อให้หน้าคำศัพท์ import จากที่เดียวได้)
 */
export * from '../line/lineLogic';

/** ทบทวนรอบละไม่เกินกี่คำ (เท่ากับตัวอักษร) */
export const VOCAB_REVIEW_BATCH = REVIEW_BATCH_SIZE;

// ───────────── คำถาม ─────────────

export type VocabQType =
  /** ดูความหมาย → เลือกคำ */
  | 'meaningToWord'
  /** ดูคำ → เลือกความหมาย */
  | 'wordToMeaning'
  /** ฟังเสียง → เลือกความหมาย */
  | 'audioToMeaning'
  /** เรียงตัวคานะให้เป็นคำ */
  | 'arrange'
  /** เขียนคำด้วยมือทีละตัว */
  | 'write';

export interface VocabQuestion {
  id: string;
  type: VocabQType;
  word: VocabWord;
  /** ตัวเลือก (รวมคำตอบ) สำหรับข้อแบบเลือก */
  choices: VocabWord[];
  /** ตัวคานะที่สลับลำดับแล้ว (รวมตัวหลอก) สำหรับข้อเรียงตัวอักษร */
  tiles: string[];
}

/** ความหมายย่อย: ตัดส่วนขยายในวงเล็บออก แล้วแยกตาม " / " เช่น "พี่ชาย (ของเรา)" → ["พี่ชาย"] */
export function meaningKeys(thai: string): string[] {
  return thai
    .replace(/\([^)]*\)/g, '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * ความหมายซ้อนกันไหม (กันคำความหมายใกล้กันมาเป็นตัวหลอก เช่น あに กับ おにいさん) — ใช้กับคันจิด้วย
 * ซ้อน = ความหมายย่อยตรงกัน หรือตัวหนึ่งเป็นส่วนต้นของอีกตัว ("ปากกา" กับ "ปากกาลูกลื่น", "ร้าน" กับ "ร้านอาหาร")
 */
export function meaningsOverlap(a: { thai: string }, b: { thai: string }): boolean {
  const keysA = meaningKeys(a.thai);
  return meaningKeys(b.thai).some((kb) => keysA.some((ka) => ka.startsWith(kb) || kb.startsWith(ka)));
}

/**
 * ตัวหลอก 3 ตัว: ใช้รายการในบทเดียวกันก่อน (หมวดเดียวกัน ยากกว่า) ไม่ให้ความหมายซ้อนกับคำตอบ
 * และตัวหลอกด้วยกันเองก็ต้องไม่ซ้อนความหมาย ไม่งั้นข้อ "ดู → เลือกความหมาย" จะมีตัวเลือกคล้ายกัน 2 ตัว
 */
export function pickDistractors<T extends { id: string; thai: string }>(
  answer: T,
  sameLesson: readonly T[],
  all: readonly T[],
  rng: Rng,
): T[] {
  const pool = [...shuffle(sameLesson, rng), ...shuffle(all, rng)].filter(
    (w, i, arr) => w.id !== answer.id && !meaningsOverlap(w, answer) && arr.findIndex((x) => x.id === w.id) === i,
  );
  const picked: T[] = [];
  for (const w of pool) {
    if (picked.length === 3) break;
    if (!picked.some((p) => meaningsOverlap(p, w))) picked.push(w);
  }
  return picked;
}

function choicesFor(word: VocabWord, deck: VocabDeck, lesson: VocabLesson, rng: Rng): VocabWord[] {
  return shuffle([word, ...pickDistractors(word, lessonWords(deck, lesson), Object.values(deck.words), rng)], rng);
}

const isKatakana = (ch: string) => ch >= '゠' && ch <= 'ヿ';

/** ตัวคานะของคำ + ตัวหลอก 2 ตัว (ชนิดอักษรเดียวกัน เอามาจากคำอื่นในชุด) */
function tilesFor(word: VocabWord, deck: VocabDeck, rng: Rng): string[] {
  const own = kanaOf(word);
  const kata = own.some(isKatakana);
  const others = [
    ...new Set(
      Object.values(deck.words)
        .flatMap(kanaOf)
        .filter((ch) => isKatakana(ch) === kata && !own.includes(ch)),
    ),
  ];
  return shuffle([...own, ...shuffle(others, rng).slice(0, 2)], rng);
}

/**
 * เรียงได้ถ้าไม่ยาวเกินไป · เขียนได้ถ้าสั้น (เขียนทีละตัวบนกระดาน)
 * และไม่มีตัวเล็กของคำทับศัพท์ (ォ ฯลฯ) ซึ่งยังไม่มีข้อมูลลำดับขีด
 */
export const canArrange = (w: VocabWord) => kanaOf(w).length >= 2 && kanaOf(w).length <= 6;
export const canWrite = (w: VocabWord) =>
  kanaOf(w).length <= 4 && !kanaOf(w).some((ch) => LOANWORD_SMALL_KANA.includes(ch));

function make(type: VocabQType, word: VocabWord, deck: VocabDeck, lesson: VocabLesson, rng: Rng): VocabQuestion {
  return {
    id: `${type}:${word.id}`,
    type,
    word,
    choices: type === 'arrange' || type === 'write' ? [] : choicesFor(word, deck, lesson, rng),
    tiles: type === 'arrange' ? tilesFor(word, deck, rng) : [],
  };
}

/**
 * แบบฝึก: คำละ 1 ข้อ วนรูปแบบให้ได้ครบทุกแบบ (เขียน / เรียง / ดูความหมาย / ฟัง)
 * ข้อที่รูปแบบใช้กับคำนั้นไม่ได้ (เช่นคำยาวเกินจะเขียน) จะใช้แบบถัดไปแทน
 */
export function practiceQuestions(
  deck: VocabDeck,
  lesson: VocabLesson,
  { audio, rng = Math.random }: { audio: boolean; rng?: Rng },
): VocabQuestion[] {
  const cycle: VocabQType[] = ['meaningToWord', 'write', audio ? 'audioToMeaning' : 'wordToMeaning', 'arrange'];
  const words = shuffle(lessonWords(deck, lesson), rng);
  return words.map((word, i) => {
    for (let k = 0; k < cycle.length; k++) {
      const type = cycle[(i + k) % cycle.length]!;
      if (type === 'write' && !canWrite(word)) continue;
      if (type === 'arrange' && !canArrange(word)) continue;
      return make(type, word, deck, lesson, rng);
    }
    return make('meaningToWord', word, deck, lesson, rng);
  });
}

/** แบบทดสอบทบทวน: คำจากหลายบท คำละ 1 ข้อแบบเลือกคำตอบ (ผลบันทึกและเลื่อนกล่องทบทวนเหมือนแบบทดสอบในบท) */
export function reviewQuestions(
  deck: VocabDeck,
  words: readonly VocabWord[],
  { audio, rng = Math.random }: { audio: boolean; rng?: Rng },
): VocabQuestion[] {
  const cycle: VocabQType[] = ['meaningToWord', 'wordToMeaning', ...(audio ? (['audioToMeaning'] as const) : [])];
  return shuffle(words, rng).flatMap((word, i) => {
    const lesson = lessonOfWord(deck, word.id);
    return lesson ? [make(cycle[i % cycle.length]!, word, deck, lesson, rng)] : [];
  });
}

/** แบบทดสอบ: คำละ 1 ข้อแบบเลือกคำตอบ (ผลบันทึกเป็นความคืบหน้า — ถูกครบทุกคำ = ผ่านสถานี) */
export function testQuestions(
  deck: VocabDeck,
  lesson: VocabLesson,
  { audio, rng = Math.random, only }: { audio: boolean; rng?: Rng; only?: readonly string[] },
): VocabQuestion[] {
  const cycle: VocabQType[] = ['meaningToWord', 'wordToMeaning', ...(audio ? (['audioToMeaning'] as const) : [])];
  const words = shuffle(
    lessonWords(deck, lesson).filter((w) => !only || only.includes(w.id)),
    rng,
  );
  return words.map((word, i) => make(cycle[i % cycle.length]!, word, deck, lesson, rng));
}
