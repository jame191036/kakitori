import { conjFreePath, conjPath, grammarPath } from '../../app/paths';
import type { Form } from '../../data/conj/types';

/**
 * ลิงก์ระหว่างบทไวยากรณ์ (สอนรูป) กับบทผันคำ (ฝึกรูปนั้นหลายๆ คำ)
 * เลขและชื่อบทเขียนไว้ที่นี่ เพื่อไม่ให้หน้าบทของสายหนึ่งต้องโหลดข้อมูลของอีกสาย — มีเทสต์ตรวจว่าตรงกับข้อมูลจริง
 */

export interface RelatedLink {
  href: string;
  /** เลขสถานี (ไม่มี = ฝึกอิสระ) */
  code?: string;
  title: string;
}

type LessonLabel = readonly [code: string, title: string];

export const CONJ_LABELS: Record<string, LessonLabel> = {
  'c-groups': ['C01', 'กลุ่ม 1 · 2 · 3'],
  'c-masu-23': ['C03', 'ます ของกลุ่ม 2 และ 3'],
  'c-masu-1': ['C04', 'ます ของกลุ่ม 1'],
  'c-masen': ['C05', 'ไม่… · …แล้ว · ไม่ได้…'],
  'c-masenka': ['C06', 'ชวน · …กันเถอะ · อยาก…'],
  'c-te-23': ['C07', 'รูป て ของกลุ่ม 2, 3 และคำลงท้าย す'],
  'c-te-tte': ['C08', 'う・つ・る → って'],
  'c-te-nde': ['C09', 'む・ぶ・ぬ → んで'],
  'c-te-ite': ['C10', 'く → いて · ぐ → いで'],
  'c-ta': ['C11', 'เปลี่ยน て เป็น た'],
  'c-nai-23': ['C12', 'ない ของกลุ่ม 2 และ 3'],
  'c-nai-1': ['C13', 'ない ของกลุ่ม 1'],
  'c-nakereba': ['C14', 'ต้อง… · ไม่ต้อง… · อย่า…'],
  'c-jisho-masu': ['C15', 'ます → คำเดิม'],
  'c-jisho-te': ['C16', 'て · ない → คำเดิม'],
  'c-i-kunai': ['C17', 'ไม่… · อดีต'],
  'c-i-kute': ['C18', 'เชื่อม · กลายเป็น · อดีตสุภาพ'],
  'c-i-ii': ['C19', 'いい ผันไม่เหมือนคำอื่น'],
  'c-na-desu': ['C20', 'ไม่… · อดีต (สุภาพ)'],
  'c-na-na': ['C22', 'な · で · に และคำหลอก'],
};

export const GRAMMAR_LABELS: Record<string, LessonLabel> = {
  'g-masu': ['G07', 'คำกริยา ます'],
  'g-sasou': ['G10', 'ชวนกัน'],
  'g-hoshii': ['G11', 'อยากได้ อยากทำ'],
  'g-ni-iku': ['G12', 'ไปเพื่อ… · ขอ…'],
  'g-i-adj': ['G13', 'คำคุณศัพท์ い'],
  'g-na-adj': ['G14', 'คำคุณศัพท์ な'],
  'g-adj-use': ['G15', 'ใช้คำคุณศัพท์'],
  'g-te': ['G19', 'รูป て'],
  'g-te-iru': ['G20', 'กำลัง… · สภาพ'],
  'g-te-mo': ['G21', 'อนุญาตและห้าม'],
  'g-te-kara': ['G22', 'ทำต่อเนื่อง'],
  'g-nai': ['G23', 'รูป ない'],
  'g-must': ['G24', 'ต้อง · ไม่ต้อง'],
  'g-jisho': ['G25', 'รูปพจนานุกรม'],
  'g-ta': ['G26', 'รูป た'],
  'g-naru': ['G27', 'กลายเป็น · ตอน…'],
};

interface FormLink {
  /** บทผันคำที่ฝึกรูปนี้ (ใช้ทั้งไปและกลับ) */
  conj: readonly string[];
  /** บทที่เอารูปที่สอนแล้วไปใช้ต่อ: หน้าไวยากรณ์แสดงฝึกอิสระของรูปนี้แทนรายชื่อบทเดิม */
  free?: { forms: readonly Form[]; title: string };
}

const TE = ['c-te-23', 'c-te-tte', 'c-te-nde', 'c-te-ite'];
const TE_FREE = { forms: ['te'], title: 'ฝึกอิสระเฉพาะรูป て' } as const;

/** บทไวยากรณ์ → บทผันคำ (ผู้ใช้เลือก 2026-11-25 · บทที่ไม่ได้สอนการผันไม่มีลิงก์) */
export const FORM_LINKS: Record<string, FormLink> = {
  'g-masu': { conj: ['c-groups', 'c-masu-23', 'c-masu-1', 'c-masen'] },
  'g-sasou': { conj: ['c-masenka'] },
  'g-hoshii': { conj: ['c-masenka'] },
  'g-ni-iku': { conj: ['c-masu-23', 'c-masu-1'] },
  'g-i-adj': { conj: ['c-i-kunai', 'c-i-kute', 'c-i-ii'] },
  'g-na-adj': { conj: ['c-na-desu'] },
  'g-adj-use': { conj: ['c-na-na'] },
  'g-te': { conj: ['c-groups', ...TE] },
  'g-te-iru': { conj: TE, free: TE_FREE },
  'g-te-mo': { conj: TE, free: TE_FREE },
  'g-te-kara': { conj: TE, free: TE_FREE },
  'g-nai': { conj: ['c-nai-23', 'c-nai-1', 'c-nakereba'] },
  'g-must': { conj: ['c-nakereba'] },
  'g-jisho': { conj: ['c-jisho-masu', 'c-jisho-te'] },
  'g-ta': { conj: ['c-ta'] },
  'g-naru': { conj: ['c-i-kute', 'c-na-na'] },
};

const toLink = (id: string, [code, title]: LessonLabel, path: (id: string) => string): RelatedLink => ({
  href: path(id),
  code,
  title,
});

/** หน้าบทไวยากรณ์: "ฝึกผันเพิ่ม" */
export function conjLinksFor(grammarLessonId: string): RelatedLink[] {
  const link = FORM_LINKS[grammarLessonId];
  if (!link) return [];
  if (link.free) return [{ href: conjFreePath(link.free.forms), title: link.free.title }];
  return link.conj.map((id) => toLink(id, CONJ_LABELS[id]!, conjPath));
}

/** หน้าบทผันคำ: "ดูวิธีใช้ในประโยค" */
export function grammarLinksFor(conjLessonId: string): RelatedLink[] {
  return Object.entries(FORM_LINKS)
    .filter(([, link]) => link.conj.includes(conjLessonId))
    .map(([id]) => toLink(id, GRAMMAR_LABELS[id]!, grammarPath));
}
