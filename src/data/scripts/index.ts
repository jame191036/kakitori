import type { CharEntry, CharGroup, GroupKind, ScriptId, ScriptPack } from '../types';
import { hiragana } from './hiragana';
import { katakana } from './katakana';

/**
 * ทะเบียนชุดตัวอักษรทั้งหมดของเว็บ (ลำดับที่นี่ = ลำดับในเมนู)
 * เพิ่มชุดใหม่ได้ที่นี่ — เมนูและหน้าทั้งหมดจะใช้งานได้ทันที
 */
export const scripts: Record<ScriptId, ScriptPack> = {
  hiragana,
  katakana,
};

export const scriptList: readonly ScriptPack[] = Object.values(scripts);

export function getScript(id: string | undefined): ScriptPack | undefined {
  return id && id in scripts ? scripts[id as ScriptId] : undefined;
}

export const GROUP_KIND_LABEL: Record<GroupKind, string> = {
  basic: 'ตัวพื้นฐาน',
  dakuten: 'ตัวขุ่น ゛',
  handakuten: 'ตัวครึ่งขุ่น ゜',
  small: 'ตัวเล็ก',
  yoon: 'ตัวควบ',
};

/**
 * ระดับการเรียนในแต่ละชุด — ตาราง แบบทดสอบ และใบพิมพ์มีแท็บเลือกระดับ
 * เส้นทาง "เรียนต่อ" เรียนระดับ 1 ของทุกชุดก่อน แล้วจึงระดับ 2
 */
export interface Level {
  id: 1 | 2;
  /** ชื่อเต็ม เช่น 'ตัวเล็กและตัวควบ' */
  name: string;
  /** ชื่อสั้นสำหรับแท็บที่แคบ */
  short: string;
  kinds: readonly GroupKind[];
}

export const LEVELS: readonly Level[] = [
  { id: 1, name: 'ตัวพื้นฐาน', short: 'พื้นฐาน', kinds: ['basic', 'dakuten', 'handakuten'] },
  { id: 2, name: 'ตัวเล็กและตัวควบ', short: 'ตัวเล็ก · ตัวควบ', kinds: ['small', 'yoon'] },
];

export function levelOfKind(kind: GroupKind): Level['id'] {
  return LEVELS.find((l) => l.kinds.includes(kind))?.id ?? 1;
}

/** ระดับของตัวอักษรนี้ */
export function levelOf(pack: ScriptPack, entry: CharEntry): Level['id'] {
  const group = pack.groups.find((g) => g.id === entry.group);
  return group ? levelOfKind(group.kind) : 1;
}

/** ระดับที่ชุดนี้มี (ชุดที่ไม่มีตัวเล็ก/ตัวควบจะมีระดับเดียว → ไม่ต้องแสดงแท็บ) */
export function levelsOf(pack: ScriptPack): Level[] {
  return LEVELS.filter((l) => pack.groups.some((g) => l.kinds.includes(g.kind)));
}

/** ชื่อหมวดของชุดนี้ (คาตาคานะมี ー อยู่ในหมวดตัวเล็กด้วย) */
export function groupKindLabel(kind: GroupKind, pack: ScriptPack): string {
  return kind === 'small' && findChar(pack, 'long') ? 'ตัวเล็กและขีดเสียงยาว ー' : GROUP_KIND_LABEL[kind];
}

/** คำอธิบายสั้นๆ ของแต่ละหมวด สำหรับมือใหม่ (ยกตัวอย่างจากชุดตัวอักษรนั้นเอง) */
export function groupKindDescription(kind: GroupKind, pack: ScriptPack): string {
  const c = (id: string) => findChar(pack, id)?.char ?? '';
  switch (kind) {
    case 'basic':
      return 'เรียงเป็นแถวตามเสียงพยัญชนะ แต่ละแถวมีสระ a i u e o (บางแถวมีไม่ครบ 5 ตัว)';
    case 'dakuten':
      return `เติมขีดเล็ก 2 ขีด ゛ ที่มุมขวาบน เสียงจะเปลี่ยน เช่น ${c('ka')} (ka) → ${c('ga')} (ga), ${c('sa')} (sa) → ${c('za')} (za)`;
    case 'handakuten':
      return `เติมวงกลมเล็ก ゜ ที่มุมขวาบน ใช้กับแถว ${c('ha')} เท่านั้น เสียงจะเปลี่ยนเป็น p เช่น ${c('ha')} (ha) → ${c('pa')} (pa)`;
    case 'small': {
      const long = findChar(pack, 'long');
      return (
        `ไม่อ่านแยกเดี่ยว ใช้ประกอบกับตัวอื่น: ${c('small-ya')} ${c('small-yu')} ${c('small-yo')} ต่อท้ายเป็นตัวควบ ` +
        `และ ${c('small-tsu')} ทำให้พยัญชนะตัวถัดไปซ้ำ` +
        (long ? ` ส่วน ${long.char} ลากเสียงสระให้ยาว` : '')
      );
    }
    case 'yoon':
      return `ตัวในคอลัมน์ i + ${c('small-ya')} ${c('small-yu')} ${c('small-yo')} ตัวเล็ก อ่านรวบเป็นพยางค์เดียว เช่น ${c('ki')} + ${c('small-ya')} = ${c('kya')} (kya) ไม่ใช่ ki-ya`;
  }
}

export function groupLabel(group: CharGroup): string {
  return group.kind === 'small' ? 'ตัวเล็ก' : `แถว ${group.head}`;
}

export function groupOf(pack: ScriptPack, entry: CharEntry): CharGroup | undefined {
  return pack.groups.find((g) => g.id === entry.group);
}

/** ตัวควบ (きゃ …): ประกอบจาก 2 ตัว ไม่มีลำดับขีดของตัวเอง จึงฝึกเขียนตรงๆ ไม่ได้ */
export const isCompound = (entry: CharEntry): boolean => !!entry.parts?.length;

/**
 * ออกข้อสอบได้ไหม — ตัวเล็กและ ー ไม่มีเสียงของตัวเอง จึงไม่ออกข้อสอบ (ฝึกเขียนอย่างเดียว)
 * ตัวควบออกข้อสอบได้ (ข้อแบบเขียนจะข้ามไปใช้แบบอื่น)
 */
export function isQuizzable(pack: ScriptPack, entry: CharEntry): boolean {
  return groupOf(pack, entry)?.kind !== 'small';
}

/** ตัวที่ออกข้อสอบได้ทั้งชุด (ใช้เป็นแหล่งตัวหลอก) */
export function quizzableChars(pack: ScriptPack): CharEntry[] {
  return pack.chars.filter((c) => isQuizzable(pack, c));
}

export function findChar(pack: ScriptPack, idOrChar: string | undefined): CharEntry | undefined {
  if (!idOrChar) return undefined;
  return pack.chars.find((c) => c.id === idOrChar || c.char === idOrChar);
}

export function charsInGroups(pack: ScriptPack, groupIds: Iterable<string>): CharEntry[] {
  const set = new Set(groupIds);
  return pack.chars.filter((c) => set.has(c.group));
}

export function charsOfGroup(pack: ScriptPack, groupId: string): CharEntry[] {
  return pack.chars.filter((c) => c.group === groupId);
}

/** โรมาจิทั้งหมดที่ถือว่าเป็นคำอ่านของตัวนี้ */
export function readingsOf(entry: CharEntry): string[] {
  return [entry.romaji, ...(entry.romajiAlt ?? [])];
}

/** สองตัวนี้อ่านเหมือนกันไหม (เช่น じ/ぢ, を/お) — ห้ามใช้เป็นตัวเลือกหลอกของกันและกัน */
export function sameReading(a: CharEntry, b: CharEntry): boolean {
  const ra = readingsOf(a);
  return readingsOf(b).some((r) => ra.includes(r));
}

/** ตัวคู่ในชุด counterpart (เช่น か → カ) */
export function counterpartOf(pack: ScriptPack, entry: CharEntry): CharEntry | undefined {
  const other = pack.counterpart ? scripts[pack.counterpart] : undefined;
  return other ? findChar(other, entry.id) : undefined;
}

/** ข้อความคำอ่านแบบเต็ม เช่น "ji (di)" */
export function romajiLabel(entry: CharEntry): string {
  return entry.romajiAlt?.length ? `${entry.romaji} (${entry.romajiAlt.join(', ')})` : entry.romaji;
}
