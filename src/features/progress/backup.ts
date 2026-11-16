import { dayKey } from '../../lib/day';
import { isRecord } from '../../lib/isRecord';
import { sanitizeActivity, type ActivityData } from './activity';
import { sanitizeProgress, type ProgressData } from './progressLogic';

/**
 * ไฟล์สำรองความคืบหน้า (JSON) — ใช้แทนการซิงก์ เพราะเว็บไม่มี database
 * มีทั้งความคืบหน้ารายตัวอักษร (ทุกชุด) และกิจกรรมรายวัน ไม่มีการตั้งค่าของเครื่อง (เช่นธีม)
 */

/** ค่าคงที่ — ห้ามเปลี่ยนแม้เปลี่ยนชื่อเว็บ ไม่อย่างนั้นไฟล์สำรองเก่าจะนำเข้าไม่ได้ */
const BACKUP_APP = 'kakitori';
const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  kind: 'backup';
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  progress: ProgressData;
  activity: ActivityData;
}

export function makeBackup(progress: ProgressData, activity: ActivityData, now: number): BackupFile {
  return {
    app: BACKUP_APP,
    kind: 'backup',
    version: BACKUP_VERSION,
    exportedAt: new Date(now).toISOString(),
    progress,
    activity,
  };
}

export const backupFileName = (now: number) => `kakitori-backup-${dayKey(now)}.json`;

/** อ่านไฟล์สำรอง — คืน null ถ้าไม่ใช่ไฟล์สำรองของเว็บนี้หรือไฟล์เสีย */
export function parseBackup(text: string): { progress: ProgressData; activity: ActivityData } | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP || raw.kind !== 'backup') return null;
  if (raw.version !== BACKUP_VERSION) return null;
  return { progress: sanitizeProgress(raw.progress), activity: sanitizeActivity(raw.activity) };
}
