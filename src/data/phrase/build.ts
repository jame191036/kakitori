import { parseSentence, type Sentence } from '../grammar/sentence';
import { buildDeck as buildLineDeck, lesson, type LessonInput, type SegmentInput } from '../line/build';
import type { LineDeck } from '../line/types';
import { kanaToRomaji } from '../vocab/romaji';
import type { Dialogue, DialogueLine, Phrase, PhraseDeck, PhraseKind, PhraseText } from './types';

export { buildDeck, lesson, segment } from '../line/build';

/** markup แบบคานะล้วน: {漢字|かな} → かな */
const kanaMarkup = (src: string) => src.replace(/\{[^|}]*\|([^}]*)\}/g, '$1');

/** โรมาจิของ 1 คำ (ไม่มี 、 / ช่องว่าง) — แยก です · ですか · ますか · ませんか ท้ายคำให้อ่านง่าย */
function wordRomaji(kana: string): string {
  if (kana === 'か') return 'ka';
  if (kana === 'です') return 'desu';
  if (kana.endsWith('ですか')) return [kana.slice(0, -3) && wordRomaji(kana.slice(0, -3)), 'desu ka'].filter(Boolean).join(' ');
  // ですね / ですよ (คำลงท้าย ね / よ)
  const ne = /です(ね|よ)$/.exec(kana);
  if (ne) return [kana.slice(0, -3) && wordRomaji(kana.slice(0, -3)), `desu ${ne[1] === 'ね' ? 'ne' : 'yo'}`].filter(Boolean).join(' ');
  if (kana.endsWith('です')) return [wordRomaji(kana.slice(0, -2)), 'desu'].join(' ');
  if (kana.length > 3 && kana.endsWith('でした')) return [wordRomaji(kana.slice(0, -3)), 'deshita'].join(' ');
  if (/(ます|ません|ました|ましょう)か$/.test(kana)) return `${kanaToRomaji(kana.slice(0, -1))} ka`;
  return kanaToRomaji(kana);
}

/** ท้ายคำอ่านของคันจิ ({母|はは}) — は/へ ตรงนี้เป็นส่วนของคำ ไม่ใช่คำช่วย */
const RUBY_END = '​';

/** คำช่วยท้ายส่วนอ่านตามเสียง (は = wa · へ = e · を = o) — ยกเว้นตัวที่เป็นท้ายคำอ่านของคันจิ */
function partRomaji(part: string): string {
  const last = part.at(-1);
  const particle = last === 'は' ? 'wa' : last === 'へ' ? 'e' : last === 'を' ? 'o' : null;
  if (!particle) return wordRomaji(part.replaceAll(RUBY_END, ''));
  const stem = part.slice(0, -1).replaceAll(RUBY_END, '');
  return stem ? `${wordRomaji(stem)} ${particle}` : particle;
}

/**
 * โรมาจิของ 1 ชิ้น (ข้อความคานะของชิ้นใน markup — ยังมี / ได้)
 * - / = เว้นวรรคในโรมาจิ (ไม่แสดงในตัวญี่ปุ่น) เช่น 'しんじゅく/まで' → 'shinjuku made'
 * - 、 = , · は/へ/を ท้ายแต่ละส่วนอ่านตามเสียงคำช่วย
 * เช่น 'きっぷは' → 'kippu wa' · 'はい、どうぞ' → 'hai, douzo' · 'どこですか' → 'doko desu ka'
 */
export function chunkRomaji(kana: string): string {
  return kana
    .split('、')
    .map((piece) =>
      piece
        .split('/')
        .filter(Boolean)
        .map(partRomaji)
        .join(' '),
    )
    .join(', ')
    .trimEnd();
}

const END = /[。？！]+$/u;

/**
 * แปลง markup 1 ประโยคเป็นข้อความที่แสดง (คานะใหญ่ · แบบเขียนจริง · โรมาจิ)
 * romaji = ใส่เองเมื่อแปลงอัตโนมัติไม่ได้
 */
export function phraseText(ja: string, romaji?: string): PhraseText & { sentence: Sentence; kanaSentence: Sentence } {
  // จบด้วย … = พูดค้างไว้ (ปฏิเสธแบบนุ่มนวล เช่น その日は ちょっと…) — แยกไว้เป็นเครื่องหมายท้ายเอง
  const trailing = ja.endsWith('…') ? '…' : '';
  const body = trailing ? ja.slice(0, -1) : ja;
  const markup = body.replaceAll('/', '');
  const sentence = parseSentence(markup);
  const kanaSentence = parseSentence(kanaMarkup(markup));
  const chunksKana = kanaSentence.chunks.map((c) => c.map((s) => s.text).join(''));
  const end = sentence.end + trailing;
  // โรมาจิ: คำอ่านของคันจิต่อท้ายด้วย RUBY_END ({母|はは}と → はは + と ไม่อ่าน は เป็น wa)
  const romajiChunks = body
    .replace(/\{[^|}]*\|([^}]*)\}/g, `$1${RUBY_END}`)
    .replace(END, '')
    .split(' ')
    .filter(Boolean);
  const mark = end.includes('？') ? '?' : end.includes('！') ? '!' : trailing ? '...' : '';
  return {
    sentence,
    kanaSentence,
    // เว้นวรรคระหว่างชิ้น ยกเว้นหลัง 、 (ภาษาญี่ปุ่นไม่เว้นวรรคหลังจุลภาค)
    kana: chunksKana.reduce((s, c, i) => (i === 0 ? c : s.endsWith('、') ? s + c : `${s} ${c}`), '') + end,
    written: sentence.plain + end,
    romaji: romaji ?? romajiChunks.map(chunkRomaji).join(' ') + mark,
  };
}

const textOnly = ({ kana, written, romaji }: PhraseText): PhraseText => ({ kana, written, romaji });

/**
 * ตัวช่วยเขียนวลีให้สั้น:
 *
 *   p('kippu-doko', '{切符|きっぷ}は どこで {買|か}えますか？', 'ซื้อตั๋วได้ที่ไหน')
 *   p('irasshaimase', 'いらっしゃいませ。', 'ยินดีต้อนรับ', { hear: true, note: '…' })
 *
 * markup เดียวกับประโยคไวยากรณ์ (src/data/grammar/sentence.ts): ช่องว่าง = แบ่งชิ้น (คานะตัวใหญ่เว้นวรรคตรงนี้)
 * เพิ่ม / = จุดเว้นวรรคของโรมาจิภายในชิ้น (ไม่แสดงในตัวญี่ปุ่น)
 */
export function p(
  id: string,
  ja: string,
  thai: string,
  opts: {
    /** ประโยคที่จะได้ยิน (ไม่ต้องพูดเอง) */
    hear?: boolean;
    /** ป้าย (อ่านให้ออก) — ไม่มีเครื่องหมายท้าย */
    sign?: boolean;
    note?: string;
    /** ใช้ทำข้อเรียงประโยค — ใส่เฉพาะวลีที่เรียงได้แบบเดียว */
    arrange?: boolean;
    /** โรมาจิเอง (เมื่อแปลงอัตโนมัติไม่ได้ เช่น こんにちは = konnichiwa) */
    romaji?: string;
    /** id ของวลีที่ใช้แทนกันได้ในบางสถานการณ์ (ห้ามเป็นตัวหลอกของกันและกัน) */
    avoid?: readonly string[];
    /** แบบกันเอง (markup เดียวกัน) — แสดงคู่กันในการ์ดเรียน */
    casual?: string;
  } = {},
): Phrase {
  const text = phraseText(ja, opts.romaji);
  const kind: PhraseKind = opts.sign ? 'sign' : opts.hear ? 'hear' : 'say';
  return {
    id,
    kind,
    ...text,
    thai,
    ...(opts.note ? { note: opts.note } : {}),
    ...(opts.casual ? { casual: textOnly(phraseText(opts.casual)) } : {}),
    arrange: !!opts.arrange,
    ...(opts.avoid ? { avoid: opts.avoid } : {}),
  };
}

/** บรรทัดของบทสนทนาตัวอย่าง: d('a', 'คุณทานากะ', 'markup', 'คำแปล') */
export const d = (side: DialogueLine['side'], speaker: string, ja: string, thai: string): DialogueLine => ({
  side,
  speaker,
  ...textOnly(phraseText(ja)),
  thai,
});

/** บทที่มีบทสนทนาตัวอย่าง (ใช้แทน lesson ของสายวลีที่มีบทสนทนา) */
export function dialogLesson(
  id: string,
  name: string,
  title: string,
  phrases: readonly Phrase[],
  dialogue: Dialogue,
): LessonInput<Phrase> & { dialogue: Dialogue } {
  return { ...lesson(id, name, title, phrases), dialogue };
}

/** ประกอบสายวลี + เก็บบทสนทนาของแต่ละบทไว้กับชุด */
export function buildPhraseDeck(
  meta: Pick<LineDeck, 'id' | 'progressKey' | 'name' | 'letter'>,
  input: readonly SegmentInput<Phrase>[],
): PhraseDeck {
  const dialogues: Record<string, Dialogue> = {};
  for (const s of input) {
    for (const l of s.lessons) {
      const dialogue = (l as Partial<{ dialogue: Dialogue }>).dialogue;
      if (dialogue) dialogues[l.id] = dialogue;
    }
  }
  return { ...buildLineDeck<Phrase>(meta, input), dialogues };
}

/** ข้อความหลักของวลี: ป้าย = ตัวหนังสือบนป้าย · วลีอื่น = คานะ */
export const faceText = (phrase: Phrase) => (phrase.kind === 'sign' ? phrase.written : phrase.kana);

/** ข้อความแบบเขียนจริงไม่มีคันจิ (= เหมือนคานะ) ไม่ต้องแสดงซ้ำ */
export const hasWrittenForm = (phrase: PhraseText) => phrase.written.replaceAll(' ', '') !== phrase.kana.replaceAll(' ', '');
