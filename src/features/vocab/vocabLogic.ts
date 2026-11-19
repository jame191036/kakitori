import { vocabPath } from '../../app/paths';
import { kanaOf, lessonCode, lessonWords, type VocabDeck, type VocabLesson, type VocabWord } from '../../data/vocab';
import type { ProgressData, ScriptProgress } from '../progress/progressLogic';
import type { RouteStop, StationState } from '../progress/stations';

/**
 * บทคำศัพท์ = สถานี: "ผ่าน" เมื่อทุกคำในบทเคยตอบถูกในแบบทดสอบอย่างน้อย 1 ครั้ง
 * (ความคืบหน้ารายคำเก็บใน ProgressData.scripts[deck.progressKey][word.id] — โครงเดียวกับตัวอักษร
 *  จึงติดไปกับไฟล์สำรองและรวมข้อมูลข้ามเครื่องได้ด้วย lastSeen)
 */

export function deckProgress(deck: VocabDeck, data: ProgressData): ScriptProgress | undefined {
  return data.scripts[deck.progressKey];
}

export function wordPassed(word: VocabWord, progress: ScriptProgress | undefined): boolean {
  return (progress?.[word.id]?.correct ?? 0) > 0;
}

export function lessonPassed(deck: VocabDeck, lesson: VocabLesson, progress: ScriptProgress | undefined): boolean {
  return lesson.words.every((id) => wordPassed(deck.words[id]!, progress));
}

/** สถานะของทุกบท: ผ่านแล้ว / บทถัดไป (บทแรกที่ยังไม่ผ่าน) / ยังไม่ถึง */
export function lessonStates(deck: VocabDeck, progress: ScriptProgress | undefined): StationState[] {
  const passed = deck.lessons.map((l) => lessonPassed(deck, l, progress));
  const next = passed.indexOf(false);
  return passed.map((p, i) => (p ? 'done' : i === next ? 'current' : 'todo'));
}

export function nextLesson(deck: VocabDeck, progress: ScriptProgress | undefined): VocabLesson | null {
  return deck.lessons.find((l) => !lessonPassed(deck, l, progress)) ?? null;
}

/** จำนวนคำที่เคยตอบถูกแล้ว */
export function wordsPassed(deck: VocabDeck, progress: ScriptProgress | undefined): number {
  return Object.values(deck.words).filter((w) => wordPassed(w, progress)).length;
}

/** บทเรียนเป็นจุดจอดบนแผนที่สาย (กดเพื่อเข้าบท) */
export function lessonStops(deck: VocabDeck): RouteStop[] {
  return deck.lessons.map((l) => {
    const code = lessonCode(deck, l);
    return { code, name: l.name, reading: l.title, label: `${code} ${l.title}`, href: vocabPath(l.id) };
  });
}

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

type Rng = () => number;

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** ตัวหลอก 3 คำ: ใช้คำในบทเดียวกันก่อน (หมวดเดียวกัน ยากกว่า) ไม่ให้ความหมายซ้ำกับคำตอบ */
function choicesFor(word: VocabWord, deck: VocabDeck, lesson: VocabLesson, rng: Rng): VocabWord[] {
  const pool = [
    ...shuffle(lessonWords(deck, lesson), rng),
    ...shuffle(Object.values(deck.words), rng),
  ].filter((w, i, arr) => w.id !== word.id && w.thai !== word.thai && arr.findIndex((x) => x.id === w.id) === i);
  return shuffle([word, ...pool.slice(0, 3)], rng);
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

/** เรียงได้ถ้าไม่ยาวเกินไป · เขียนได้ถ้าสั้น (เขียนทีละตัวบนกระดาน) */
export const canArrange = (w: VocabWord) => kanaOf(w).length >= 2 && kanaOf(w).length <= 6;
export const canWrite = (w: VocabWord) => kanaOf(w).length <= 4;

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
