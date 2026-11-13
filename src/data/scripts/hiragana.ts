import type { CharEntry, CharGroup, ScriptPack, StrokeSet } from '../types';

const groups: CharGroup[] = [
  { id: 'a', head: 'あ', romaji: 'a', kind: 'basic' },
  { id: 'ka', head: 'か', romaji: 'ka', kind: 'basic' },
  { id: 'sa', head: 'さ', romaji: 'sa', kind: 'basic' },
  { id: 'ta', head: 'た', romaji: 'ta', kind: 'basic' },
  { id: 'na', head: 'な', romaji: 'na', kind: 'basic' },
  { id: 'ha', head: 'は', romaji: 'ha', kind: 'basic' },
  { id: 'ma', head: 'ま', romaji: 'ma', kind: 'basic' },
  { id: 'ya', head: 'や', romaji: 'ya', kind: 'basic' },
  { id: 'ra', head: 'ら', romaji: 'ra', kind: 'basic' },
  { id: 'wa', head: 'わ', romaji: 'wa', kind: 'basic' },
  { id: 'n', head: 'ん', romaji: 'n', kind: 'basic' },
  { id: 'ga', head: 'が', romaji: 'ga', kind: 'dakuten' },
  { id: 'za', head: 'ざ', romaji: 'za', kind: 'dakuten' },
  { id: 'da', head: 'だ', romaji: 'da', kind: 'dakuten' },
  { id: 'ba', head: 'ば', romaji: 'ba', kind: 'dakuten' },
  { id: 'pa', head: 'ぱ', romaji: 'pa', kind: 'handakuten' },
];

type Extra = Pick<CharEntry, 'romajiAlt' | 'note' | 'base' | 'similar'>;

function ch(
  id: string,
  char: string,
  romaji: string,
  thai: string,
  group: string,
  col: number,
  extra: Partial<Extra> = {},
): CharEntry {
  return { id, char, romaji, thai, group, col, ...extra };
}

/** ใส่ตัวต้นแบบ (base) ให้ตัวขุ่น/ครึ่งขุ่นทั้งแถว */
function voicedRow(
  group: string,
  rows: [id: string, char: string, romaji: string, thai: string, base: string, extra?: Partial<Extra>][],
): CharEntry[] {
  return rows.map(([id, char, romaji, thai, base, extra], col) =>
    ch(id, char, romaji, thai, group, col, { base, ...extra }),
  );
}

const chars: CharEntry[] = [
  // แถว あ
  ch('a', 'あ', 'a', 'อะ', 'a', 0, { similar: ['お', 'め', 'ぬ'] }),
  ch('i', 'い', 'i', 'อิ', 'a', 1, { similar: ['り', 'こ'] }),
  ch('u', 'う', 'u', 'อุ', 'a', 2, { similar: ['つ', 'ら', 'ろ'] }),
  ch('e', 'え', 'e', 'เอะ', 'a', 3, { similar: ['ん', 'る', 'ろ'] }),
  ch('o', 'お', 'o', 'โอะ', 'a', 4, { similar: ['あ', 'む', 'す'] }),
  // แถว か
  ch('ka', 'か', 'ka', 'คะ', 'ka', 0, { similar: ['や', 'わ'] }),
  ch('ki', 'き', 'ki', 'คิ', 'ka', 1, {
    similar: ['さ', 'ち', 'ま'],
    note: 'แบบตัวพิมพ์บางฟอนต์ขีดล่างจะต่อกัน แต่เวลาเขียนด้วยมือนิยมแยกเป็น 4 ขีด',
  }),
  ch('ku', 'く', 'ku', 'คุ', 'ka', 2, { similar: ['へ', 'し'] }),
  ch('ke', 'け', 'ke', 'เคะ', 'ka', 3, { similar: ['は', 'ほ', 'に'] }),
  ch('ko', 'こ', 'ko', 'โคะ', 'ka', 4, { similar: ['に', 'い'] }),
  // แถว さ
  ch('sa', 'さ', 'sa', 'ซะ', 'sa', 0, {
    similar: ['ち', 'き'],
    note: 'แบบตัวพิมพ์บางฟอนต์ขีดล่างจะต่อกัน แต่เวลาเขียนด้วยมือนิยมแยกเป็น 3 ขีด',
  }),
  ch('shi', 'し', 'shi', 'ชิ', 'sa', 1, { similar: ['つ', 'く'] }),
  ch('su', 'す', 'su', 'ซุ', 'sa', 2, { similar: ['む', 'お'] }),
  ch('se', 'せ', 'se', 'เซะ', 'sa', 3, { similar: ['さ', 'け', 'や'] }),
  ch('so', 'そ', 'so', 'โซะ', 'sa', 4, { similar: ['て', 'ろ'] }),
  // แถว た
  ch('ta', 'た', 'ta', 'ทะ', 'ta', 0, { similar: ['な', 'に'] }),
  ch('chi', 'ち', 'chi', 'จิ', 'ta', 1, { similar: ['さ', 'ら'] }),
  ch('tsu', 'つ', 'tsu', 'ทสึ', 'ta', 2, {
    similar: ['う', 'し'],
    note: 'ออกเสียงคล้าย "ทสึ" หรือ "สึ" โดยแตะปลายลิ้นที่ฟันบนก่อน',
  }),
  ch('te', 'て', 'te', 'เทะ', 'ta', 3, { similar: ['そ', 'つ'] }),
  ch('to', 'と', 'to', 'โทะ', 'ta', 4, { similar: ['く', 'し'] }),
  // แถว な
  ch('na', 'な', 'na', 'นะ', 'na', 0, { similar: ['た', 'は'] }),
  ch('ni', 'に', 'ni', 'นิ', 'na', 1, { similar: ['こ', 'た', 'け'] }),
  ch('nu', 'ぬ', 'nu', 'นุ', 'na', 2, { similar: ['め', 'ね', 'あ'] }),
  ch('ne', 'ね', 'ne', 'เนะ', 'na', 3, { similar: ['れ', 'わ', 'ぬ'] }),
  ch('no', 'の', 'no', 'โนะ', 'na', 4, { similar: ['め', 'あ'] }),
  // แถว は
  ch('ha', 'は', 'ha', 'ฮะ', 'ha', 0, {
    similar: ['ほ', 'け'],
    note: 'เมื่อใช้เป็นคำช่วย (เช่น わたしは) จะอ่านว่า "wa" (วะ)',
  }),
  ch('hi', 'ひ', 'hi', 'ฮิ', 'ha', 1, { similar: ['い', 'し'] }),
  ch('fu', 'ふ', 'fu', 'ฟุ', 'ha', 2, {
    similar: ['う'],
    note: 'เสียงอยู่ระหว่าง "ฟุ" กับ "ฮุ" — เป่าลมผ่านริมฝีปากเบาๆ ไม่ใช้ฟันแตะปาก',
  }),
  ch('he', 'へ', 'he', 'เฮะ', 'ha', 3, {
    similar: ['く'],
    note: 'เมื่อใช้เป็นคำช่วยบอกทิศทาง จะอ่านว่า "e" (เอะ)',
  }),
  ch('ho', 'ほ', 'ho', 'โฮะ', 'ha', 4, { similar: ['は', 'ま'] }),
  // แถว ま
  ch('ma', 'ま', 'ma', 'มะ', 'ma', 0, { similar: ['ほ', 'も', 'よ'] }),
  ch('mi', 'み', 'mi', 'มิ', 'ma', 1, { similar: ['む', 'め'] }),
  ch('mu', 'む', 'mu', 'มุ', 'ma', 2, { similar: ['す', 'お', 'み'] }),
  ch('me', 'め', 'me', 'เมะ', 'ma', 3, { similar: ['ぬ', 'あ', 'の'] }),
  ch('mo', 'も', 'mo', 'โมะ', 'ma', 4, { similar: ['し', 'ま'] }),
  // แถว や
  ch('ya', 'や', 'ya', 'ยะ', 'ya', 0, { similar: ['か', 'せ'] }),
  ch('yu', 'ゆ', 'yu', 'ยุ', 'ya', 2, { similar: ['よ', 'の'] }),
  ch('yo', 'よ', 'yo', 'โยะ', 'ya', 4, { similar: ['ま', 'ゆ'] }),
  // แถว ら
  ch('ra', 'ら', 'ra', 'ระ', 'ra', 0, {
    similar: ['う', 'ち'],
    note: 'เสียง r ของญี่ปุ่นอยู่ระหว่าง "ร" กับ "ล" (ลิ้นแตะเพดานเบาๆ ครั้งเดียว)',
  }),
  ch('ri', 'り', 'ri', 'ริ', 'ra', 1, { similar: ['い', 'に'] }),
  ch('ru', 'る', 'ru', 'รุ', 'ra', 2, { similar: ['ろ', 'れ'] }),
  ch('re', 'れ', 're', 'เระ', 'ra', 3, { similar: ['わ', 'ね', 'る'] }),
  ch('ro', 'ろ', 'ro', 'โระ', 'ra', 4, { similar: ['る', 'ら'] }),
  // แถว わ
  ch('wa', 'わ', 'wa', 'วะ', 'wa', 0, { similar: ['れ', 'ね'] }),
  ch('wo', 'を', 'wo', 'โอะ', 'wa', 4, {
    romajiAlt: ['o'],
    similar: ['お', 'も'],
    note: 'ออกเสียงเหมือน お (o) ใช้เป็นคำช่วยบอกกรรมเท่านั้น',
  }),
  // ん
  ch('n', 'ん', 'n', 'อึน', 'n', 0, {
    similar: ['え', 'そ'],
    note: 'เป็นเสียงตัวสะกด ไม่ใช้ขึ้นต้นคำ ออกเสียงเป็น น/ง/ม ตามเสียงที่ตามมา',
  }),

  // ตัวขุ่น (dakuten ゛)
  ...voicedRow('ga', [
    ['ga', 'が', 'ga', 'กะ', 'か'],
    ['gi', 'ぎ', 'gi', 'กิ', 'き'],
    ['gu', 'ぐ', 'gu', 'กุ', 'く'],
    ['ge', 'げ', 'ge', 'เกะ', 'け'],
    ['go', 'ご', 'go', 'โกะ', 'こ'],
  ]),
  ...voicedRow('za', [
    ['za', 'ざ', 'za', 'ซะ', 'さ', { note: 'เสียง z — คล้าย "ซ" แต่มีเสียงสั่นในลำคอ' }],
    ['ji', 'じ', 'ji', 'จิ', 'し'],
    ['zu', 'ず', 'zu', 'ซุ', 'す'],
    ['ze', 'ぜ', 'ze', 'เซะ', 'せ'],
    ['zo', 'ぞ', 'zo', 'โซะ', 'そ'],
  ]),
  ...voicedRow('da', [
    ['da', 'だ', 'da', 'ดะ', 'た'],
    ['di', 'ぢ', 'ji', 'จิ', 'ち', { romajiAlt: ['di'], note: 'ออกเสียงเหมือน じ (ji) พบได้ไม่บ่อย' }],
    ['du', 'づ', 'zu', 'ซุ', 'つ', { romajiAlt: ['du'], note: 'ออกเสียงเหมือน ず (zu) พบได้ไม่บ่อย' }],
    ['de', 'で', 'de', 'เดะ', 'て'],
    ['do', 'ど', 'do', 'โดะ', 'と'],
  ]),
  ...voicedRow('ba', [
    ['ba', 'ば', 'ba', 'บะ', 'は'],
    ['bi', 'び', 'bi', 'บิ', 'ひ'],
    ['bu', 'ぶ', 'bu', 'บุ', 'ふ'],
    ['be', 'べ', 'be', 'เบะ', 'へ'],
    ['bo', 'ぼ', 'bo', 'โบะ', 'ほ'],
  ]),
  // ตัวครึ่งขุ่น (handakuten ゜)
  ...voicedRow('pa', [
    ['pa', 'ぱ', 'pa', 'ปะ', 'は'],
    ['pi', 'ぴ', 'pi', 'ปิ', 'ひ'],
    ['pu', 'ぷ', 'pu', 'ปุ', 'ふ'],
    ['pe', 'ぺ', 'pe', 'เปะ', 'へ'],
    ['po', 'ぽ', 'po', 'โปะ', 'ほ'],
  ]),
];

export const hiragana: ScriptPack = {
  id: 'hiragana',
  name: 'ฮิรางานะ',
  nameJa: 'ひらがな',
  nameEn: 'Hiragana',
  description:
    'ตัวอักษรพื้นฐานของภาษาญี่ปุ่น ใช้เขียนคำญี่ปุ่นแท้ คำช่วย และส่วนท้ายของคำกริยา — เป็นชุดแรกที่ควรเรียน',
  groups,
  chars,
  loadStrokes: () =>
    import('../strokes/hiragana.json').then((m) => m.default as unknown as StrokeSet),
};
