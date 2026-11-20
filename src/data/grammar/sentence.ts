/**
 * ประโยคภาษาญี่ปุ่นของบทไวยากรณ์ เขียนเป็นข้อความสั้นๆ แล้วแปลงเป็นชิ้นสำหรับแสดงผล:
 *
 *   'わたし[は] {学生|がくせい} です。'
 *
 * - `{漢字|かな}` = คำที่เขียนด้วยคันจิ พร้อมคำอ่านตัวเล็กด้านบน (furigana)
 * - `[ … ]`       = ส่วนที่เป็นไวยากรณ์ของข้อนั้น (เน้นสีในการ์ด · เป็นช่องว่างในข้อเติมคำ)
 * - ช่องว่าง        = แบ่งชิ้นสำหรับข้อเรียงประโยค (ไม่แสดงบนจอ — ภาษาญี่ปุ่นไม่เว้นวรรค)
 * - 。？！ ท้ายประโยคแยกเก็บไว้ ไม่เป็นชิ้นให้เรียง
 */

export interface Seg {
  /** ข้อความที่แสดง (คันจิ / คานะ / ตัวเลข) */
  text: string;
  /** คำอ่านตัวเล็กเหนือคันจิ */
  ruby?: string;
  /** อยู่ในส่วนไวยากรณ์ของข้อ */
  target?: boolean;
}

export interface Sentence {
  src: string;
  /** ชิ้นสำหรับข้อเรียงประโยค ตามลำดับที่ถูก (ไม่รวมเครื่องหมายท้ายประโยค) */
  chunks: Seg[][];
  /** เครื่องหมายท้ายประโยค เช่น 。 หรือ ？ (อาจว่าง) */
  end: string;
  /** ทั้งประโยคต่อกัน (ไม่มีเครื่องหมายท้าย) */
  segs: Seg[];
  /** ข้อความแบบเขียนจริง (มีคันจิ) — ใช้กับเสียงอ่าน */
  plain: string;
  /** ทั้งประโยคเป็นคานะ */
  kana: string;
  /** ข้อความของส่วนไวยากรณ์ (แบบเขียนจริง) — '' ถ้าไม่ได้ทำเครื่องหมายไว้ */
  target: string;
  /** markup ของส่วนไวยากรณ์ (ใช้แสดงเป็นตัวเลือก พร้อมคำอ่าน) */
  targetSrc: string;
}

const END = /[。？！]+$/u;

export const plainOf = (segs: readonly Seg[]) => segs.map((s) => s.text).join('');
export const kanaOf = (segs: readonly Seg[]) => segs.map((s) => s.ruby ?? s.text).join('');

/** แปลง markup เป็นชิ้น แบ่งตามช่องว่าง */
function parseChunks(src: string): { chunks: Seg[][]; targetSrc: string } {
  const chunks: Seg[][] = [[]];
  let inTarget = false;
  let targetSrc = '';
  let targets = 0;
  const push = (seg: Seg) => {
    const cur = chunks[chunks.length - 1]!;
    const last = cur[cur.length - 1];
    // รวมตัวอักษรธรรมดาที่อยู่ติดกัน (สถานะเดียวกัน) เป็นชิ้นเดียว
    if (last && !last.ruby && !seg.ruby && !!last.target === !!seg.target) last.text += seg.text;
    else cur.push(seg);
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === ' ') {
      if (chunks[chunks.length - 1]!.length) chunks.push([]);
      continue;
    }
    if (ch === '[') {
      if (inTarget) throw new Error(`[ ซ้อนกัน: ${src}`);
      inTarget = true;
      targets++;
      continue;
    }
    if (ch === ']') {
      if (!inTarget) throw new Error(`] เกิน: ${src}`);
      inTarget = false;
      continue;
    }
    if (inTarget) targetSrc += ch;
    if (ch === '{') {
      const close = src.indexOf('}', i);
      const [text, ruby, extra] = src.slice(i + 1, close).split('|');
      if (close < 0 || !text || !ruby || extra !== undefined) throw new Error(`คำอ่านผิดรูปแบบ: ${src}`);
      if (inTarget) targetSrc += src.slice(i + 1, close + 1);
      push({ text, ruby, ...(inTarget ? { target: true } : {}) });
      i = close;
      continue;
    }
    if (ch === '}' || ch === '|') throw new Error(`เครื่องหมาย ${ch} เกิน: ${src}`);
    push({ text: ch, ...(inTarget ? { target: true } : {}) });
  }
  if (inTarget) throw new Error(`ไม่มี ] ปิด: ${src}`);
  if (targets > 1) throw new Error(`ทำเครื่องหมาย [ ] ได้จุดเดียว: ${src}`);
  return { chunks: chunks.filter((c) => c.length), targetSrc };
}

/** markup สั้นๆ ที่ไม่มีช่องว่าง/วงเล็บเหลี่ยม เช่นตัวเลือก '{行|い}きました' */
export function parseInline(src: string): Seg[] {
  return parseChunks(src).chunks.flat();
}

export function parseSentence(src: string): Sentence {
  const { chunks, targetSrc } = parseChunks(src);
  // เครื่องหมายท้ายประโยค: ตัดออกจากชิ้นสุดท้าย
  let end = '';
  const lastChunk = chunks[chunks.length - 1];
  const lastSeg = lastChunk?.[lastChunk.length - 1];
  if (lastSeg && !lastSeg.ruby) {
    const m = lastSeg.text.match(END);
    if (m) {
      end = m[0];
      lastSeg.text = lastSeg.text.slice(0, -end.length);
      if (!lastSeg.text) lastChunk!.pop();
      if (!lastChunk!.length) chunks.pop();
    }
  }
  const segs = chunks.flat();
  return {
    src,
    chunks,
    end,
    segs,
    plain: plainOf(segs),
    kana: kanaOf(segs),
    target: plainOf(segs.filter((s) => s.target)),
    targetSrc,
  };
}
