/**
 * เครื่องมือเรื่อง "วัน" ตามเวลาท้องถิ่นของผู้ใช้
 * ใช้นับวันฝึกต่อเนื่องและรอบทบทวน — สนใจแค่ว่าเป็นวันไหน ไม่สนชั่วโมง
 */

const MS_PER_DAY = 86_400_000;

/** เลขวัน (นับจาก 1 ม.ค. 1970) ของเวลา ts ตามปฏิทินท้องถิ่น — วันติดกันต่างกัน 1 เสมอ แม้มีการปรับเวลา */
export function dayNumber(ts: number): number {
  const d = new Date(ts);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" ตามปฏิทินท้องถิ่น */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** แปลง "YYYY-MM-DD" เป็นเลขวัน (null ถ้ารูปแบบไม่ถูก) */
export function dayNumberFromKey(key: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return Math.round(Date.UTC(y, mo - 1, d) / MS_PER_DAY);
}

/** ข้อความบอกระยะห่างเป็นวัน เช่น "วันนี้", "พรุ่งนี้", "อีก 3 วัน" */
export function daysFromNowLabel(days: number): string {
  if (days <= 0) return 'วันนี้';
  if (days === 1) return 'พรุ่งนี้';
  return `อีก ${days} วัน`;
}
