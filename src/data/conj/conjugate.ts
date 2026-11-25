import { FORM_INFO, type ConjWord, type Form } from './types';

/**
 * ผันคำจากกฎ (ไม่มีรูปผันที่พิมพ์เองทีละคำ) — ทุกรูปเป็นคานะ
 * มีเทสต์ตรวจทุกคำทุกรูป และเคยเทียบกับตัวผันอิสระ (kamiya-codec) ตรงกันทุกคำ
 */

// ───────────── คำกริยา ─────────────

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

type EndMap = Readonly<Partial<Record<Form, string>>>;

/** ท้ายของรูปที่ต่อจากรูป ます */
export const POLITE_END: EndMap = {
  masu: 'ます',
  masen: 'ません',
  mashita: 'ました',
  masendeshita: 'ませんでした',
  masenka: 'ませんか',
  mashou: 'ましょう',
  tai: 'たい',
};

/** ท้ายของรูปที่ต่อจากรูป ない */
export const NAI_END: EndMap = { nai: 'ない', nakereba: 'なければ', nakutemo: 'なくても', naide: 'ないで' };

/** ท้ายของคุณศัพท์ い (ต่อจากคำที่ตัด い แล้ว) */
const I_END: EndMap = {
  kunai: 'くない',
  katta: 'かった',
  kunakatta: 'くなかった',
  kute: 'くて',
  ku: 'く',
  kattadesu: 'かったです',
};

/** ท้ายของคุณศัพท์ な */
const NA_END: EndMap = {
  jaarimasen: 'じゃありません',
  deshita: 'でした',
  jaarimasendeshita: 'じゃありませんでした',
  janai: 'じゃない',
  datta: 'だった',
  janakatta: 'じゃなかった',
  na: 'な',
  de: 'で',
  ni: 'に',
};

/** รูปพจนานุกรมไม่รวมคำนามหน้า する */
const body = (v: ConjWord) => v.kana.slice(v.prefix.length);

function column(v: ConjWord): string {
  const col = COLUMN[v.kana.at(-1)!];
  if (!col) throw new Error(`ตัวท้ายไม่ใช่คำกริยา: ${v.kana}`);
  return col;
}

/** ส่วนหน้า ます (ไม่รวมคำนามหน้า する) เช่น のむ → のみ */
function masuStem(v: ConjWord): string {
  const k = body(v);
  if (v.group === 3) return k === 'くる' ? 'き' : 'し';
  return k.slice(0, -1) + (v.group === 2 ? '' : column(v)[1]!);
}

/** ส่วนหน้า ない เช่น のむ → のま · ある ปฏิเสธเป็น ない เฉยๆ (ส่วนหน้าว่าง) */
function naiStem(v: ConjWord): string {
  const k = body(v);
  if (k === 'ある') return '';
  if (v.group === 3) return k === 'くる' ? 'こ' : 'し';
  return k.slice(0, -1) + (v.group === 2 ? '' : column(v)[0]!);
}

/** รูป て (ไม่รวมคำนามหน้า する) */
function teOf(v: ConjWord): string {
  const k = body(v);
  if (v.group !== 1) return `${masuStem(v)}て`;
  // いく เป็นคำเดียวที่ลงท้าย く แต่ใช้ って
  return k.slice(0, -1) + (k === 'いく' ? 'って' : TE_END[k.at(-1)!]!);
}

/** て → た · で → だ */
const toTa = (te: string) => te.slice(0, -1) + (te.endsWith('で') ? 'だ' : 'た');

// ───────────── คุณศัพท์ ─────────────

/** คุณศัพท์ い ตัด い ออก (いい ผันจาก よい) */
const iBase = (v: ConjWord) => (v.kana === 'いい' ? 'よ' : v.kana.slice(0, -1));

// ───────────── ทุกชนิด ─────────────

export function conjugate(v: ConjWord, form: Form): string {
  if (FORM_INFO[form].kind !== v.kind) throw new Error(`${v.kana} ไม่มีรูป ${form}`);
  if (v.kind === 'i') return iBase(v) + I_END[form]!;
  if (v.kind === 'na') return v.kana + NA_END[form]!;
  if (POLITE_END[form]) return v.prefix + masuStem(v) + POLITE_END[form];
  if (NAI_END[form]) return v.prefix + naiStem(v) + NAI_END[form];
  return v.prefix + (form === 'te' ? teOf(v) : toTa(teOf(v)));
}

const VIA: Readonly<Partial<Record<Form, Form>>> = {
  masen: 'masu',
  mashita: 'masu',
  masendeshita: 'masu',
  masenka: 'masu',
  mashou: 'masu',
  tai: 'masu',
  ta: 'te',
  nakereba: 'nai',
  nakutemo: 'nai',
  naide: 'nai',
  kunakatta: 'kunai',
  kattadesu: 'katta',
  jaarimasendeshita: 'jaarimasen',
  janakatta: 'janai',
};

/** รูปกลางของรูปนั้น เช่น ません ผ่าน ます · た ผ่าน て (null = ผันจากรูปพจนานุกรมตรงๆ) */
export const viaForm = (form: Form): Form | null => VIA[form] ?? null;

/** ขั้นของการผัน (ใช้ในเฉลย): รูปพจนานุกรม → รูปกลาง → รูปที่ถาม */
export function stepsTo(v: ConjWord, form: Form): string[] {
  const via = viaForm(form);
  return [v.kana, ...(via ? [conjugate(v, via)] : []), conjugate(v, form)];
}

// ───────────── ชิ้นของข้อเรียง ─────────────

/** ท้ายรูปของคุณศัพท์แยกเป็นชิ้น (く + ない · じゃ + ありません) */
const ADJ_TILES: Readonly<Partial<Record<Form, readonly string[]>>> = {
  kunai: ['く', 'ない'],
  katta: ['かった'],
  kunakatta: ['く', 'なかった'],
  kute: ['く', 'て'],
  ku: ['く'],
  kattadesu: ['かった', 'です'],
  jaarimasen: ['じゃ', 'ありません'],
  deshita: ['でした'],
  jaarimasendeshita: ['じゃ', 'ありませんでした'],
  janai: ['じゃ', 'ない'],
  datta: ['だった'],
  janakatta: ['じゃ', 'なかった'],
  na: ['な'],
  de: ['で'],
  ni: ['に'],
};

/** ตัวหลอกของข้อเรียงคุณศัพท์ */
const ADJ_DECOYS: Readonly<Record<'i' | 'na', readonly string[]>> = {
  i: ['い', 'かった', 'ない', 'なかった', 'て', 'に', 'でした', 'です', 'く'],
  na: ['く', 'い', 'だ', 'な', 'に', 'で', 'かった', 'ない', 'でした', 'だった'],
};

/**
 * ชิ้นที่ถูกตามลำดับ: คำกริยา = คานะทีละตัว (คำนามหน้า する และท้ายรูปสุภาพ/รูป ない เป็นชิ้นเดียว)
 * คุณศัพท์ = ตัวคำเป็นชิ้นเดียว + ท้ายรูปเป็นชิ้นๆ
 */
export function tilesOf(v: ConjWord, form: Form): string[] {
  if (v.kind !== 'verb') return [v.kind === 'i' ? iBase(v) : v.kana, ...ADJ_TILES[form]!];
  const end = POLITE_END[form] ?? NAI_END[form];
  const all = conjugate(v, form).slice(v.prefix.length);
  // ある → ない ทั้งคำคือท้ายรูป จึงแยกทีละตัว
  const rest = end && all !== end ? [...all.slice(0, -end.length), end] : [...all];
  return [...(v.prefix ? [v.prefix] : []), ...rest];
}

/** ตัวหลอกของข้อเรียง (ไม่ซ้ำชิ้นที่ถูก) เรียงตามที่อยากใช้ก่อน — ผู้เรียกสลับลำดับเองได้ */
export function decoysOf(v: ConjWord, form: Form): { must: string[]; pool: string[] } {
  const own = tilesOf(v, form);
  const clean = (list: readonly string[]) => [...new Set(list)].filter((x) => x && !own.includes(x));
  // คุณศัพท์ い: ตัวคำที่ยังไม่ตัด い เป็นตัวหลอกเสมอ · な ที่ลงท้าย い: ตัวคำที่ตัด い
  if (v.kind === 'i') return { must: clean([v.kana]), pool: clean(ADJ_DECOYS.i) };
  if (v.kind === 'na') return { must: clean(v.kana.endsWith('い') ? [v.kana.slice(0, -1)] : []), pool: clean(ADJ_DECOYS.na) };
  const end = POLITE_END[form] ?? NAI_END[form];
  const wrong = wrongForms(v, form).stem.map((w) => w.slice(v.prefix.length));
  if (!end) return { must: [], pool: clean(wrong.flatMap((w) => [...w])) };
  return { must: [], pool: clean(wrong.map((w) => w.slice(0, -end.length).at(-1) ?? '')) };
}

/**
 * ท้ายที่ผิดของรูปที่ต่อจาก ない — คัดเอง เพราะบางท้ายพูดได้จริง
 * เช่น かわないで いいです (ไม่ต้องซื้อก็ได้ ในภาษาพูด) จึงใช้ ないで เป็นตัวหลอกของ なくても ไม่ได้
 */
const NAI_WRONG_END: Readonly<Partial<Record<Form, readonly string[]>>> = {
  nai: ['なければ', 'なくても', 'ないで'],
  nakereba: ['なくても', 'ないで', 'ない'],
  nakutemo: ['ないも', 'ないても', 'なくでも'],
  naide: ['なくて', 'ないて', 'ない'],
};

/** ท้ายรูปอื่นที่ใช้เป็นตัวหลอก */
export function otherEnds(form: Form): string[] {
  if (NAI_WRONG_END[form]) return [...NAI_WRONG_END[form]];
  return POLITE_END[form] ? Object.entries(POLITE_END).flatMap(([f, end]) => (f === form ? [] : [end])) : [];
}

/** ตัวหลอกของข้อเรียงรูปพจนานุกรม: ตัวท้ายคำกริยาอื่น */
export const DICTIONARY_ENDS = ['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'] as const;

// ───────────── ตัวเลือกผิด ─────────────

/** ส่วนหน้า ます แบบที่ผู้เรียนมักผันผิด (กลุ่ม 2 ผันแบบกลุ่ม 1 · เปลี่ยนเสียงผิดแถว ฯลฯ) */
function wrongMasu(v: ConjWord): string[] {
  const k = body(v);
  if (v.group === 3) return k === 'くる' ? ['く', 'くり', 'くる', 'こ'] : ['す', 'すり', 'する', 'せ'];
  const base = k.slice(0, -1);
  if (v.group === 2) return ['り', 'る', 'い', 'ろ'].map((x) => base + x);
  const col = column(v);
  return [base, base + col[2]!, base + col[0]!, base + col[4]!];
}

/** ส่วนหน้า ない แบบที่ผู้เรียนมักผันผิด (ไม่ใช้แถว e เพราะเป็นรูป "ทำไม่ได้" ที่มีจริง) */
function wrongNai(v: ConjWord): string[] {
  const k = body(v);
  if (k === 'ある') return ['あら', 'あ', 'あり', 'ある'];
  if (v.group === 3) return k === 'くる' ? ['く', 'くら', 'き', 'くる'] : ['す', 'すら', 'さ', 'する'];
  const base = k.slice(0, -1);
  if (v.group === 2) return ['ら', 'る', 'い', 'り'].map((x) => base + x);
  const col = column(v);
  // ท้าย う: ผิดบ่อยคือ かあない (ต้องเป็น わ)
  return k.endsWith('う') ? ['あ', 'い', 'う', ''].map((x) => base + x) : [base, base + col[1]!, base + col[2]!, base + col[4]!];
}

/** รูป て แบบที่ผู้เรียนมักผันผิด */
function wrongTe(v: ConjWord): string[] {
  const k = body(v);
  if (v.group === 3) return k === 'くる' ? ['くて', 'くって', 'くりて', 'こて'] : ['すて', 'すって', 'すりて', 'せて'];
  const base = k.slice(0, -1);
  if (v.group === 2) return ['って', 'りて', 'んで', 'いて'].map((x) => base + x);
  return [...['って', 'んで', 'いて', 'して', 'いで'].map((x) => base + x), `${masuStem(v)}て`, `${base}て`];
}

/** ท้ายที่ผิดของคุณศัพท์ い (ต่อกับคำที่ตัด い แล้ว) — ไม่ใช้ い + じゃない ซึ่งพูดได้ในความหมายอื่น */
const I_WRONG: Readonly<Partial<Record<Form, readonly string[]>>> = {
  kunai: ['いくない', 'いない', 'きない', 'けない'],
  katta: ['いかった', 'いだった', 'くだった', 'いでした'],
  kunakatta: ['いなかった', 'いくなかった', 'くないだった', 'かったない'],
  kute: ['いて', 'いくて', 'くで', 'いで'],
  ku: ['いに', 'くに', 'いく', 'に'],
  kattadesu: ['いでした', 'くでした', 'いかったです', 'かったでした'],
};

/** いい: ผันผิดโดยไม่เปลี่ยนเป็น よ */
const II_WRONG: Readonly<Partial<Record<Form, readonly string[]>>> = {
  kunai: ['いくない', 'いいくない', 'よいない', 'いいない'],
  katta: ['いかった', 'いいかった', 'よいかった', 'いいだった'],
  kunakatta: ['いくなかった', 'いいくなかった', 'いいなかった', 'よいなかった'],
  kute: ['いくて', 'いいくて', 'いいて', 'よいて'],
  ku: ['いく', 'いいく', 'よいく', 'いいに'],
};

/** ท้ายที่ผิดของคุณศัพท์ な — ไม่ใช้ตัวที่พูดได้จริง (げんきない · だったです · げんきの แบบคำนาม) */
const NA_WRONG: Readonly<Partial<Record<Form, readonly string[]>>> = {
  jaarimasen: ['くありません', 'なありません', 'だありません', 'いありません'],
  deshita: ['かったです', 'くでした', 'なでした', 'いでした'],
  jaarimasendeshita: ['くありませんでした', 'なありませんでした', 'だありませんでした', 'じゃありませんかった'],
  janai: ['くない', 'なない', 'だない', 'いくない'],
  datta: ['かった', 'くだった', 'なだった', 'いだった'],
  janakatta: ['くなかった', 'ななかった', 'だなかった', 'じゃないだった'],
  na: ['い', 'だ', 'く', 'だな'],
  de: ['くて', 'て', 'なで', 'だで'],
  ni: ['く', 'くに', 'なに', 'だに'],
};

/** รูปที่สลับกันผิดได้โดยไม่กำกวม (รูปสุภาพกับรูปกันเองไม่ปนกัน · く ใช้เชื่อมแทน くて ในภาษาเขียนได้ จึงไม่ปนกัน) */
const ADJ_FAMILIES: readonly (readonly Form[])[] = [
  ['kunai', 'katta', 'kunakatta'],
  ['jaarimasen', 'deshita', 'jaarimasendeshita'],
  ['janai', 'datta', 'janakatta'],
  ['na', 'de', 'ni'],
];

/**
 * ตัวเลือกผิดของรูปนั้น แยกเป็น 2 ชนิด: ผิดที่ตัวคำ/วิธีผัน (stem) และเป็นรูปอื่นของคำเดียวกัน (ending)
 * — ไม่มีตัวที่ซ้ำกับคำตอบ
 */
export function wrongForms(v: ConjWord, form: Form): { stem: string[]; ending: string[] } {
  const right = conjugate(v, form);
  const clean = (list: readonly string[]) => [...new Set(list)].filter((x) => x !== right);
  if (v.kind !== 'verb') {
    const others = (ADJ_FAMILIES.find((f) => f.includes(form)) ?? []).filter((f) => f !== form).map((f) => conjugate(v, f));
    if (v.kind === 'i') {
      const own = v.kana === 'いい' ? II_WRONG[form]! : I_WRONG[form]!.map((x) => iBase(v) + x);
      return { stem: clean(own), ending: clean(others) };
    }
    const own = NA_WRONG[form]!.map((x) => v.kana + x);
    // な ที่ลงท้าย い: ผันแบบคุณศัพท์ い เป็นที่ผิดบ่อยที่สุด (きれくない)
    const likeI = v.kana.endsWith('い') && !['na', 'ni'].includes(form) ? [v.kana.slice(0, -1) + NA_WRONG[form]![0]!] : [];
    return { stem: clean([...likeI, ...own]), ending: clean(others) };
  }
  const pre = (list: readonly string[]) => clean(list.map((x) => v.prefix + x));
  const end = POLITE_END[form] ?? NAI_END[form];
  if (end) {
    const polite = !!POLITE_END[form];
    const stem = polite ? masuStem(v) : naiStem(v);
    return {
      stem: pre((polite ? wrongMasu(v) : wrongNai(v)).map((s) => s + end)),
      ending: pre(otherEnds(form).map((e) => stem + e)),
    };
  }
  const te = wrongTe(v);
  // สลับขีด て/で (のんて · かいで) และสลับ て กับ た เป็นที่ผิดบ่อยเหมือนกัน
  const own = teOf(v);
  const flipped = own.slice(0, -1) + (own.endsWith('で') ? 'て' : 'で');
  if (form === 'te') return { stem: pre([...te, flipped]), ending: pre([toTa(own), flipped]) };
  return { stem: pre([...te, flipped].map(toTa)), ending: pre([own, toTa(flipped), `${masuStem(v)}た`]) };
}
