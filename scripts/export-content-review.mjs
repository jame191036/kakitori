#!/usr/bin/env node
/**
 * สร้างตารางเนื้อหาภาษาญี่ปุ่นทั้งหมด ไว้ส่งให้ผู้รู้ภาษาญี่ปุ่นช่วยตรวจ
 *
 *   npm run content:review
 *
 * ได้ 2 ไฟล์ (ดึงจากข้อมูลจริงในโค้ดทุกครั้ง จึงตรงกับเว็บเสมอ):
 *   docs/content-review.md   — อ่านบน GitHub หรือพิมพ์ออกมาได้
 *   docs/content-review.csv  — เปิดใน Excel / Google Sheets แล้วกรอกผลตรวจได้
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { KANA_PRIORITY, VOCAB_PRIORITY } from './content-review-priority.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'docs');

// โหลดไฟล์ TypeScript ของข้อมูลผ่าน Vite (ไม่ใช้ config ของเว็บ เพื่อไม่ให้ปลั๊กอิน PWA ทำงาน)
const server = await createServer({
  root: ROOT,
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
  // ไม่ต้องสแกน dependency ของเบราว์เซอร์ (ใช้แค่โหลดไฟล์ข้อมูล) — กัน error ตอนรันครั้งแรก
  optimizeDeps: { noDiscovery: true, include: [] },
});
const { scriptList, groupLabel, romajiLabel } = await server.ssrLoadModule('/src/data/scripts/index.ts');
const { MINIMAL_PAIRS } = await server.ssrLoadModule('/src/data/minimalPairs.ts');
const { vocabDecks, lessonCode, WORD_KIND_LABEL } = await server.ssrLoadModule('/src/data/vocab/index.ts');
await server.close();

// จุดที่ควรให้ผู้ตรวจดูก่อน — ตรวจว่า id ในรายการมีอยู่จริง (กันพิมพ์ผิดแล้วหายเงียบ)
const usedPriority = new Set();
const priorityOf = (table, key) => {
  const reason = table[key];
  if (reason) usedPriority.add(`${table === KANA_PRIORITY ? 'kana' : 'vocab'}:${key}`);
  return reason ?? '';
};

/** ชื่อชุดของแถวคู่คำ (บทเรียน "ตัวเล็กและเสียงยาว" ในหน้า /start) */
const PAIRS_SET = 'คู่คำฝึกฟัง';
const PAIR_KIND_LABEL = { yoon: 'ตัวควบ', sokuon: 'っ สะกดซ้ำ', long: 'เสียงยาว' };

const COLUMNS = [
  'ชุด',
  'แถว',
  'ตัวอักษร',
  'โรมาจิ',
  'คำอ่านไทย',
  'หมายเหตุ',
  'คำตัวอย่าง',
  'โรมาจิของคำ',
  'ความหมาย',
  'ที่มาของคำ',
  'ควรดูก่อน',
  'ถูกต้อง? (✓/✗)',
  'ความเห็นผู้ตรวจ',
];
const PRIORITY_COL = COLUMNS.indexOf('ควรดูก่อน');

const rows = [];
for (const pack of scriptList) {
  for (const c of pack.chars) {
    const group = pack.groups.find((g) => g.id === c.group);
    const ex = c.example;
    rows.push([
      pack.name,
      group ? groupLabel(group) : '',
      c.char,
      romajiLabel(c),
      c.thai,
      c.note ?? '',
      ex ? (ex.kanji ? `${ex.kana}（${ex.kanji}）` : ex.kana) : '',
      ex?.romaji ?? '',
      ex?.meaning ?? '',
      ex?.origin ?? '',
      // คำอ่านไทยใช้ร่วมกันทั้งสองชุด → ทำเครื่องหมายเฉพาะแถวฮิรางานะ
      pack.id === 'hiragana' ? priorityOf(KANA_PRIORITY, c.id) : '',
      '',
      '',
    ]);
  }
}

// คู่คำฝึกฟัง: 1 แถวต่อ 1 คำ — หมายเหตุบอกว่าคู่กับคำไหน
const wordCell = (w) => (w.kanji ? `${w.kana}（${w.kanji}）` : w.kana);
for (const p of MINIMAL_PAIRS) {
  for (const [w, other] of [
    [p.plain, p.marked],
    [p.marked, p.plain],
  ]) {
    rows.push([PAIRS_SET, PAIR_KIND_LABEL[p.kind], '', '', '', `คู่กับ ${other.kana}`, wordCell(w), w.romaji, w.meaning, '', '', '', '']);
  }
}

// คำศัพท์ (หมวด JLPT ฯลฯ): 1 แถวต่อ 1 คำ — "ชุด" = ชุดคำ · ช่วง, "แถว" = บทเรียน, หมายเหตุ = ชนิดคำ + หมายเหตุบนการ์ด
const segmentSet = (deck, segment) => `${deck.name} · ${segment.title}`;
for (const deck of vocabDecks) {
  for (const segment of deck.segments) {
    for (const lesson of segment.lessons) {
      for (const id of lesson.words) {
        const w = deck.words[id];
        const note = [WORD_KIND_LABEL[w.kind], w.note].filter(Boolean).join(' · ');
        rows.push([
          segmentSet(deck, segment),
          `${lessonCode(deck, lesson)} ${lesson.title}`,
          '',
          '',
          '',
          note,
          wordCell(w),
          w.romaji,
          w.thai,
          '',
          priorityOf(VOCAB_PRIORITY, id),
          '',
          '',
        ]);
      }
    }
  }
}

const missing = [
  ...Object.keys(KANA_PRIORITY).map((k) => `kana:${k}`),
  ...Object.keys(VOCAB_PRIORITY).map((k) => `vocab:${k}`),
].filter((k) => !usedPriority.has(k));
if (missing.length) throw new Error(`content-review-priority: ไม่พบ id ${missing.join(', ')}`);
const priorityRows = rows.filter((r) => r[PRIORITY_COL]);

// ── CSV (มี BOM เพื่อให้ Excel แสดงภาษาไทย/ญี่ปุ่นถูกต้อง) ──
const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const csv = '\uFEFF' + [COLUMNS, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

// ── Markdown ──
const mdCell = (v) => v.replaceAll('|', '\\|').replaceAll('\n', ' ') || ' ';
// ในตารางแสดงแค่ ★ (เหตุผลเต็มอยู่ในหัวข้อ "เริ่มตรงนี้ก่อน" ด้านบน)
const mdRow = (r) => r.map((v, i) => (i === PRIORITY_COL ? (v ? '★' : '') : v));
const mdTable = (list) =>
  [
    `| ${COLUMNS.slice(1).join(' | ')} |`,
    `| ${COLUMNS.slice(1).map(() => '---').join(' | ')} |`,
    ...list.map((r) => `| ${mdRow(r).slice(1).map(mdCell).join(' | ')} |`),
  ].join('\n');

const itemCell = (r) => r[2] || r[6];
const prioritySection = [
  `## เริ่มตรงนี้ก่อน — ${priorityRows.length} จุดที่ผู้พัฒนาไม่แน่ใจที่สุด`,
  '',
  'ถ้ามีเวลาน้อย ช่วยดูแค่รายการนี้ก่อนก็ได้ครับ (ในตารางด้านล่างแถวเหล่านี้มี ★ ในคอลัมน์ "ควรดูก่อน" ·',
  'ในไฟล์ CSV กรองคอลัมน์ "ควรดูก่อน" ที่ไม่ว่างได้)',
  '',
  '| ชุด | ตัวอักษร / คำ | ความหมาย / คำอ่าน | เรื่องที่อยากให้ดู |',
  '| --- | --- | --- | --- |',
  // แถวตัวอักษร: คำอ่านไทย (ช่อง 4) · แถวคำศัพท์: ความหมาย (ช่อง 8)
  ...priorityRows.map((r) => `| ${[r[0], itemCell(r), r[4] || r[8], r[PRIORITY_COL]].map(mdCell).join(' | ')} |`),
  '',
];

const md = [
  '# ตารางตรวจเนื้อหาภาษาญี่ปุ่น',
  '',
  '> ไฟล์นี้สร้างอัตโนมัติด้วย `npm run content:review` — อย่าแก้ไฟล์นี้โดยตรง ให้แก้ที่ `src/data/scripts/*.ts`',
  '> (ตัวอักษร) หรือ `src/data/vocab/n5/*.ts` (คำศัพท์) แล้วรันใหม่ · รายการ "ควรดูก่อน" อยู่ที่ `scripts/content-review-priority.mjs`',
  '',
  '## สำหรับผู้ช่วยตรวจ',
  '',
  'ขอบคุณที่ช่วยตรวจครับ เว็บนี้สอนคนไทยที่ไม่รู้ภาษาญี่ปุ่นเลยให้อ่านเขียนฮิรางานะ คาตาคานะ และคำศัพท์ JLPT N5',
  'รบกวนช่วยดูว่าข้อมูลแต่ละแถวถูกต้องและเหมาะกับผู้เริ่มต้นไหม แล้วใส่ ✓ หรือ ✗ ในคอลัมน์ "ถูกต้อง?" พร้อมความเห็น',
  '(แนะนำให้เปิดไฟล์ `content-review.csv` ใน Excel / Google Sheets จะกรอกได้สะดวกกว่า)',
  '',
  `มีทั้งหมด ${rows.length} แถว — ถ้ามีเวลาน้อย เริ่มจากหัวข้อ **"เริ่มตรงนี้ก่อน"** ด้านล่าง (${priorityRows.length} จุด)`,
  '',
  '- **คำอ่านไทย** เป็นเสียงโดยประมาณ — ถ้ามีแบบที่คนไทยใช้กันแพร่หลายกว่า ช่วยแนะนำได้เลย',
  '- **หมายเหตุ** คือข้อความที่แสดงใต้ตัวอักษร',
  '- **คำตัวอย่าง** ตั้งใจเลือกคำพื้นฐาน ใช้เฉพาะตัวที่เว็บสอนแล้ว (รวมตัวเล็กและตัวควบ) และใส่คันจิเฉพาะคำที่ปกติเขียนด้วยคันจิ',
  '  — ตัวควบบางตัว (เช่น にょ ひゅ みゅ) แทบไม่มีคำพื้นฐานที่ใช้ จึงเว้นว่างไว้ ถ้านึกคำที่เหมาะได้ช่วยแนะนำ',
  '- **ตัวเล็ก (ゃ ゅ ょ っ) และ ー** ไม่มีเสียงของตัวเอง โรมาจิ/คำอ่านไทยในแถวเหล่านี้เป็นแค่ป้ายกำกับ ช่วยดูที่หมายเหตุเป็นหลัก',
  '- **โรมาจิของคำ** สะกดตามตัวคานะ (おう = ou, ー = สระซ้ำ) เพื่อให้มือใหม่เทียบทีละตัวได้',
  '- ลำดับขีดมาจากข้อมูล KanjiVG และตรวจจำนวนขีดกับตำราแล้ว — ถ้าเห็นตัวไหนลำดับขีดแปลก ช่วยบอกด้วย',
  '- อีกหน้าที่มีเนื้อหาภาษาญี่ปุ่นคือหน้า **“เริ่มต้นที่นี่”** (`/start`) ช่วยอ่านบนเว็บด้วย',
  '  (คู่คำในบทเรียน "ตัวเล็กและเสียงยาว" ของหน้านั้นอยู่ท้ายตารางนี้แล้ว)',
  '',
  ...prioritySection,
  ...scriptList.flatMap((pack) => [
    `## ${pack.name} (${pack.nameJa}) — ${pack.chars.length} ตัว`,
    '',
    mdTable(rows.filter((r) => r[0] === pack.name)),
    '',
  ]),
  `## ${PAIRS_SET} — ${MINIMAL_PAIRS.length} คู่ (หน้า “เริ่มต้นที่นี่” หัวข้อ 6)`,
  '',
  'คู่คำที่ต่างกันแค่ตัวควบ / っ / เสียงยาว ใช้ฟังเทียบและในแบบฝึก "ฟังแล้วเลือกคำที่ได้ยิน" — ช่วยดูว่าเป็นคู่ที่ดี ความหมายถูก และออกเสียงต่างกันชัด',
  '',
  mdTable(rows.filter((r) => r[0] === PAIRS_SET)),
  '',
  ...vocabDecks.flatMap((deck) => [
    `## ${deck.name} — ${Object.keys(deck.words).length} คำ (${deck.lessons.length} บท)`,
    '',
    'รายการคำมาจากรายการ JLPT N5 ของ Jonathan Waller · คำอ่านและคันจิตรวจกับพจนานุกรม JMdict',
    '**ความหมายภาษาไทยและหมายเหตุเขียนโดยผู้พัฒนา ยังไม่มีใครตรวจ**',
    '— ช่วยดูว่าความหมายถูก เหมาะกับผู้เริ่มต้น และหมายเหตุ (วิธีใช้ / ความสุภาพ) ไม่ทำให้เข้าใจผิด',
    '- คันจิใส่เฉพาะคำที่ปกติเขียนด้วยคันจิ (คำที่ปกติเขียนด้วยคานะจะเว้นไว้)',
    '- โรมาจิใช้แบบ Hepburn ที่สะกดตามคานะ (おう = ou, ー = สระซ้ำ, ん ก่อนสระ = n\') ยกเว้น は ที่อ่านว่า wa ในวลีทักทายและ では / それでは (こんにちは = konnichiwa)',
    '- คำที่ความหมายเหมือนกัน (เช่น あに กับ おにいさん) ตั้งใจให้ความหมายไทยตรงกัน แล้วอธิบายความต่างในหมายเหตุ',
    '- ตรวจรอบแรกโดยผู้ช่วย AI อีกชุดแล้ว (2026-11-19: แก้ไป ~35 จุด) แต่ยังต้องการผู้รู้ภาษาญี่ปุ่นตัวจริงยืนยัน',
    '',
    ...deck.segments
      .filter((s) => s.lessons.length)
      .flatMap((s) => [`### ${s.title} (${s.name})`, '', mdTable(rows.filter((r) => r[0] === segmentSet(deck, s))), '']),
  ]),
].join('\n');

await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, 'content-review.md'), md, 'utf8');
await writeFile(join(OUT_DIR, 'content-review.csv'), csv, 'utf8');
console.log(`✔ ${rows.length} แถว → docs/content-review.md, docs/content-review.csv`);
