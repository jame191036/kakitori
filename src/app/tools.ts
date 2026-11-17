import { ListChecks, PenLine, Printer, RotateCcw, type LucideIcon } from 'lucide-react';

/** เครื่องมือในแต่ละชุดตัวอักษร (ปุ่มในการ์ดหน้าตัวอักษร และการ์ดในหน้าชุดตัวอักษร) */
export interface Tool {
  /** ส่วนท้ายของ URL ต่อจาก /kana/:script/ */
  path: 'practice' | 'quiz' | 'review' | 'worksheet';
  label: string;
  desc: string;
  icon: LucideIcon;
}

export const TOOLS: readonly Tool[] = [
  { path: 'practice', label: 'คัดตัวอักษร', desc: 'ดูลำดับขีด เขียนทับ ตรวจทีละขีด และเขียนอิสระ', icon: PenLine },
  { path: 'quiz', label: 'แบบทดสอบ', desc: 'เลือกคำอ่าน เลือกตัวอักษร ฟังเสียง และเขียนตอบ', icon: ListChecks },
  { path: 'review', label: 'ทบทวน', desc: 'ทบทวนตัวที่ถึงรอบและตัวที่ผิดบ่อย สำรองความคืบหน้าเป็นไฟล์', icon: RotateCcw },
  { path: 'worksheet', label: 'พิมพ์แบบฝึก', desc: 'สร้างกระดาษคัดลายมือ A4 สำหรับเขียนด้วยมือ', icon: Printer },
];
