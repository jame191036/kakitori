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
  yoon: 'ตัวควบ',
};

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
    case 'yoon':
      return 'ตัวอักษรรวมกับตัวเล็ก ゃ ゅ ょ เป็นเสียงควบ';
  }
}

export function groupLabel(group: CharGroup): string {
  return `แถว ${group.head}`;
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
