import type { KanjiDeck, KanjiEntry } from '../../data/kanji/types';
import { lessonWords, type LineLesson } from '../../data/line';
import type { VocabDeck, VocabWord } from '../../data/vocab';
import { shuffle, type Rng } from '../../lib/shuffle';
import { lessonOfWord } from '../line/lineLogic';
import { pickDistractors } from '../vocab/vocabLogic';

/**
 * คำถามของสายคันจิ (ตรรกะสถานี/ตรา/ทบทวนใช้ features/line/lineLogic.ts ร่วมกับคำศัพท์)
 * - write: เขียนตามเส้นนำทีละขีด (แบบฝึกเท่านั้น)
 * - meaningToKanji / kanjiToMeaning: จำตัวกับความหมาย
 * - reading: ดูคำศัพท์ที่เขียนด้วยคันจิ → เลือกคำอ่าน (ตัวหลอก = แทนคำอ่านของคันจิตัวนั้นด้วยคำอ่านอื่นของมัน)
 */

export type KanjiQType = 'write' | 'meaningToKanji' | 'kanjiToMeaning' | 'reading';

export interface KanjiQuestion {
  id: string;
  type: KanjiQType;
  kanji: KanjiEntry;
  /** ตัวเลือกคันจิ (รวมคำตอบ) — ข้อ meaningToKanji / kanjiToMeaning */
  choices: KanjiEntry[];
  /** คำศัพท์ที่ใช้ถามคำอ่าน — ข้อ reading */
  word?: VocabWord;
  /** ตัวเลือกคำอ่าน (รวมคำตอบ = word.kana) — ข้อ reading */
  readingChoices: string[];
}

/** รูปคำอ่านทั้งหมดของคันจิ เช่น 'ひ・び' → ['ひ', 'び'] · 'うし(ろ)' → ['うし'] */
const forms = (kana: string) => kana.split('・').map((f) => f.replace(/\(.*\)/, ''));

/** คำศัพท์ตัวอย่างทั้งหมดของคันจิ (ตามคำอ่าน) */
export function examplesOf(entry: KanjiEntry, vocab: VocabDeck): VocabWord[] {
  return entry.readings.flatMap((r) => r.words.map((id) => vocab.words[id]).filter((w): w is VocabWord => !!w));
}

/**
 * ตัวเลือกคำอ่านของคำ: คำอ่านจริง + แทนส่วนที่เป็นคันจิตัวนี้ด้วยคำอ่านอื่นของมัน (เช่น 毎日 まいにち → まいひ / まいか)
 * ถ้ายังไม่ครบ 4 เติมด้วยคำอ่านของคำอื่นที่ยาวใกล้เคียงกัน
 * ไม่ใช้คำอ่านของคำอื่นที่เขียนเหมือนกัน (เช่น 一日 = いちにち / ついたち) เป็นตัวหลอก — ไม่งั้นมีคำตอบถูกสองข้อ
 */
export function readingChoicesFor(entry: KanjiEntry, word: VocabWord, vocab: VocabDeck, rng: Rng): string[] {
  const sameWritten = new Set(
    Object.values(vocab.words)
      .filter((w) => w.kanji === word.kanji)
      .map((w) => w.kana),
  );
  const mine = entry.readings.find((r) => r.words.includes(word.id));
  const used = mine ? forms(mine.kana).find((f) => word.kana.includes(f)) : undefined;
  const others = entry.readings.flatMap((r) => forms(r.kana)).filter((f) => f !== used);
  const swapped = used ? others.map((f) => word.kana.replace(used, f)) : [];
  const near = shuffle(
    Object.values(vocab.words).filter((w) => Math.abs([...w.kana].length - [...word.kana].length) <= 1),
    rng,
  ).map((w) => w.kana);
  const picked: string[] = [];
  for (const c of [...shuffle(swapped, rng), ...near]) {
    if (picked.length === 3) break;
    if (!sameWritten.has(c) && !picked.includes(c)) picked.push(c);
  }
  return shuffle([word.kana, ...picked], rng);
}

function make(
  type: KanjiQType,
  entry: KanjiEntry,
  deck: KanjiDeck,
  lesson: LineLesson,
  vocab: VocabDeck,
  rng: Rng,
): KanjiQuestion {
  const q: KanjiQuestion = { id: `${type}:${entry.id}`, type, kanji: entry, choices: [], readingChoices: [] };
  if (type === 'meaningToKanji' || type === 'kanjiToMeaning') {
    q.choices = shuffle([entry, ...pickDistractors(entry, lessonWords(deck, lesson), Object.values(deck.words), rng)], rng);
  }
  if (type === 'reading') {
    const examples = examplesOf(entry, vocab);
    const word = examples[Math.floor(rng() * examples.length)]!;
    q.word = word;
    q.readingChoices = readingChoicesFor(entry, word, vocab, rng);
  }
  return q;
}

/** ใช้ข้อแบบอ่านคำได้ไหม (ต้องมีคำตัวอย่างจากคลังคำศัพท์) */
const canRead = (entry: KanjiEntry, vocab: VocabDeck) => examplesOf(entry, vocab).length > 0;

const RECOGNIZE: KanjiQType[] = ['kanjiToMeaning', 'meaningToKanji', 'reading'];

function recognizeType(entry: KanjiEntry, i: number, vocab: VocabDeck): KanjiQType {
  const t = RECOGNIZE[i % RECOGNIZE.length]!;
  return t === 'reading' && !canRead(entry, vocab) ? 'kanjiToMeaning' : t;
}

/**
 * แบบฝึก: ตัวละ 2 ข้อ (ไม่นับเป็นผลสอบ) — เขียนตามเส้นนำครบทุกตัวตามลำดับบทก่อน
 * แล้วจึงสลับลำดับมาถามจำตัว/อ่านคำ (ได้ทบทวนตัวที่เพิ่งเขียน)
 */
export function practiceQuestions(
  deck: KanjiDeck,
  lesson: LineLesson,
  vocab: VocabDeck,
  rng: Rng = Math.random,
): KanjiQuestion[] {
  const items = lessonWords(deck, lesson);
  const writes = items.map((e) => make('write', e, deck, lesson, vocab, rng));
  const recognize = shuffle(items, rng).map((e, i) => make(recognizeType(e, i, vocab), e, deck, lesson, vocab, rng));
  return [...writes, ...recognize];
}

/**
 * แบบทดสอบทบทวน: คันจิจากหลายบท ตัวละ 1 ข้อแบบเลือกคำตอบ (ไม่มีข้อเขียน — ผลบันทึกและเลื่อนกล่องทบทวนเหมือนแบบทดสอบในบท)
 * ตัวหลอกของข้อจำตัวมาจากบทของคันจิตัวนั้นก่อน
 */
export function reviewQuestions(
  deck: KanjiDeck,
  items: readonly KanjiEntry[],
  vocab: VocabDeck,
  rng: Rng = Math.random,
): KanjiQuestion[] {
  return shuffle(items, rng).flatMap((e, i) => {
    const lesson = lessonOfWord(deck, e.id);
    return lesson ? [make(recognizeType(e, i, vocab), e, deck, lesson, vocab, rng)] : [];
  });
}

/** แบบทดสอบ: ตัวละ 1 ข้อ (ความหมาย / ตัวคันจิ / อ่านคำ) — ถูกครบทุกตัว = ผ่านสถานี */
export function testQuestions(
  deck: KanjiDeck,
  lesson: LineLesson,
  vocab: VocabDeck,
  { rng = Math.random, only }: { rng?: Rng; only?: readonly string[] } = {},
): KanjiQuestion[] {
  const items = shuffle(
    lessonWords(deck, lesson).filter((e) => !only || only.includes(e.id)),
    rng,
  );
  return items.map((e, i) => make(recognizeType(e, i, vocab), e, deck, lesson, vocab, rng));
}
