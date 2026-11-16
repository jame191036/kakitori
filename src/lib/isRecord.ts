/** เป็น object ธรรมดา (ไม่ใช่ null หรือ array) — ใช้ตรวจข้อมูลที่อ่านจาก storage/ไฟล์ */
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
