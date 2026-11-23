import { parseSentence } from '../grammar/sentence';
import { kanaToRomaji } from '../vocab/romaji';
import type { PhraseKind, TravelPhrase } from './types';

export { buildDeck, lesson, segment } from '../line/build';

/** markup แบบคานะล้วน: {漢字|かな} → かな */
const kanaMarkup = (src: string) => src.replace(/\{[^|}]*\|([^}]*)\}/g, '$1');

/** โรมาจิของ 1 คำ (ไม่มี 、 / ช่องว่าง) — แยก です · ですか · ますか · ませんか ท้ายคำให้อ่านง่าย */
function wordRomaji(kana: string): string {
  if (kana === 'か') return 'ka';
  if (kana === 'です') return 'desu';
  if (kana.endsWith('ですか')) return [kana.slice(0, -3) && wordRomaji(kana.slice(0, -3)), 'desu ka'].filter(Boolean).join(' ');
  if (kana.endsWith('です')) return [wordRomaji(kana.slice(0, -2)), 'desu'].join(' ');
  if (kana.length > 3 && kana.endsWith('でした')) return [wordRomaji(kana.slice(0, -3)), 'deshita'].join(' ');
  if (/(ます|ません)か$/.test(kana)) return `${kanaToRomaji(kana.slice(0, -1))} ka`;
  return kanaToRomaji(kana);
}

/** คำช่วยท้ายส่วนอ่านตามเสียง (は = wa · へ = e · を = o) */
function partRomaji(part: string): string {
  const last = part.at(-1);
  const particle = last === 'は' ? 'wa' : last === 'へ' ? 'e' : last === 'を' ? 'o' : null;
  if (!particle) return wordRomaji(part);
  const stem = part.slice(0, -1);
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
    note?: string;
    /** ใช้ทำข้อเรียงประโยค — ใส่เฉพาะวลีที่เรียงได้แบบเดียว */
    arrange?: boolean;
    /** โรมาจิเอง (เมื่อแปลงอัตโนมัติไม่ได้ เช่น こんにちは = konnichiwa) */
    romaji?: string;
  } = {},
): TravelPhrase {
  const markup = ja.replaceAll('/', '');
  const sentence = parseSentence(markup);
  const kanaSentence = parseSentence(kanaMarkup(markup));
  const chunksKana = kanaSentence.chunks.map((c) => c.map((s) => s.text).join(''));
  const end = sentence.end;
  const kind: PhraseKind = opts.hear ? 'hear' : 'say';
  const romajiChunks = kanaMarkup(ja).replace(END, '').split(' ').filter(Boolean);
  const mark = end.includes('？') ? '?' : end.includes('！') ? '!' : '';
  return {
    id,
    kind,
    sentence,
    kanaSentence,
    // เว้นวรรคระหว่างชิ้น ยกเว้นหลัง 、 (ภาษาญี่ปุ่นไม่เว้นวรรคหลังจุลภาค)
    kana: chunksKana.reduce((s, c, i) => (i === 0 ? c : s.endsWith('、') ? s + c : `${s} ${c}`), '') + end,
    written: sentence.plain + end,
    romaji: opts.romaji ?? romajiChunks.map(chunkRomaji).join(' ') + mark,
    thai,
    ...(opts.note ? { note: opts.note } : {}),
    arrange: !!opts.arrange,
  };
}

/** ข้อความแบบเขียนจริงไม่มีคันจิ (= เหมือนคานะ) ไม่ต้องแสดงซ้ำ */
export const hasWrittenForm = (phrase: TravelPhrase) => phrase.written.replaceAll(' ', '') !== phrase.kana.replaceAll(' ', '');
