import { LEVELS, type Level } from '../../data/scripts';
import type { CharEntry, CharGroup, GroupKind, ScriptPack } from '../../data/types';
import type { ProgressData, ScriptProgress } from './progressLogic';

/**
 * ลำดับการเรียนที่แนะนำ (ปุ่ม "เรียนต่อ") — เรียงตามระดับก่อน แล้วตามชุด:
 *   ฮิรางานะ ระดับ 1 → คาตาคานะ ระดับ 1 → ฮิรางานะ ระดับ 2 → คาตาคานะ ระดับ 2
 * (ระดับ 1 = ตัวพื้นฐาน/ตัวขุ่น, ระดับ 2 = ตัวเล็ก/ตัวควบ — ภายในระดับเรียงตาม scriptList และ groups)
 *
 * แถวจะ "ผ่าน" เมื่อทุกตัวในแถว:
 *   1) เคยฝึกเขียนจนจบอย่างน้อย 1 ครั้ง (practiced > 0) และ
 *   2) เคยตอบ/เขียนถูกอย่างน้อย 1 ครั้ง (correct > 0)
 * ยกเว้น: ตัวเล็ก (ไม่ออกข้อสอบ) ผ่านเมื่อเขียนครบ · ตัวควบ (ไม่ฝึกเขียน) ผ่านเมื่อตอบถูกครบ
 */

export interface RowNeeds {
  write: boolean;
  correct: boolean;
}

export function rowNeeds(kind: GroupKind | undefined): RowNeeds {
  if (kind === 'small') return { write: true, correct: false };
  if (kind === 'yoon') return { write: false, correct: true };
  return { write: true, correct: true };
}

/** ตัวนี้ผ่านเงื่อนไขของแถวแล้วหรือยัง (ใช้แสดงสถานะรายตัว) */
export function charState(
  stat: { practiced: number; correct: number } | undefined,
  needs: RowNeeds,
): 'done' | 'written' | 'todo' {
  const written = !!stat?.practiced;
  const correct = !!stat?.correct;
  if ((!needs.write || written) && (!needs.correct || correct)) return 'done';
  return written ? 'written' : 'todo';
}

export type RowStatus =
  /** ยังมีตัวที่ยังไม่เคยฝึกเขียน */
  | { kind: 'write'; next: CharEntry; remaining: number }
  /** เขียนครบแล้ว แต่ยังมีตัวที่ยังไม่เคยตอบถูก */
  | { kind: 'quiz'; remaining: number }
  | { kind: 'done' };

export interface PathStep {
  pack: ScriptPack;
  group: CharGroup;
  chars: CharEntry[];
  level: Level['id'];
}

export interface NextStep extends PathStep {
  status: Exclude<RowStatus, { kind: 'done' }>;
  /** ลำดับขั้น (เริ่มที่ 1) */
  index: number;
  doneCount: number;
  total: number;
}

export function buildPath(packs: readonly ScriptPack[]): PathStep[] {
  return LEVELS.flatMap((level) =>
    packs.flatMap((pack) =>
      pack.groups
        .filter((group) => level.kinds.includes(group.kind))
        .map((group) => ({
          pack,
          group,
          chars: pack.chars.filter((c) => c.group === group.id),
          level: level.id,
        })),
    ),
  );
}

export function rowStatus(
  chars: readonly CharEntry[],
  progress: ScriptProgress | undefined,
  needs: RowNeeds = rowNeeds(undefined),
): RowStatus {
  if (needs.write) {
    const unwritten = chars.filter((c) => !(progress?.[c.id]?.practiced ?? 0));
    if (unwritten.length) return { kind: 'write', next: unwritten[0]!, remaining: unwritten.length };
  }
  if (needs.correct) {
    const notCorrect = chars.filter((c) => !(progress?.[c.id]?.correct ?? 0));
    if (notCorrect.length) return { kind: 'quiz', remaining: notCorrect.length };
  }
  return { kind: 'done' };
}

/** ขั้นถัดไปที่ควรเรียน (null = ผ่านครบทุกแถวแล้ว) */
export function nextStep(path: readonly PathStep[], data: ProgressData): NextStep | null {
  const statuses = path.map((step) =>
    rowStatus(step.chars, data.scripts[step.pack.id], rowNeeds(step.group.kind)),
  );
  const i = statuses.findIndex((s) => s.kind !== 'done');
  const status = statuses[i];
  if (!status || status.kind === 'done') return null;
  return {
    ...path[i]!,
    status,
    index: i + 1,
    doneCount: statuses.filter((s) => s.kind === 'done').length,
    total: path.length,
  };
}

/** ลิงก์ของขั้นนั้น: ไปฝึกเขียนตัวที่ยังไม่ได้เขียน หรือไปทดสอบเฉพาะแถว */
export function stepHref(step: NextStep): string {
  return step.status.kind === 'write'
    ? `/${step.pack.id}/practice/${step.status.next.id}`
    : `/${step.pack.id}/quiz?groups=${step.group.id}`;
}
