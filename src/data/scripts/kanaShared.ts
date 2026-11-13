import type { CharEntry, CharGroup, ExampleWord, GroupKind } from '../types';

/**
 * ส่วนที่ฮิรางานะและคาตาคานะใช้ร่วมกัน: เสียง โรมาจิ คำอ่านไทย และตำแหน่งในตาราง
 * (ทั้งสองชุดมี 71 ตัวเรียงลำดับเดียวกัน และใช้ id เดียวกัน เช่น 'ka' = か / カ
 *  จึงจับคู่ข้ามชุดได้ด้วย id — ใช้ในข้อสอบแบบจับคู่)
 */

interface KanaSound {
  id: string;
  romaji: string;
  thai: string;
  group: string;
  col: number;
  romajiAlt?: readonly string[];
  /** id ของตัวต้นแบบ (สำหรับตัวขุ่น/ครึ่งขุ่น) */
  baseId?: string;
}

const GROUPS: [id: string, kind: GroupKind][] = [
  ['a', 'basic'],
  ['ka', 'basic'],
  ['sa', 'basic'],
  ['ta', 'basic'],
  ['na', 'basic'],
  ['ha', 'basic'],
  ['ma', 'basic'],
  ['ya', 'basic'],
  ['ra', 'basic'],
  ['wa', 'basic'],
  ['n', 'basic'],
  ['ga', 'dakuten'],
  ['za', 'dakuten'],
  ['da', 'dakuten'],
  ['ba', 'dakuten'],
  ['pa', 'handakuten'],
];

/** แถวพื้นฐาน: [id, โรมาจิ, คำอ่านไทย] เรียงตามคอลัมน์ a i u e o */
function row(group: string, items: [string, string, string][], cols = [0, 1, 2, 3, 4]): KanaSound[] {
  return items.map(([id, romaji, thai], i) => ({ id, romaji, thai, group, col: cols[i]! }));
}

/** แถวตัวขุ่น/ครึ่งขุ่น: [id, โรมาจิ, คำอ่านไทย, id ตัวต้นแบบ, โรมาจิแบบอื่น?] */
function voiced(group: string, items: [string, string, string, string, string?][]): KanaSound[] {
  return items.map(([id, romaji, thai, baseId, alt], col) => ({
    id,
    romaji,
    thai,
    group,
    col,
    baseId,
    ...(alt ? { romajiAlt: [alt] } : {}),
  }));
}

export const KANA_SOUNDS: readonly KanaSound[] = [
  ...row('a', [['a', 'a', 'อะ'], ['i', 'i', 'อิ'], ['u', 'u', 'อุ'], ['e', 'e', 'เอะ'], ['o', 'o', 'โอะ']]),
  ...row('ka', [['ka', 'ka', 'คะ'], ['ki', 'ki', 'คิ'], ['ku', 'ku', 'คุ'], ['ke', 'ke', 'เคะ'], ['ko', 'ko', 'โคะ']]),
  ...row('sa', [['sa', 'sa', 'ซะ'], ['shi', 'shi', 'ชิ'], ['su', 'su', 'ซุ'], ['se', 'se', 'เซะ'], ['so', 'so', 'โซะ']]),
  ...row('ta', [['ta', 'ta', 'ทะ'], ['chi', 'chi', 'จิ'], ['tsu', 'tsu', 'ทสึ'], ['te', 'te', 'เทะ'], ['to', 'to', 'โทะ']]),
  ...row('na', [['na', 'na', 'นะ'], ['ni', 'ni', 'นิ'], ['nu', 'nu', 'นุ'], ['ne', 'ne', 'เนะ'], ['no', 'no', 'โนะ']]),
  ...row('ha', [['ha', 'ha', 'ฮะ'], ['hi', 'hi', 'ฮิ'], ['fu', 'fu', 'ฟุ'], ['he', 'he', 'เฮะ'], ['ho', 'ho', 'โฮะ']]),
  ...row('ma', [['ma', 'ma', 'มะ'], ['mi', 'mi', 'มิ'], ['mu', 'mu', 'มุ'], ['me', 'me', 'เมะ'], ['mo', 'mo', 'โมะ']]),
  ...row('ya', [['ya', 'ya', 'ยะ'], ['yu', 'yu', 'ยุ'], ['yo', 'yo', 'โยะ']], [0, 2, 4]),
  ...row('ra', [['ra', 'ra', 'ระ'], ['ri', 'ri', 'ริ'], ['ru', 'ru', 'รุ'], ['re', 're', 'เระ'], ['ro', 'ro', 'โระ']]),
  ...row('wa', [['wa', 'wa', 'วะ'], ['wo', 'wo', 'โอะ']], [0, 4]).map((s) =>
    s.id === 'wo' ? { ...s, romajiAlt: ['o'] } : s,
  ),
  ...row('n', [['n', 'n', 'อึน']]),
  ...voiced('ga', [['ga', 'ga', 'กะ', 'ka'], ['gi', 'gi', 'กิ', 'ki'], ['gu', 'gu', 'กุ', 'ku'], ['ge', 'ge', 'เกะ', 'ke'], ['go', 'go', 'โกะ', 'ko']]),
  ...voiced('za', [['za', 'za', 'ซะ', 'sa'], ['ji', 'ji', 'จิ', 'shi'], ['zu', 'zu', 'ซุ', 'su'], ['ze', 'ze', 'เซะ', 'se'], ['zo', 'zo', 'โซะ', 'so']]),
  ...voiced('da', [['da', 'da', 'ดะ', 'ta'], ['di', 'ji', 'จิ', 'chi', 'di'], ['du', 'zu', 'ซุ', 'tsu', 'du'], ['de', 'de', 'เดะ', 'te'], ['do', 'do', 'โดะ', 'to']]),
  ...voiced('ba', [['ba', 'ba', 'บะ', 'ha'], ['bi', 'bi', 'บิ', 'hi'], ['bu', 'bu', 'บุ', 'fu'], ['be', 'be', 'เบะ', 'he'], ['bo', 'bo', 'โบะ', 'ho']]),
  ...voiced('pa', [['pa', 'pa', 'ปะ', 'ha'], ['pi', 'pi', 'ปิ', 'hi'], ['pu', 'pu', 'ปุ', 'fu'], ['pe', 'pe', 'เปะ', 'he'], ['po', 'po', 'โปะ', 'ho']]),
];

/**
 * สร้างกลุ่ม (แถว) จากตัวแรกของแต่ละแถว
 * @param heads ตัวแรกของ 16 แถวตามลำดับ เช่น 'あかさたなはまやらわんがざだばぱ'
 */
export function kanaGroups(heads: string): CharGroup[] {
  const chars = [...heads];
  if (chars.length !== GROUPS.length) throw new Error(`ต้องมีหัวแถว ${GROUPS.length} ตัว`);
  return GROUPS.map(([id, kind], i) => ({ id, head: chars[i]!, romaji: id, kind }));
}

export interface KanaExtra {
  /** ตัวที่หน้าตาคล้ายกัน เขียนติดกันเป็นสตริง เช่น 'おめぬ' */
  similar?: string;
  note?: string;
}

/**
 * สร้างรายการตัวอักษรของชุดคานะ
 * @param chars ตัวอักษร 71 ตัว เรียงตาม KANA_SOUNDS
 * @param extras ข้อมูลเฉพาะชุด (ตัวที่หน้าคล้าย, หมายเหตุ) โดยใช้ id เป็น key
 * @param words คำศัพท์ตัวอย่าง โดยใช้ id เป็น key
 */
export function buildKana(
  chars: string,
  extras: Record<string, KanaExtra>,
  words: Record<string, ExampleWord> = {},
): CharEntry[] {
  const list = [...chars];
  if (list.length !== KANA_SOUNDS.length) {
    throw new Error(`ต้องมีตัวอักษร ${KANA_SOUNDS.length} ตัว แต่ได้ ${list.length} ตัว`);
  }
  const charOf = new Map(KANA_SOUNDS.map((s, i) => [s.id, list[i]!]));
  return KANA_SOUNDS.map((s, i) => {
    const extra = extras[s.id] ?? {};
    const entry: CharEntry = { id: s.id, char: list[i]!, romaji: s.romaji, thai: s.thai, group: s.group, col: s.col };
    if (s.romajiAlt) entry.romajiAlt = s.romajiAlt;
    if (s.baseId) entry.base = charOf.get(s.baseId);
    if (extra.similar) entry.similar = [...extra.similar];
    if (extra.note) entry.note = extra.note;
    if (words[s.id]) entry.example = words[s.id];
    return entry;
  });
}
