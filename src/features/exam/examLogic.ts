import { KIND_INFO } from '../../data/exam/build';
import { examPlain, type ExamSeg } from '../../data/exam/text';
import type { ExamPart, ExamQuestion, ExamSet, MondaiKind } from '../../data/exam/types';

/**
 * คะแนนข้อสอบจำลอง (pure functions)
 *
 * ข้อสอบ N5 จริง: ส่วนความรู้ภาษา + การอ่าน เต็ม 120 (ขั้นต่ำ 38) · การฟัง เต็ม 60 (ขั้นต่ำ 19) ·
 * รวมต้องได้ 80 จาก 180 — https://www.jlpt.jp/e/guideline/results.html
 * JLPT ปรับคะแนนตามความยากของแต่ละข้อ (ไม่ได้นับข้อถูกตรงๆ) ที่นี่จึงทำได้แค่ประมาณ: เทียบสัดส่วนข้อที่ถูกเป็นคะแนนเต็ม 120
 */

export type Answers = Readonly<Record<string, number>>;

export const SECTION_MAX = 120;
export const SECTION_MIN = 38;
export const TOTAL_MAX = 180;
export const TOTAL_PASS = 80;
/** สัดส่วนที่ถือว่า "น่าจะผ่าน" — เผื่อไว้จากเส้นผ่านจริง (80/180 ≈ 44%) เพราะคะแนนจริงไม่ได้นับข้อถูกตรงๆ */
export const SAFE_RATIO = 0.6;

export type Verdict = 'pass' | 'borderline' | 'fail';

export interface ScoreLine {
  correct: number;
  total: number;
}

export interface MondaiScore extends ScoreLine {
  section: number;
  no: number;
  kind: MondaiKind;
}

export interface ExamScore extends ScoreLine {
  answered: number;
  /** คะแนนเทียบเต็ม 120 */
  scaled: number;
  /** ถ้าการฟังได้สัดส่วนเท่ากัน คะแนนรวมจะประมาณเท่านี้ (เต็ม 180) */
  projected: number;
  verdict: Verdict;
  parts: Record<ExamPart, ScoreLine>;
  sections: ScoreLine[];
  mondai: MondaiScore[];
}

export const isCorrect = (q: ExamQuestion, answers: Answers) => answers[q.id] === q.answer;

export const answeredCount = (questions: readonly ExamQuestion[], answers: Answers) =>
  questions.filter((q) => answers[q.id] !== undefined).length;

export function verdictOf(correct: number, total: number): Verdict {
  const ratio = total ? correct / total : 0;
  if (Math.round(ratio * SECTION_MAX) < SECTION_MIN || ratio * TOTAL_MAX < TOTAL_PASS) return 'fail';
  return ratio < SAFE_RATIO ? 'borderline' : 'pass';
}

export function scoreExam(set: ExamSet, answers: Answers): ExamScore {
  const line = (qs: readonly ExamQuestion[]): ScoreLine => ({
    correct: qs.filter((q) => isCorrect(q, answers)).length,
    total: qs.length,
  });
  const parts = { vocab: [], grammar: [], reading: [] } as Record<ExamPart, ExamQuestion[]>;
  for (const q of set.questions) parts[KIND_INFO[q.kind].part].push(q);
  const { correct, total } = line(set.questions);
  const ratio = total ? correct / total : 0;
  return {
    correct,
    total,
    answered: answeredCount(set.questions, answers),
    scaled: Math.round(ratio * SECTION_MAX),
    projected: Math.round(ratio * TOTAL_MAX),
    verdict: verdictOf(correct, total),
    parts: { vocab: line(parts.vocab), grammar: line(parts.grammar), reading: line(parts.reading) },
    sections: set.sections.map((s) => line(s.questions)),
    mondai: set.sections.flatMap((s, section) =>
      s.mondai.map((m) => ({ section, no: m.no, kind: m.kind, ...line(m.groups.flatMap((g) => g.questions)) })),
    ),
  };
}

/** เวลาที่เหลือ (ms) — ไม่ติดลบ */
export const remainingMs = (deadline: number, now: number) => Math.max(0, deadline - now);

/** 754000 → '12:34' · ปัดขึ้นเป็นวินาที (เหลือ 0.3 วิ ยังแสดง 0:01 ไม่ใช่ 0:00) */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 754 วินาที → '12 นาที 34 วินาที' */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (!m) return `${s} วินาที`;
  return s ? `${m} นาที ${s} วินาที` : `${m} นาที`;
}

const mark = (segs: readonly ExamSeg[]): ExamSeg[] => segs.map((s) => ({ ...s, hl: true }));

/**
 * ประโยคเฉลย: ข้อเติมคำ → ใส่คำตอบในช่องวงเล็บ · ข้อเรียงประโยค → เรียงตัวเลือกตามลำดับที่ถูก
 * (ส่วนที่เติมทำเครื่องหมาย hl ไว้ให้เน้นสี) — ข้ออื่นคืนโจทย์เดิม
 */
export function answerSentence(q: ExamQuestion): ExamSeg[] {
  if (!q.stem) return [];
  const stem = q.stem;
  const isSlot = (s: ExamSeg | undefined) => s?.gap === 'slot' || s?.gap === 'star';
  const out: ExamSeg[] = [];
  let k = 0;
  stem.forEach((s, i) => {
    if (s.gap === 'blank') {
      const answer = q.choices[q.answer]!;
      // คำช่วยตัวเดียว (を で が も …) ติดกับคำหน้า ไม่เว้นวรรค: パン（を）→ パンを
      const prev = out[out.length - 1];
      if (examPlain(answer).length === 1 && prev && !prev.gap && !prev.ruby) {
        out[out.length - 1] = { ...prev, text: prev.text.replace(/ $/, '') };
      }
      out.push(...mark(answer));
    } else if (isSlot(s) && q.order) {
      const piece = q.choices[q.order[k++]!]!;
      out.push(...(s.gap === 'star' ? mark(piece) : piece));
    } else if (!(s.text.trim() === '' && isSlot(stem[i - 1]) && isSlot(stem[i + 1]))) out.push(s);
    // ช่องว่างระหว่างช่องเรียงประโยคตัดทิ้ง — ชิ้นที่เรียงแล้วต่อกันเป็นคำเดียว
  });
  return out;
}
