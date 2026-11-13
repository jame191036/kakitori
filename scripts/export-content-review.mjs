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
await server.close();

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
  'ถูกต้อง? (✓/✗)',
  'ความเห็นผู้ตรวจ',
];

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
      '',
      '',
    ]);
  }
}

// ── CSV (มี BOM เพื่อให้ Excel แสดงภาษาไทย/ญี่ปุ่นถูกต้อง) ──
const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const csv = '\uFEFF' + [COLUMNS, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

// ── Markdown ──
const mdCell = (v) => v.replaceAll('|', '\\|').replaceAll('\n', ' ') || ' ';
const mdTable = (list) =>
  [
    `| ${COLUMNS.slice(1).join(' | ')} |`,
    `| ${COLUMNS.slice(1).map(() => '---').join(' | ')} |`,
    ...list.map((r) => `| ${r.slice(1).map(mdCell).join(' | ')} |`),
  ].join('\n');

const md = [
  '# ตารางตรวจเนื้อหาภาษาญี่ปุ่น',
  '',
  '> ไฟล์นี้สร้างอัตโนมัติด้วย `npm run content:review` — อย่าแก้ไฟล์นี้โดยตรง ให้แก้ที่ `src/data/scripts/*.ts` แล้วรันใหม่',
  '',
  '## สำหรับผู้ช่วยตรวจ',
  '',
  'ขอบคุณที่ช่วยตรวจครับ เว็บนี้สอนคนไทยที่ไม่รู้ภาษาญี่ปุ่นเลยให้เขียนฮิรางานะและคาตาคานะ',
  'รบกวนช่วยดูว่าข้อมูลแต่ละแถวถูกต้องและเหมาะกับผู้เริ่มต้นไหม แล้วใส่ ✓ หรือ ✗ พร้อมความเห็น',
  '(แนะนำให้เปิดไฟล์ `content-review.csv` ใน Excel / Google Sheets จะกรอกได้สะดวกกว่า)',
  '',
  '- **คำอ่านไทย** เป็นเสียงโดยประมาณ — ถ้ามีแบบที่คนไทยใช้กันแพร่หลายกว่า ช่วยแนะนำได้เลย',
  '- **หมายเหตุ** คือข้อความที่แสดงใต้ตัวอักษร',
  '- **คำตัวอย่าง** ตั้งใจเลือกคำพื้นฐาน ไม่มีตัวเล็ก (ゃ ゅ ょ っ) เพราะยังไม่ได้สอน และใส่คันจิเฉพาะคำที่ปกติเขียนด้วยคันจิ',
  '- **โรมาจิของคำ** สะกดตามตัวคานะ (おう = ou, ー = สระซ้ำ) เพื่อให้มือใหม่เทียบทีละตัวได้',
  '- ลำดับขีดมาจากข้อมูล KanjiVG และตรวจจำนวนขีดกับตำราแล้ว — ถ้าเห็นตัวไหนลำดับขีดแปลก ช่วยบอกด้วย',
  '- อีกหน้าที่มีเนื้อหาภาษาญี่ปุ่นคือหน้า **“เริ่มต้นที่นี่”** (`/start`) ช่วยอ่านบนเว็บด้วย',
  '',
  ...scriptList.flatMap((pack) => [
    `## ${pack.name} (${pack.nameJa}) — ${pack.chars.length} ตัว`,
    '',
    mdTable(rows.filter((r) => r[0] === pack.name)),
    '',
  ]),
].join('\n');

await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, 'content-review.md'), md, 'utf8');
await writeFile(join(OUT_DIR, 'content-review.csv'), csv, 'utf8');
console.log(`✔ ${rows.length} แถว → docs/content-review.md, docs/content-review.csv`);
