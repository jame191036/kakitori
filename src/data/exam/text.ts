/**
 * ข้อความของข้อสอบจำลอง เขียนเป็น markup สั้นๆ (คล้ายประโยคในบทไวยากรณ์ แต่ช่องว่างแสดงบนจอ
 * เพราะข้อสอบ N5 จริงเว้นวรรคระหว่างคำ):
 *
 *   'あしたの [{午後|ごご}]、ともだちと えいがを {見|み}ます。'
 *
 * - `{漢字|かな}` = คันจิพร้อมคำอ่าน (ระหว่างสอบไม่แสดงคำอ่าน · แสดงตอนดูเฉลย)
 * - `[ … ]`       = ส่วนที่ขีดเส้นใต้ (ข้อละไม่เกิน 1 จุด)
 * - `()`          = ช่องวงเล็บให้เติม (แสดงเป็นวงเล็บเว้นว่างแบบข้อสอบจริง)
 * - `_` และ `★`   = ช่องของข้อเรียงประโยค (★ = ช่องที่ถาม)
 * - `<1>`–`<4>`   = ช่องในบทความ อ้างถึงข้อที่ 1–4 ของบทความนั้น (แสดงเป็นเลขข้อจริง)
 *
 * บทความ (passage) แยกบรรทัดด้วย \n: บรรทัดที่ขึ้นต้นด้วย `# ` = หัวเรื่อง ·
 * บรรทัดที่ขึ้นต้นด้วย `|` = แถวตาราง (แบ่งช่องด้วย `|`) · บรรทัดว่าง = เว้นบรรทัด · `>` = ชิดขวา (ชื่อผู้เขียน)
 */

export type ExamGap = 'blank' | 'slot' | 'star' | 'ref';

export interface ExamSeg {
  /** ข้อความที่แสดง ('' สำหรับช่องว่าง) */
  text: string;
  /** คำอ่านเหนือคันจิ */
  ruby?: string;
  /** อยู่ในส่วนที่ขีดเส้นใต้ */
  under?: boolean;
  /** ช่องให้เติม */
  gap?: ExamGap;
  /** ช่องในบทความ: ข้อที่เท่าไรของบทความ (1–4) */
  ref?: number;
  /** ส่วนที่เติมคำตอบลงไป (ใช้ตอนแสดงเฉลย — ไม่ได้มาจาก markup) */
  hl?: boolean;
}

export type PassageBlock =
  | { type: 'title'; segs: ExamSeg[] }
  | { type: 'line'; segs: ExamSeg[]; right?: boolean }
  | { type: 'row'; cells: ExamSeg[][] }
  | { type: 'space' };

export function parseExamText(src: string): ExamSeg[] {
  const segs: ExamSeg[] = [];
  let under = false;
  let unders = 0;
  const push = (seg: ExamSeg) => {
    const last = segs[segs.length - 1];
    // รวมตัวอักษรธรรมดาที่อยู่ติดกัน (สถานะเดียวกัน) เป็นชิ้นเดียว
    if (last && !last.ruby && !last.gap && !seg.ruby && !seg.gap && !!last.under === !!seg.under) last.text += seg.text;
    else segs.push(seg);
  };
  const mark = (seg: ExamSeg): ExamSeg => (under ? { ...seg, under: true } : seg);
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '[') {
      if (under) throw new Error(`[ ซ้อนกัน: ${src}`);
      under = true;
      unders++;
      continue;
    }
    if (ch === ']') {
      if (!under) throw new Error(`] เกิน: ${src}`);
      under = false;
      continue;
    }
    if (ch === '{') {
      const close = src.indexOf('}', i);
      const [text, ruby, extra] = src.slice(i + 1, close).split('|');
      if (close < 0 || !text || !ruby || extra !== undefined) throw new Error(`คำอ่านผิดรูปแบบ: ${src}`);
      push(mark({ text, ruby }));
      i = close;
      continue;
    }
    if (ch === '(' && src[i + 1] === ')') {
      push(mark({ text: '', gap: 'blank' }));
      i++;
      continue;
    }
    if (ch === '_' || ch === '★') {
      push({ text: '', gap: ch === '★' ? 'star' : 'slot' });
      continue;
    }
    if (ch === '<') {
      const m = /^<([1-9])>/.exec(src.slice(i));
      if (!m) throw new Error(`ช่องในบทความผิดรูปแบบ: ${src}`);
      push({ text: '', gap: 'ref', ref: Number(m[1]) });
      i += m[0].length - 1;
      continue;
    }
    if ('}|]>'.includes(ch)) throw new Error(`เครื่องหมาย ${ch} เกิน: ${src}`);
    push(mark({ text: ch }));
  }
  if (under) throw new Error(`ไม่มี ] ปิด: ${src}`);
  if (unders > 1) throw new Error(`ขีดเส้นใต้ได้จุดเดียว: ${src}`);
  return segs;
}

/** แบ่งแถวตารางด้วย | ที่อยู่นอก {漢字|かな} */
function splitCells(row: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inRuby = false;
  for (const ch of row) {
    if (ch === '{') inRuby = true;
    if (ch === '}') inRuby = false;
    if (ch === '|' && !inRuby) {
      cells.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

export function parsePassage(src: string): PassageBlock[] {
  return src.split('\n').map((raw): PassageBlock => {
    const line = raw.trim();
    if (!line) return { type: 'space' };
    if (line.startsWith('# ')) return { type: 'title', segs: parseExamText(line.slice(2)) };
    if (line.startsWith('|')) {
      return { type: 'row', cells: splitCells(line.slice(1).replace(/\|$/, '')).map(parseExamText) };
    }
    if (line.startsWith('> ')) return { type: 'line', segs: parseExamText(line.slice(2)), right: true };
    return { type: 'line', segs: parseExamText(line) };
  });
}

/** ชิ้นทั้งหมดของบทความ (ใช้ตรวจคันจิ/คำอ่านในเทส และหาช่อง <n>) */
export function passageSegs(blocks: readonly PassageBlock[]): ExamSeg[] {
  return blocks.flatMap((b) => (b.type === 'row' ? b.cells.flat() : b.type === 'space' ? [] : b.segs));
}

export const examPlain = (segs: readonly ExamSeg[]) =>
  segs.map((s) => (s.gap === 'blank' ? '（　）' : s.gap === 'star' ? '★' : s.gap === 'slot' ? '＿' : s.text)).join('');

export const examKana = (segs: readonly ExamSeg[]) => segs.map((s) => s.ruby ?? s.text).join('');

/** ข้อความแบบเขียนจริง + คำอ่าน เช่น 先週（せんしゅう）デパートで… — ใช้ในตารางตรวจเนื้อหา */
export const examWithReading = (segs: readonly ExamSeg[]) => {
  const plain = examPlain(segs);
  const kana = segs.map((s) => (s.gap ? examPlain([s]) : (s.ruby ?? s.text))).join('');
  return plain === kana ? plain : `${plain}（${kana}）`;
};
