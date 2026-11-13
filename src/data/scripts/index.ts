import type { CharEntry, CharGroup, GroupKind, ScriptId, ScriptPack } from '../types';
import { hiragana } from './hiragana';

/**
 * ทะเบียนชุดตัวอักษรทั้งหมดของเว็บ
 * เพิ่มชุดใหม่ (เช่น katakana) ได้ที่นี่ — เมนูและหน้าทั้งหมดจะใช้งานได้ทันที
 */
export const scripts: Record<ScriptId, ScriptPack> = {
  hiragana,
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

/** ข้อความคำอ่านแบบเต็ม เช่น "ji (di)" */
export function romajiLabel(entry: CharEntry): string {
  return entry.romajiAlt?.length ? `${entry.romaji} (${entry.romajiAlt.join(', ')})` : entry.romaji;
}
