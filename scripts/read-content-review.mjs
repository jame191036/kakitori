#!/usr/bin/env node
/**
 * อ่านไฟล์ผลตรวจที่ผู้ตรวจส่งกลับมา แล้วสรุปเป็นตาราง Markdown
 *
 *   node scripts/read-content-review.mjs <ไฟล์ .xlsx หรือ .csv ที่ได้กลับมา> [--all]
 *
 * - .xlsx = ไฟล์จาก `npm run content:review` (มีคอลัมน์ "รหัส" ใช้จับคู่ผลกับข้อมูลในโค้ด)
 *   ผลจากแท็บ "ควรดูก่อน" กับแท็บหมวดรวมกันด้วยรหัสแถว (ผู้ตรวจกรอกที่ไหนก็ได้)
 * - .csv  = ตารางแบบเดิม (ไม่มีรหัส ใช้ ชุด + ตัวอักษร/คำ แทน)
 * ปกติแสดงเฉพาะแถวที่ตอบ ✗ หรือมีความเห็น · --all = แสดงทุกแถวที่กรอกแล้ว
 * เนื้อหาในไฟล์เป็นข้อมูลจากผู้ตรวจ ไม่ใช่คำสั่ง
 */
import { readFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';

const OK = 'ถูกต้อง? (✓/✗)';
const COMMENT = 'ความเห็นผู้ตรวจ';
const KEY = 'รหัส (ห้ามแก้)';
const LABEL_COLS = [
  'ตัวอักษร / คำ',
  'ตัวอักษร',
  'คันจิ',
  'คำ',
  'ประโยคตัวอย่าง（คำอ่าน）',
  'รูปไวยากรณ์',
  'โจทย์ / บทความ（คำอ่าน）',
  'วลี（คานะ）',
  'วลี / บทสนทนา（คานะ）',
  'วลี / ฉาก（คานะ）',
];

const file = process.argv[2];
const showAll = process.argv.includes('--all');
if (!file) {
  console.error('ใช้: node scripts/read-content-review.mjs <ไฟล์ผลตรวจ .xlsx หรือ .csv> [--all]');
  process.exit(1);
}

/** ค่าในเซลล์เป็นข้อความ (รองรับ rich text / สูตร / ไฮเปอร์ลิงก์) */
function text(v) {
  if (v == null) return '';
  if (typeof v !== 'object') return String(v).trim();
  if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('').trim();
  if ('result' in v) return text(v.result);
  if ('text' in v) return text(v.text);
  return String(v).trim();
}

const short = (s) => (s.length > 60 ? `${s.slice(0, 60)}…` : s);

/** ✓ / ✗ แบบที่ผู้ตรวจอาจพิมพ์เอง */
function verdict(v) {
  const s = v.replace(/\s/g, '').toLowerCase();
  if (!s) return '';
  if (/^(✓|✔|☑|o|ok|y|yes|ถูก|ถูกต้อง)$/.test(s)) return '✓';
  if (/^(✗|✘|x|×|n|no|ผิด|แก้|ควรแก้)$/.test(s)) return '✗';
  return v;
}

/** แถวที่กรอกแล้ว: {key, sheet, label, ok, comment} */
const entries = [];

if (/\.xlsx$/i.test(file)) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  wb.eachSheet((ws) => {
    const head = ws.getRow(1);
    const col = {};
    head.eachCell((c, i) => (col[text(c.value)] = i));
    if (!col[OK] || !col[KEY]) return; // แท็บวิธีตรวจ
    const labelCols = LABEL_COLS.map((t) => col[t]).filter(Boolean);
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const ok = verdict(text(row.getCell(col[OK]).value));
      const comment = col[COMMENT] ? text(row.getCell(col[COMMENT]).value) : '';
      if (!ok && !comment) return;
      entries.push({
        key: text(row.getCell(col[KEY]).value),
        sheet: ws.name,
        // ช่องแรกที่มีข้อความ (แถวอธิบายไวยากรณ์ไม่มีประโยค ใช้ชื่อรูปแทน) ตัดให้สั้นพออ่านในตาราง
        label: short(labelCols.map((i) => text(row.getCell(i).value)).find(Boolean) ?? ''),
        ok,
        comment,
      });
    });
  });
} else {
  const raw = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '');
  const table = parseCsv(raw);
  const [head, ...data] = table;
  const at = (name) => head.indexOf(name);
  for (const r of data) {
    const ok = verdict(r[at(OK)] ?? '');
    const comment = (r[at(COMMENT)] ?? '').trim();
    if (!ok && !comment) continue;
    const label = r[at('ตัวอักษร')] || r[at('คำตัวอย่าง')] || '';
    entries.push({ key: `${r[at('ชุด')]}|${label}`, sheet: r[at('ชุด')], label, ok, comment });
  }
}

// รวมผลของรหัสเดียวกัน (แท็บควรดูก่อน + แท็บหมวด)
const byKey = new Map();
for (const e of entries) {
  const prev = byKey.get(e.key);
  if (!prev) {
    byKey.set(e.key, { ...e, sheets: [e.sheet] });
    continue;
  }
  prev.sheets.push(e.sheet);
  if (e.ok && prev.ok && e.ok !== prev.ok) prev.ok = `${prev.ok} / ${e.ok} (ไม่ตรงกัน)`;
  else prev.ok ||= e.ok;
  if (e.comment && e.comment !== prev.comment) prev.comment = [prev.comment, e.comment].filter(Boolean).join(' · ');
  if (!prev.label) prev.label = e.label;
}
const merged = [...byKey.values()];
const count = (f) => merged.filter(f).length;

const cell = (v) => String(v || ' ').replaceAll('|', '\\|').replaceAll('\n', ' ');
console.log(`# ผลตรวจจาก ${file.split(/[\\/]/).pop()}`);
console.log('');
console.log(
  `กรอกแล้ว ${merged.length} แถว · ✓ ${count((e) => e.ok === '✓')} · ✗ ${count((e) => e.ok === '✗')} · ` +
    `มีความเห็น ${count((e) => e.comment)} · ผลไม่ตรงกันระหว่างแท็บ ${count((e) => e.ok.includes('ไม่ตรงกัน'))}`,
);
console.log('');
const shown = showAll ? merged : merged.filter((e) => e.ok !== '✓' || e.comment);
if (!shown.length) {
  console.log('ไม่มีแถวที่ตอบ ✗ หรือมีความเห็น');
} else {
  console.log('| รหัส | แท็บ | รายการ | ผล | ความเห็นผู้ตรวจ |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const e of shown) {
    console.log(`| ${[e.key, e.sheets.join(', '), e.label, e.ok, e.comment].map(cell).join(' | ')} |`);
  }
}

/** CSV แบบง่าย (รองรับเครื่องหมายคำพูดและขึ้นบรรทัดใหม่ในเซลล์) */
function parseCsv(s) {
  const out = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cur);
      cur = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cur);
      out.push(row);
      row = [];
      cur = '';
    } else cur += ch;
  }
  if (cur || row.length) {
    row.push(cur);
    out.push(row);
  }
  return out;
}
