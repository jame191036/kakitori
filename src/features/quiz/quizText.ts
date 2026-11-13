import { findChar, getScript } from '../../data/scripts';
import type { ScriptPack } from '../../data/types';
import type { QuestionType } from '../settings/settings';

/** ตัวอย่างตัวอักษรของชุด (ใช้ 'ka' ถ้ามี) */
const sample = (pack: ScriptPack) => (findChar(pack, 'ka') ?? pack.chars[0]!).char;

/** ชื่อและตัวอย่างของรูปแบบคำถาม (ข้อความเปลี่ยนตามชุดตัวอักษร) */
export function questionTypeInfo(type: QuestionType, pack: ScriptPack): { label: string; example: string } {
  const c = sample(pack);
  switch (type) {
    case 'charToReading':
      return { label: 'ดูตัวอักษร → เลือกคำอ่าน', example: `${c} → ka` };
    case 'readingToChar':
      return { label: 'ดูคำอ่าน → เลือกตัวอักษร', example: `ka → ${c}` };
    case 'audioToChar':
      return { label: 'ฟังเสียง → เลือกตัวอักษร', example: `🔊 → ${c}` };
    case 'readingToWrite':
      return { label: 'ดูคำอ่าน → เขียนตัวอักษร', example: 'ka → ✍️' };
    case 'pairToChar': {
      const other = getScript(pack.counterpart);
      return other
        ? { label: `ดู${other.name} → เลือก${pack.name}`, example: `${sample(other)} → ${c}` }
        : { label: 'จับคู่ตัวอักษร', example: '' };
    }
  }
}

/** รูปแบบคำถามนี้ใช้ได้กับชุดนี้บนเครื่องนี้ไหม */
export function isTypeAvailable(type: QuestionType, pack: ScriptPack, audioOk: boolean): boolean {
  if (type === 'audioToChar') return audioOk;
  if (type === 'pairToChar') return !!pack.counterpart;
  return true;
}
