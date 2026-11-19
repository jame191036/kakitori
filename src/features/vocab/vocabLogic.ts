import { vocabPath } from '../../app/paths';
import {
  kanaOf,
  lessonCode,
  lessonWords,
  type VocabDeck,
  type VocabLesson,
  type VocabSegment,
  type VocabWord,
} from '../../data/vocab';
import { LOANWORD_SMALL_KANA } from '../../data/vocab/romaji';
import { dayNumber } from '../../lib/day';
import { dueDay, type CharStat, type ProgressData, type ScriptProgress } from '../progress/progressLogic';
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

/** บทเรียนเป็นจุดจอดบนแผนที่สาย (กดเพื่อเข้าบท) — ไม่ระบุ lessons = ทุกบทของชุด */
export function lessonStops(deck: VocabDeck, lessons: readonly VocabLesson[] = deck.lessons): RouteStop[] {
  return lessons.map((l) => {
    const code = lessonCode(deck, l);
    return { code, name: l.name, reading: l.title, label: `${code} ${l.title}`, href: vocabPath(l.id) };
  });
}

export interface SegmentSummary {
  segment: VocabSegment;
  /** สถานะของแต่ละบทในช่วง (ตามสถานะทั้งสาย: บทถัดไปมีได้บทเดียวทั้งสาย) */
  states: StationState[];
  passed: number;
  /** ช่วงที่มีบทถัดไปอยู่ */
  current: boolean;
  /** เลขสถานีแรก–สุดท้าย เช่น "N01–N07" (ช่วงที่ยังไม่เปิด = '') */
  range: string;
}

/** สรุปทุกช่วงของสาย (ใช้หน้าแผนที่สาย) */
export function segmentSummaries(deck: VocabDeck, progress: ScriptProgress | undefined): SegmentSummary[] {
  const all = lessonStates(deck, progress);
  return deck.segments.map((segment) => {
    const states = segment.lessons.map((l) => all[deck.lessons.indexOf(l)]!);
    const first = segment.lessons[0];
    const last = segment.lessons.at(-1);
    return {
      segment,
      states,
      passed: states.filter((s) => s === 'done').length,
      current: states.includes('current'),
      range: first && last ? `${lessonCode(deck, first)}–${lessonCode(deck, last)}` : '',
    };
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

/** ความหมายย่อยของคำ: ตัดส่วนขยายในวงเล็บออก แล้วแยกตาม " / " เช่น "พี่ชาย (ของเรา)" → ["พี่ชาย"] */
export function meaningKeys(thai: string): string[] {
  return thai
    .replace(/\([^)]*\)/g, '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * ความหมายซ้อนกันไหม (กันคำความหมายใกล้กันมาเป็นตัวหลอก เช่น あに กับ おにいさん)
 * ซ้อน = ความหมายย่อยตรงกัน หรือตัวหนึ่งเป็นส่วนต้นของอีกตัว ("ปากกา" กับ "ปากกาลูกลื่น", "ร้าน" กับ "ร้านอาหาร")
 */
export function meaningsOverlap(a: VocabWord, b: VocabWord): boolean {
  const keysA = meaningKeys(a.thai);
  return meaningKeys(b.thai).some((kb) => keysA.some((ka) => ka.startsWith(kb) || kb.startsWith(ka)));
}

/** ตัวหลอก 3 คำ: ใช้คำในบทเดียวกันก่อน (หมวดเดียวกัน ยากกว่า) ไม่ให้ความหมายซ้อนกับคำตอบ */
function choicesFor(word: VocabWord, deck: VocabDeck, lesson: VocabLesson, rng: Rng): VocabWord[] {
  const pool = [...shuffle(lessonWords(deck, lesson), rng), ...shuffle(Object.values(deck.words), rng)].filter(
    (w, i, arr) => w.id !== word.id && !meaningsOverlap(w, word) && arr.findIndex((x) => x.id === w.id) === i,
  );
  const picked: VocabWord[] = [];
  for (const w of pool) {
    if (picked.length === 3) break;
    // ตัวหลอกด้วยกันเองก็ต้องไม่ซ้อนความหมาย ไม่งั้นข้อ "ดูคำ → เลือกความหมาย" จะมีตัวเลือกคล้ายกัน 2 ตัว
    if (!picked.some((p) => meaningsOverlap(p, w))) picked.push(w);
  }
  return shuffle([word, ...picked], rng);
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

// ───────────── ทบทวน (ใช้กล่องทบทวนแบบเดียวกับตัวอักษร: progressLogic.dueDay) ─────────────

export interface WordStat {
  word: VocabWord;
  stat: CharStat;
}

export interface DueWord extends WordStat {
  /** เลยรอบมากี่วัน (0 = ถึงรอบวันนี้พอดี) */
  overdue: number;
}

/** คำที่ถึงรอบทบทวน เรียงจากกล่องต่ำ (น่าห่วง) และเลยรอบนานที่สุดก่อน */
export function dueWords(deck: VocabDeck, progress: ScriptProgress | undefined, now: number): DueWord[] {
  if (!progress) return [];
  const today = dayNumber(now);
  const out: DueWord[] = [];
  for (const word of Object.values(deck.words)) {
    const stat = progress[word.id];
    const due = dueDay(stat);
    if (stat && due !== null && due <= today) out.push({ word, stat, overdue: today - due });
  }
  return out.sort((a, b) => a.stat.box - b.stat.box || b.overdue - a.overdue);
}

/** คำที่ผิดบ่อย: เคยตอบผิดและยังไม่กลับมาแม่น (กล่อง ≤ 2) เรียงจากน่าห่วงที่สุด — เกณฑ์เดียวกับตัวอักษร */
export function weakWords(deck: VocabDeck, progress: ScriptProgress | undefined): WordStat[] {
  if (!progress) return [];
  const out: WordStat[] = [];
  for (const word of Object.values(deck.words)) {
    const stat = progress[word.id];
    if (stat && stat.wrong > 0 && stat.box <= 2) out.push({ word, stat });
  }
  return out.sort(
    (a, b) => a.stat.box - b.stat.box || b.stat.wrong - a.stat.wrong || (b.stat.lastWrong ?? 0) - (a.stat.lastWrong ?? 0),
  );
}

/** รอบทบทวนครั้งถัดไป (หลังวันนี้): อีกกี่วัน และมีกี่คำ */
export function nextWordReview(
  deck: VocabDeck,
  progress: ScriptProgress | undefined,
  now: number,
): { inDays: number; count: number } | null {
  if (!progress) return null;
  const today = dayNumber(now);
  let best: number | null = null;
  let count = 0;
  for (const word of Object.values(deck.words)) {
    const due = dueDay(progress[word.id]);
    if (due === null || due <= today) continue;
    if (best === null || due < best) {
      best = due;
      count = 1;
    } else if (due === best) count++;
  }
  return best === null ? null : { inDays: best - today, count };
}

/** เคยทำแบบทดสอบคำศัพท์บ้างหรือยัง (ยัง = ยังไม่มีนัดทบทวน) */
export const wordsAnswered = (progress: ScriptProgress | undefined) =>
  !!progress && Object.values(progress).some((s) => s.answeredAt !== null);

/** ฝึก/ตอบคำศัพท์ครั้งล่าสุดเมื่อไร (0 = ยังไม่เคย) — หน้าแรกใช้เลือกว่าจะชี้สายไหน */
export const lastStudied = (progress: ScriptProgress | undefined) =>
  progress ? Math.max(0, ...Object.values(progress).map((s) => s.lastSeen)) : 0;

const lessonIndex = new WeakMap<VocabDeck, Map<string, VocabLesson>>();

/** บทที่คำนี้อยู่ (ใช้เลือกตัวหลอกจากบทเดียวกันตอนทบทวนคำจากหลายบท) */
export function lessonOfWord(deck: VocabDeck, wordId: string): VocabLesson | undefined {
  let map = lessonIndex.get(deck);
  if (!map) {
    map = new Map(deck.lessons.flatMap((l) => l.words.map((id) => [id, l] as const)));
    lessonIndex.set(deck, map);
  }
  return map.get(wordId);
}

/** ทบทวนรอบละไม่เกินกี่คำ (เท่ากับตัวอักษร) */
export const VOCAB_REVIEW_BATCH = 20;

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
