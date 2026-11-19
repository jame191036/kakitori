import { groupLabel, LEVELS, type Level } from '../../data/scripts';
import type { CharEntry, CharGroup, ScriptPack } from '../../data/types';
import { rowNeeds, rowStatus, type NextStep } from './learningPath';
import type { ProgressData } from './progressLogic';

/**
 * ภาพ "รถไฟ" ของเส้นทางเรียน
 * - สาย (線) = ชุดตัวอักษร 1 ชุด: ระดับ 1 ก่อน แล้วต่อระดับ 2 ในสายเดียวกัน
 * - สถานี (駅) = แถวตัวอักษร 1 แถว · เลขสถานีแบบป้ายรถไฟญี่ปุ่น เช่น H03 (H = Hiragana)
 * - สถานีที่ "ผ่าน" ใช้เงื่อนไขเดียวกับปุ่มเรียนต่อ (learningPath.rowStatus)
 */
export interface Station {
  pack: ScriptPack;
  group: CharGroup;
  chars: CharEntry[];
  level: Level['id'];
  /** ลำดับในสาย เริ่มที่ 1 */
  no: number;
  /** เลขสถานี เช่น 'H03' */
  code: string;
}

export type StationState = 'done' | 'current' | 'todo';

/** อักษรนำหน้าเลขสถานี: ตัวแรกของชื่อภาษาอังกฤษ (Hiragana → H, Katakana → K) */
export function lineLetter(pack: ScriptPack): string {
  return pack.nameEn.charAt(0).toUpperCase();
}

/** ทุกสถานีของสาย (ชุดตัวอักษร) เรียงตามเส้นทาง: ระดับ 1 แล้วระดับ 2 */
export function packStations(pack: ScriptPack): Station[] {
  const letter = lineLetter(pack);
  return LEVELS.flatMap((level) =>
    pack.groups.filter((g) => level.kinds.includes(g.kind)).map((group) => ({ group, level: level.id })),
  ).map(({ group, level }, i) => ({
    pack,
    group,
    level,
    chars: pack.chars.filter((c) => c.group === group.id),
    no: i + 1,
    code: `${letter}${String(i + 1).padStart(2, '0')}`,
  }));
}

export function stationDone(station: Station, data: ProgressData): boolean {
  return (
    rowStatus(station.chars, data.scripts[station.pack.id], rowNeeds(station.group.kind)).kind === 'done'
  );
}

/** สถานะของแต่ละสถานี — "current" มีได้ที่เดียว คือขั้นถัดไปของเส้นทางเรียนต่อ (ถ้าอยู่ในสายนี้) */
export function stationStates(
  stations: readonly Station[],
  data: ProgressData,
  next: NextStep | null,
): StationState[] {
  return stations.map((st) => {
    if (next && next.pack.id === st.pack.id && next.group.id === st.group.id) return 'current';
    return stationDone(st, data) ? 'done' : 'todo';
  });
}

/** สถานีแรกที่ยังไม่ผ่านของสายนี้ (null = ผ่านครบทั้งสาย) */
export function nextStationOf(stations: readonly Station[], data: ProgressData): Station | null {
  return stations.find((st) => !stationDone(st, data)) ?? null;
}

/** ชื่อสถานีบนป้าย: แถวปกติ = ตัวแรกของแถว · ตัวเล็ก = ตัวแรก (ゃ) */
export function stationName(group: CharGroup): string {
  return group.kind === 'small' ? [...group.head][0]! : group.head;
}

/** บรรทัดรองใต้ชื่อสถานี: โรมาจิของแถว (ตัวเล็กไม่มีโรมาจิของแถว) */
export function stationReading(group: CharGroup): string {
  return group.kind === 'small' ? 'ตัวเล็ก' : group.romaji;
}

/**
 * จุดจอดบนแผนที่สาย/สมุดตรา — ใช้ได้ทั้งแถวตัวอักษรและบทคำศัพท์
 * name = ชื่อสถานีภาษาญี่ปุ่น (ตัวใหญ่) · reading = บรรทัดรอง · label = ข้อความสำหรับโปรแกรมอ่านหน้าจอ
 */
export interface RouteStop {
  code: string;
  name: string;
  reading: string;
  label: string;
  /** ใส่เมื่อกดสถานีแล้วไปฝึกได้ */
  href?: string;
}

export function stationStop(st: Station, href?: string): RouteStop {
  return {
    code: st.code,
    name: stationName(st.group),
    reading: stationReading(st.group),
    label: `${st.code} ${groupLabel(st.group)}`,
    href,
  };
}
