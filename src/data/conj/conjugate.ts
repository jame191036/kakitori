import type { ConjVerb, VerbForm } from './types';

/**
 * ผันคำกริยาจากกฎ (ไม่มีรูปผันที่พิมพ์เองทีละคำ) — ทุกรูปเป็นคานะ
 * มีเทสต์ตรวจทุกคำทุกรูป และเคยเทียบกับตัวผันอิสระ (kamiya-codec) ตรงกันทุกคำ
 */

/** แถวคานะของตัวท้ายกลุ่ม 1: [a, i, u, e, o] */
const COLUMN: Readonly<Record<string, string>> = {
  う: 'わいうえお', // เสียง a ของแถว う คือ わ (かう → かわない)
  く: 'かきくけこ',
  ぐ: 'がぎぐげご',
  す: 'さしすせそ',
  つ: 'たちつてと',
  ぬ: 'なにぬねの',
  ぶ: 'ばびぶべぼ',
  む: 'まみむめも',
  る: 'らりるれろ',
};

/** ท้ายรูป て ของกลุ่ม 1 ตามตัวท้าย */
const TE_END: Readonly<Record<string, string>> = {
  う: 'って',
  つ: 'って',
  る: 'って',
  む: 'んで',
  ぶ: 'んで',
  ぬ: 'んで',
  く: 'いて',
  ぐ: 'いで',
  す: 'して',
};

/** ท้ายของรูปที่ต่อจากรูป ます */
export const POLITE_END: Readonly<Partial<Record<VerbForm, string>>> = {
  masu: 'ます',
  masen: 'ません',
  mashita: 'ました',
  masendeshita: 'ませんでした',
  masenka: 'ませんか',
  mashou: 'ましょう',
  tai: 'たい',
};

/** รูปพจนานุกรมไม่รวมคำนามหน้า する */
const body = (v: ConjVerb) => v.kana.slice(v.prefix.length);

function column(v: ConjVerb): string {
  const col = COLUMN[v.kana.at(-1)!];
  if (!col) throw new Error(`ตัวท้ายไม่ใช่คำกริยา: ${v.kana}`);
  return col;
}

/** ส่วนหน้า ます (ไม่รวมคำนามหน้า する) เช่น のむ → のみ */
export function stemOf(v: ConjVerb): string {
  const k = body(v);
  if (v.group === 3) return k === 'くる' ? 'き' : 'し';
  return k.slice(0, -1) + (v.group === 2 ? '' : column(v)[1]!);
}

/** รูป て (ไม่รวมคำนามหน้า する) */
function teOf(v: ConjVerb): string {
  const k = body(v);
  if (v.group !== 1) return `${stemOf(v)}て`;
  // いく เป็นคำเดียวที่ลงท้าย く แต่ใช้ って
  return k.slice(0, -1) + (k === 'いく' ? 'って' : TE_END[k.at(-1)!]!);
}

/** て → た · で → だ */
const toTa = (te: string) => te.slice(0, -1) + (te.endsWith('で') ? 'だ' : 'た');

export function conjugate(v: ConjVerb, form: VerbForm): string {
  const end = POLITE_END[form];
  if (end) return v.prefix + stemOf(v) + end;
  return v.prefix + (form === 'te' ? teOf(v) : toTa(teOf(v)));
}

/**
 * ขั้นของการผัน (ใช้ในเฉลย): รูปพจนานุกรม → รูปกลาง → รูปที่ถาม
 * รูปที่ต่อจาก ます ผ่านรูป ます ก่อน · รูป た ผ่านรูป て ก่อน
 */
export function stepsTo(v: ConjVerb, form: VerbForm): string[] {
  const via = viaForm(form);
  return [v.kana, ...(via ? [conjugate(v, via)] : []), conjugate(v, form)];
}

/** รูปกลางของรูปนั้น (null = ผันจากรูปพจนานุกรมตรงๆ) */
export const viaForm = (form: VerbForm): VerbForm | null =>
  form === 'ta' ? 'te' : form !== 'masu' && POLITE_END[form] ? 'masu' : null;

/** ชิ้นของข้อเรียง: คำนามหน้า する และท้ายรูปสุภาพเป็นชิ้นเดียว ที่เหลือทีละตัวคานะ */
export function tilesOf(v: ConjVerb, form: VerbForm): string[] {
  const end = POLITE_END[form];
  const rest = end ? [...stemOf(v), end] : [...conjugate(v, form).slice(v.prefix.length)];
  return [...(v.prefix ? [v.prefix] : []), ...rest];
}

/** ส่วนหน้า ます แบบที่ผู้เรียนมักผันผิด (กลุ่ม 2 ผันแบบกลุ่ม 1 · เปลี่ยนเสียงผิดแถว ฯลฯ) */
function wrongStems(v: ConjVerb): string[] {
  const k = body(v);
  if (v.group === 3) return k === 'くる' ? ['く', 'くり', 'くる', 'こ'] : ['す', 'すり', 'する', 'せ'];
  const base = k.slice(0, -1);
  if (v.group === 2) return ['り', 'る', 'い', 'ろ'].map((x) => base + x);
  const col = column(v);
  return [base, base + col[2]!, base + col[0]!, base + col[4]!];
}

/** รูป て แบบที่ผู้เรียนมักผันผิด */
function wrongTe(v: ConjVerb): string[] {
  const k = body(v);
  if (v.group === 3) return k === 'くる' ? ['くて', 'くって', 'くりて', 'こて'] : ['すて', 'すって', 'すりて', 'せて'];
  const base = k.slice(0, -1);
  if (v.group === 2) return ['って', 'りて', 'んで', 'いて'].map((x) => base + x);
  return [...['って', 'んで', 'いて', 'して', 'いで'].map((x) => base + x), `${stemOf(v)}て`, `${base}て`];
}

/**
 * ตัวเลือกผิดของรูปนั้น แยกเป็น 2 ชนิด: ผิดที่ตัวคำ (stem) และผิดที่ท้ายรูป (ending)
 * — ไม่มีตัวที่ซ้ำกับคำตอบ
 */
export function wrongForms(v: ConjVerb, form: VerbForm): { stem: string[]; ending: string[] } {
  const right = conjugate(v, form);
  const clean = (list: string[]) => [...new Set(list.map((x) => v.prefix + x))].filter((x) => x !== right);
  const end = POLITE_END[form];
  if (end) {
    return {
      stem: clean(wrongStems(v).map((s) => s + end)),
      ending: clean(
        Object.values(POLITE_END)
          .filter((e) => e !== end)
          .map((e) => stemOf(v) + e),
      ),
    };
  }
  const te = wrongTe(v);
  // สลับขีด て/で (のんて · かいで) และสลับ て กับ た เป็นที่ผิดบ่อยเหมือนกัน
  const own = teOf(v);
  const flipped = own.slice(0, -1) + (own.endsWith('で') ? 'て' : 'で');
  if (form === 'te') return { stem: clean([...te, flipped]), ending: clean([toTa(own), flipped]) };
  return { stem: clean([...te, flipped].map(toTa)), ending: clean([own, toTa(flipped), `${stemOf(v)}た`]) };
}
