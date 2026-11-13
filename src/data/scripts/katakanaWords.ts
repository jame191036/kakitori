import type { ExampleWord } from '../types';

/**
 * คำศัพท์ตัวอย่างของคาตาคานะ (ตัวละ 1 คำ) — key คือ id ของตัวอักษร
 *
 * หลักการเลือกคำ:
 * - คำทับศัพท์ที่ใช้บ่อย (คาตาคานะใช้เขียนคำจากภาษาอื่น) พร้อมคำต้นทาง แทนคันจิ
 * - ไม่มีตัวเล็ก (ャ ュ ョ ッ ァ) เพราะยังไม่ได้สอน — บางคำมีเครื่องหมายเสียงยาว ー
 *   ซึ่งอธิบายไว้ในหน้า "เริ่มต้นที่นี่" (โรมาจิเขียนเป็นสระซ้ำ เช่น ケーキ = keeki)
 * - ヲ ヂ ヅ แทบไม่ใช้ในคำทั่วไป จึงไม่มีคำตัวอย่าง
 *
 * ⚠️ ผู้ดูแลโปรเจคไม่รู้ภาษาญี่ปุ่น — ควรให้ผู้รู้ภาษาญี่ปุ่นตรวจก่อนเปิดใช้จริง
 */
const w = (kana: string, romaji: string, meaning: string, origin: string): ExampleWord => ({
  kana,
  romaji,
  meaning,
  origin,
});

export const KATAKANA_WORDS: Record<string, ExampleWord> = {
  a: w('アイス', 'aisu', 'ไอศกรีม', 'ice'),
  i: w('インク', 'inku', 'หมึก', 'ink'),
  u: w('ウインク', 'uinku', 'ขยิบตา', 'wink'),
  e: w('エアコン', 'eakon', 'เครื่องปรับอากาศ (แอร์)', 'air conditioner'),
  o: w('オレンジ', 'orenji', 'ส้ม', 'orange'),
  ka: w('カメラ', 'kamera', 'กล้องถ่ายรูป', 'camera'),
  ki: w('キウイ', 'kiui', 'กีวี', 'kiwi'),
  ku: w('クラス', 'kurasu', 'ชั้นเรียน', 'class'),
  ke: w('ケーキ', 'keeki', 'เค้ก', 'cake'),
  ko: w('コアラ', 'koara', 'โคอาลา', 'koala'),
  sa: w('サラダ', 'sarada', 'สลัด', 'salad'),
  shi: w('シナモン', 'shinamon', 'อบเชย', 'cinnamon'),
  su: w('スマホ', 'sumaho', 'สมาร์ตโฟน', 'smartphone'),
  se: w('セロリ', 'serori', 'ขึ้นฉ่าย', 'celery'),
  so: w('ソース', 'soosu', 'ซอส', 'sauce'),
  ta: w('タオル', 'taoru', 'ผ้าขนหนู', 'towel'),
  chi: w('チキン', 'chikin', 'เนื้อไก่', 'chicken'),
  tsu: w('ツナ', 'tsuna', 'ปลาทูน่า', 'tuna'),
  te: w('テレビ', 'terebi', 'โทรทัศน์', 'television'),
  to: w('トマト', 'tomato', 'มะเขือเทศ', 'tomato'),
  na: w('ナイフ', 'naifu', 'มีด', 'knife'),
  ni: w('テニス', 'tenisu', 'เทนนิส', 'tennis'),
  nu: w('ヌードル', 'nuudoru', 'เส้นบะหมี่', 'noodle'),
  ne: w('ネクタイ', 'nekutai', 'เนกไท', 'necktie'),
  no: w('ノート', 'nooto', 'สมุดจด', 'notebook'),
  ha: w('ハム', 'hamu', 'แฮม', 'ham'),
  hi: w('ヒント', 'hinto', 'คำใบ้', 'hint'),
  fu: w('フライパン', 'furaipan', 'กระทะ', 'frying pan'),
  he: w('ヘア', 'hea', 'ผม / ทรงผม', 'hair'),
  ho: w('ホテル', 'hoteru', 'โรงแรม', 'hotel'),
  ma: w('マスク', 'masuku', 'หน้ากากอนามัย', 'mask'),
  mi: w('ミルク', 'miruku', 'นม', 'milk'),
  mu: w('アルバム', 'arubamu', 'อัลบั้ม', 'album'),
  me: w('メロン', 'meron', 'เมลอน', 'melon'),
  mo: w('モデル', 'moderu', 'นายแบบ / นางแบบ', 'model'),
  ya: w('タイヤ', 'taiya', 'ยางรถ', 'tire'),
  yu: w('ユーロ', 'yuuro', 'เงินยูโร', 'euro'),
  yo: w('ヨガ', 'yoga', 'โยคะ', 'yoga'),
  ra: w('ラジオ', 'rajio', 'วิทยุ', 'radio'),
  ri: w('リボン', 'ribon', 'ริบบิ้น', 'ribbon'),
  ru: w('ルビー', 'rubii', 'ทับทิม', 'ruby'),
  re: w('レモン', 'remon', 'เลมอน', 'lemon'),
  ro: w('ロシア', 'roshia', 'ประเทศรัสเซีย', 'Russia'),
  wa: w('ワイン', 'wain', 'ไวน์', 'wine'),
  n: w('パン', 'pan', 'ขนมปัง', 'pão (ภาษาโปรตุเกส)'),
  ga: w('ガム', 'gamu', 'หมากฝรั่ง', 'gum'),
  gi: w('ギター', 'gitaa', 'กีตาร์', 'guitar'),
  gu: w('グラス', 'gurasu', 'แก้วน้ำ', 'glass'),
  ge: w('ゲーム', 'geemu', 'เกม', 'game'),
  go: w('ゴルフ', 'gorufu', 'กอล์ฟ', 'golf'),
  za: w('デザイン', 'dezain', 'การออกแบบ', 'design'),
  ji: w('ジム', 'jimu', 'ยิม (ฟิตเนส)', 'gym'),
  zu: w('ズボン', 'zubon', 'กางเกงขายาว', 'jupon (ภาษาฝรั่งเศส)'),
  ze: w('ゼリー', 'zerii', 'เยลลี่', 'jelly'),
  zo: w('ゾンビ', 'zonbi', 'ซอมบี้', 'zombie'),
  da: w('ダンス', 'dansu', 'การเต้น', 'dance'),
  de: w('デパート', 'depaato', 'ห้างสรรพสินค้า', 'department store'),
  do: w('ドア', 'doa', 'ประตู', 'door'),
  ba: w('バス', 'basu', 'รถบัส', 'bus'),
  bi: w('ビデオ', 'bideo', 'วิดีโอ', 'video'),
  bu: w('ブラシ', 'burashi', 'แปรง', 'brush'),
  be: w('ベル', 'beru', 'กระดิ่ง', 'bell'),
  bo: w('ボタン', 'botan', 'กระดุม / ปุ่ม', 'botão (ภาษาโปรตุเกส)'),
  pa: w('パンダ', 'panda', 'แพนด้า', 'panda'),
  pi: w('ピアノ', 'piano', 'เปียโน', 'piano'),
  pu: w('プリン', 'purin', 'พุดดิ้ง', 'pudding'),
  pe: w('ペン', 'pen', 'ปากกา', 'pen'),
  po: w('ポスト', 'posuto', 'ตู้ไปรษณีย์', 'post'),
};
