import { parseExamText, parsePassage } from './text';
import type { ExamGroup, ExamMondai, ExamPart, ExamQuestion, ExamSection, ExamSet, MondaiKind } from './types';

/** คำสั่งของแต่ละประเภทข้อ (ภาษาญี่ปุ่นแบบข้อสอบจริง + คำอธิบายไทยสั้นๆ ว่าต้องทำอะไร) */
export const KIND_INFO: Record<MondaiKind, { ja: string; th: string; part: ExamPart }> = {
  'kanji-reading': {
    ja: '[　　　]の ことばは ひらがなで どう かきますか。',
    th: 'คำที่ขีดเส้นใต้อ่านว่าอย่างไร',
    part: 'vocab',
  },
  orthography: {
    ja: '[　　　]の ことばは どう かきますか。',
    th: 'คำที่ขีดเส้นใต้เขียนด้วยคันจิหรือคาตาคานะอย่างไร',
    part: 'vocab',
  },
  context: {
    ja: '() に なにが はいりますか。',
    th: 'คำไหนเติมในช่องว่างแล้วได้ความหมายที่เหมาะที่สุด',
    part: 'vocab',
  },
  paraphrase: {
    ja: '[　　　]の ぶんと だいたい おなじ いみの ぶんが あります。',
    th: 'เลือกประโยคที่ความหมายใกล้เคียงกับประโยคที่ขีดเส้นใต้มากที่สุด',
    part: 'vocab',
  },
  'grammar-form': {
    ja: '() に {何|なに}を {入|い}れますか。',
    th: 'เลือกคำที่เติมในช่องว่างแล้วถูกไวยากรณ์และได้ความหมาย',
    part: 'grammar',
  },
  composition: {
    ja: '★ に {入|はい}る ものは どれですか。',
    th: 'เรียงคำทั้ง 4 ให้เป็นประโยคที่ถูก แล้วเลือกคำที่อยู่ในช่อง ★',
    part: 'grammar',
  },
  'text-grammar': {
    ja: 'ぶんしょうを {読|よ}んで、<1> から <4> に {何|なに}を {入|い}れますか。',
    th: 'อ่านบทความ แล้วเลือกคำที่เติมในช่องหมายเลขแต่ละช่อง',
    part: 'grammar',
  },
  'reading-short': {
    ja: 'つぎの ぶんしょうを {読|よ}んで、しつもんに こたえて ください。',
    th: 'อ่านข้อความสั้นแล้วตอบคำถาม',
    part: 'reading',
  },
  'reading-mid': {
    ja: 'つぎの ぶんしょうを {読|よ}んで、しつもんに こたえて ください。',
    th: 'อ่านบทความแล้วตอบคำถาม',
    part: 'reading',
  },
  info: {
    ja: 'つぎの おしらせを {見|み}て、しつもんに こたえて ください。',
    th: 'ดูประกาศ/ตาราง แล้วหาข้อมูลมาตอบคำถาม',
    part: 'reading',
  },
};

/** ท้ายคำสั่งทุกข้อ (แบบข้อสอบจริง) */
export const CHOOSE_ONE = '1・2・3・4から いちばん いい ものを {一|ひと}つ えらんで ください。';

export const PART_LABEL: Record<ExamPart, { ja: string; th: string }> = {
  vocab: { ja: 'もじ・ごい', th: 'ตัวอักษรและคำศัพท์' },
  grammar: { ja: 'ぶんぽう', th: 'ไวยากรณ์' },
  reading: { ja: 'どっかい', th: 'การอ่าน' },
};

// ── ตัวช่วยเขียนข้อมูล ──

type Four = readonly [string, string, string, string];

interface QInput {
  stem: string | null;
  choices: Four;
  /** 1–4 แบบเลขข้อบนกระดาษ */
  answer: number;
  order?: readonly number[];
  thai: string;
  explain: string;
}

interface GroupInput {
  passage: string | null;
  passageThai: string | null;
  questions: QInput[];
}

interface MondaiInput {
  kind: MondaiKind;
  groups: GroupInput[];
}

/** ข้อทั่วไป: โจทย์ ตัวเลือก 4 ตัว คำตอบ (1–4) คำแปล และเหตุผล */
export const q = (stem: string | null, choices: Four, answer: number, thai: string, explain: string): QInput => ({
  stem,
  choices,
  answer,
  thai,
  explain,
});

/**
 * ข้อเรียงประโยค: โจทย์มีช่อง `_` 3 ช่องและ `★` 1 ช่อง · order = เลขตัวเลือก (1–4) ตามลำดับในประโยคที่ถูก
 * คำตอบ = ตัวเลือกที่ตกช่อง ★
 */
export function star(stem: string, choices: Four, order: readonly number[], thai: string, explain: string): QInput {
  const gaps = parseExamText(stem).filter((s) => s.gap === 'slot' || s.gap === 'star');
  const at = gaps.findIndex((s) => s.gap === 'star');
  if (gaps.length !== 4 || at < 0) throw new Error(`ข้อเรียงประโยคต้องมีช่อง 4 ช่องและ ★ 1 ช่อง: ${stem}`);
  return { stem, choices, answer: order[at]!, order, thai, explain };
}

/** กลุ่มข้อที่อ่านจากบทความเดียวกัน */
export const passage = (text: string, thai: string, questions: QInput[]): GroupInput => ({
  passage: text,
  passageThai: thai,
  questions,
});

export const mondai = (kind: MondaiKind, items: (QInput | GroupInput)[]): MondaiInput => ({
  kind,
  groups: items.map((x) => ('questions' in x ? x : { passage: null, passageThai: null, questions: [x] })),
});

const SECTION_META = {
  v: { ja: 'げんごちしき（もじ・ごい）', th: 'ความรู้ภาษา: ตัวอักษรและคำศัพท์', minutes: 20 },
  g: { ja: 'げんごちしき（ぶんぽう）・どっかい', th: 'ความรู้ภาษา: ไวยากรณ์ และการอ่าน', minutes: 40 },
} as const;

function buildSection(setId: string, id: 'v' | 'g', input: MondaiInput[]): ExamSection {
  let no = 0;
  const questions: ExamQuestion[] = [];
  const mondaiList: ExamMondai[] = input.map((m, mi) => ({
    no: mi + 1,
    kind: m.kind,
    groups: m.groups.map(
      (g): ExamGroup => ({
        passage: g.passage === null ? null : parsePassage(g.passage),
        passageSrc: g.passage,
        passageThai: g.passageThai,
        questions: g.questions.map((x) => {
          no++;
          const item: ExamQuestion = {
            id: `n5-${setId}:${id}${String(no).padStart(2, '0')}`,
            no,
            kind: m.kind,
            stem: x.stem === null ? null : parseExamText(x.stem),
            stemSrc: x.stem,
            choices: x.choices.map(parseExamText),
            choiceSrc: [...x.choices],
            answer: x.answer - 1,
            ...(x.order ? { order: x.order.map((n) => n - 1) } : {}),
            thai: x.thai,
            explain: x.explain,
          };
          questions.push(item);
          return item;
        }),
      }),
    ),
  }));
  return { id, ...SECTION_META[id], mondai: mondaiList, questions };
}

export function examSet(id: string, title: string, vocab: MondaiInput[], grammar: MondaiInput[]): ExamSet {
  const sections = [buildSection(id, 'v', vocab), buildSection(id, 'g', grammar)];
  return { id, title, sections, questions: sections.flatMap((s) => s.questions) };
}
