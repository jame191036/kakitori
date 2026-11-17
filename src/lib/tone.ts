import type { CSSProperties } from 'react';
import type { ScriptPack } from '../data/types';

/**
 * สีประจำสาย: ใส่ style={tone('hira')} + className "tone" ที่กล่องของสายนั้น
 * แล้วข้างในใช้ var(--c) (สีสาย) / var(--c-text) (ตัวหนังสือสีสาย อ่านชัดทั้งสองธีม)
 * / var(--c-soft) (พื้นอ่อนของสีสาย) — ค่าสีอยู่ใน global.css (--line-xxx)
 */
export type Tone = 'hira' | 'kata' | 'l2' | 'kana' | 'travel' | 'daily' | 'anime' | 'n5';

export function tone(t: Tone): CSSProperties {
  return { '--c': `var(--line-${t})` } as CSSProperties;
}

/** สีสายของชุดตัวอักษร */
export function packTone(pack: ScriptPack): Tone {
  return pack.id === 'katakana' ? 'kata' : 'hira';
}
