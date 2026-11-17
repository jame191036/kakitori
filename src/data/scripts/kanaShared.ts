import type { CharEntry, CharGroup, ExampleWord, GroupKind } from '../types';

/**
 * ส่วนที่ฮิรางานะและคาตาคานะใช้ร่วมกัน: เสียง โรมาจิ คำอ่านไทย และตำแหน่งในตาราง
 * (ทั้งสองชุดเรียงลำดับเดียวกันและใช้ id เดียวกัน เช่น 'ka' = か / カ, 'kya' = きゃ / キャ
 *  จึงจับคู่ข้ามชุดได้ด้วย id — ใช้ในข้อสอบแบบจับคู่)
 *
 * ลำดับ: ตัวพื้นฐาน 46 → ตัวขุ่น/ครึ่งขุ่น 25 → ตัวเล็ก 4 → ตัวควบ 33
 * (คาตาคานะมี ー เพิ่มอีก 1 ตัวในกลุ่มตัวเล็ก — ดู KATAKANA_ONLY_SOUNDS)
 */

export interface KanaSound {
  id: string;
  romaji: string;
  thai: string;
  group: string;
  col: number;
  romajiAlt?: readonly string[];
  /** id ของตัวต้นแบบ (ตัวขุ่น/ครึ่งขุ่น เช่น ga → ka, ตัวควบขุ่น เช่น gya → kya) */
  baseId?: string;
  /** ตัวควบ: id ของตัวที่ประกอบกัน เช่น kya = ki + small-ya */
  partIds?: readonly [string, string];
}

/** [id, ประเภท] เรียงตามลำดับในตารางและในเส้นทาง "เรียนต่อ" */
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
  ['small', 'small'],
  ['kya', 'yoon'],
  ['sha', 'yoon'],
  ['cha', 'yoon'],
  ['nya', 'yoon'],
  ['hya', 'yoon'],
  ['mya', 'yoon'],
  ['rya', 'yoon'],
  ['gya', 'yoon'],
  ['ja', 'yoon'],
  ['bya', 'yoon'],
  ['pya', 'yoon'],
];

/**
 * แถวตัวควบ: ตัวในคอลัมน์ i + ゃ ゅ ょ ตัวเล็ก วางที่คอลัมน์ a / u / o (0 / 2 / 4) แบบแถว や
 * @param items [id, โรมาจิ, คำอ่านไทย] ของ ya / yu / yo
 * @param baseIds id ตัวต้นแบบของแถวตัวควบขุ่น (เช่น gya → kya)
 */
function yoon(
  group: string,
  iId: string,
  items: [string, string, string][],
  baseIds?: readonly [string, string, string],
): KanaSound[] {
  const smalls = ['small-ya', 'small-yu', 'small-yo'] as const;
  return items.map(([id, romaji, thai], i) => ({
    id,
    romaji,
    thai,
    group,
    col: i * 2,
    partIds: [iId, smalls[i]!],
    ...(baseIds ? { baseId: baseIds[i] } : {}),
  }));
}

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
  // ตัวเล็ก: ไม่มีเสียงของตัวเอง (โรมาจิ/คำอ่านไทยเป็นแค่ป้ายกำกับ) — อธิบายวิธีใช้ไว้ใน note ของแต่ละชุด
  ...row('small', [
    ['small-ya', 'ya', 'ยะ ตัวเล็ก'],
    ['small-yu', 'yu', 'ยุ ตัวเล็ก'],
    ['small-yo', 'yo', 'โยะ ตัวเล็ก'],
    ['small-tsu', 'tsu', 'ตัวสะกดซ้ำ'],
  ], [0, 1, 2, 3]),
  ...yoon('kya', 'ki', [['kya', 'kya', 'เคียะ'], ['kyu', 'kyu', 'คิว'], ['kyo', 'kyo', 'เคียว']]),
  ...yoon('sha', 'shi', [['sha', 'sha', 'ชะ'], ['shu', 'shu', 'ชุ'], ['sho', 'sho', 'โชะ']]),
  ...yoon('cha', 'chi', [['cha', 'cha', 'จะ'], ['chu', 'chu', 'จุ'], ['cho', 'cho', 'โจะ']]),
  ...yoon('nya', 'ni', [['nya', 'nya', 'เนียะ'], ['nyu', 'nyu', 'นิว'], ['nyo', 'nyo', 'เนียว']]),
  ...yoon('hya', 'hi', [['hya', 'hya', 'เฮียะ'], ['hyu', 'hyu', 'ฮิว'], ['hyo', 'hyo', 'เฮียว']]),
  ...yoon('mya', 'mi', [['mya', 'mya', 'เมียะ'], ['myu', 'myu', 'มิว'], ['myo', 'myo', 'เมียว']]),
  ...yoon('rya', 'ri', [['rya', 'rya', 'เรียะ'], ['ryu', 'ryu', 'ริว'], ['ryo', 'ryo', 'เรียว']]),
  ...yoon('gya', 'gi', [['gya', 'gya', 'เกียะ'], ['gyu', 'gyu', 'กิว'], ['gyo', 'gyo', 'เกียว']], ['kya', 'kyu', 'kyo']),
  ...yoon('ja', 'ji', [['ja', 'ja', 'จะ'], ['ju', 'ju', 'จุ'], ['jo', 'jo', 'โจะ']], ['sha', 'shu', 'sho']),
  ...yoon('bya', 'bi', [['bya', 'bya', 'เบียะ'], ['byu', 'byu', 'บิว'], ['byo', 'byo', 'เบียว']], ['hya', 'hyu', 'hyo']),
  ...yoon('pya', 'pi', [['pya', 'pya', 'เปียะ'], ['pyu', 'pyu', 'ปิว'], ['pyo', 'pyo', 'เปียว']], ['hya', 'hyu', 'hyo']),
];

/** ー ขีดเสียงยาว: ใช้เฉพาะคาตาคานะ (ฮิรางานะใช้เขียนสระซ้ำแทน เช่น おかあさん) */
export const KATAKANA_ONLY_SOUNDS: readonly KanaSound[] = [
  { id: 'long', romaji: '–', thai: 'ลากเสียงยาว', group: 'small', col: 4 },
];

/**
 * สร้างกลุ่ม (แถว) จากรายการตัวอักษรที่สร้างแล้ว — หัวแถว = ตัวแรกของแถว (เช่น か, きゃ)
 * กลุ่มตัวเล็กใช้ทุกตัวเป็นหัว (ゃゅょっ) และไม่มีโรมาจิของแถว
 */
export function kanaGroups(chars: readonly CharEntry[]): CharGroup[] {
  return GROUPS.map(([id, kind]) => {
    const members = chars.filter((c) => c.group === id);
    if (!members.length) throw new Error(`แถว ${id} ไม่มีตัวอักษร`);
    return kind === 'small'
      ? { id, head: members.map((c) => c.char).join(''), romaji: '', kind }
      : { id, head: members[0]!.char, romaji: id, kind };
  });
}

export interface KanaExtra {
  /** ตัวที่หน้าตาคล้ายกัน เขียนติดกันเป็นสตริง เช่น 'おめぬ' */
  similar?: string;
  note?: string;
}

/**
 * สร้างรายการตัวอักษรของชุดคานะ
 * @param chars ตัวอักษรเดี่ยวเรียงตาม KANA_SOUNDS (+ extraSounds) โดยข้ามตัวควบ
 *              — ตัวควบประกอบให้เองจากตัวที่ประกอบกัน (き + ゃ = きゃ)
 * @param extras ข้อมูลเฉพาะชุด (ตัวที่หน้าคล้าย, หมายเหตุ) โดยใช้ id เป็น key
 * @param words คำศัพท์ตัวอย่าง โดยใช้ id เป็น key
 * @param extraSounds เสียงเฉพาะชุดนี้ ต่อท้าย KANA_SOUNDS (เช่น ー ของคาตาคานะ)
 */
export function buildKana(
  chars: string,
  extras: Record<string, KanaExtra>,
  words: Record<string, ExampleWord> = {},
  extraSounds: readonly KanaSound[] = [],
): CharEntry[] {
  const sounds = [...KANA_SOUNDS, ...extraSounds];
  const singles = sounds.filter((s) => !s.partIds);
  const list = [...chars];
  if (list.length !== singles.length) {
    throw new Error(`ต้องมีตัวอักษรเดี่ยว ${singles.length} ตัว แต่ได้ ${list.length} ตัว`);
  }
  const charOf = new Map(singles.map((s, i) => [s.id, list[i]!]));
  const partsOf = (s: KanaSound) => s.partIds?.map((id) => charOf.get(id)!);
  for (const s of sounds) if (s.partIds) charOf.set(s.id, partsOf(s)!.join(''));

  return sounds.map((s) => {
    const extra = extras[s.id] ?? {};
    const entry: CharEntry = {
      id: s.id,
      char: charOf.get(s.id)!,
      romaji: s.romaji,
      thai: s.thai,
      group: s.group,
      col: s.col,
    };
    if (s.romajiAlt) entry.romajiAlt = s.romajiAlt;
    if (s.partIds) entry.parts = partsOf(s);
    if (s.baseId) entry.base = charOf.get(s.baseId);
    if (extra.similar) entry.similar = [...extra.similar];
    if (extra.note) entry.note = extra.note;
    if (words[s.id]) entry.example = words[s.id];
    return entry;
  });
}
