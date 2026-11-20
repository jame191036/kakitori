#!/usr/bin/env node
/**
 * ทำฟอนต์ Klee One ชุดย่อยเฉพาะคันจิที่เว็บใช้ (จากข้อความทุกไฟล์ใน src/) — รันเมื่อมีคันจิใหม่ในเนื้อหา
 *
 *   npm run data:kanji-font
 *
 * ดึงจาก Google Fonts (พารามิเตอร์ text= ได้ไฟล์ woff2 เฉพาะตัวที่ขอ) แล้วเก็บไว้ในเว็บเอง
 * → แสดงคันจิด้วยฟอนต์เดียวกับคานะ และใช้ได้ตอนออฟไลน์ (PWA เก็บไฟล์นี้ไว้ด้วย)
 * แยกฟอนต์เป็น 2 ไฟล์ด้วย unicode-range — เบราว์เซอร์โหลดเฉพาะไฟล์ที่หน้านั้นมีคันจิอยู่:
 *   klee-one-kanji-ui-<น้ำหนัก>.woff2 = คันจิบนหัวเว็บ หน้าแรก และหน้าศูนย์รวม (ไม่กี่สิบตัว — หน้าแรกโหลดแค่ไฟล์นี้)
 *   klee-one-kanji-<น้ำหนัก>.woff2    = คันจิที่เหลือ (เนื้อหาบทเรียน)
 * และ src/styles/kanji-font.css + src/styles/kanjiFontChars.ts (ให้เทสตรวจว่าครอบคลุม)
 *
 * Klee One © Fontworks Inc. — SIL Open Font License 1.1 (อนุญาตให้ตัดชุดย่อยและแจกจ่ายพร้อมเว็บได้)
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const FONT_DIR = join(SRC, 'assets', 'fonts');
const CSS_FILE = join(SRC, 'styles', 'kanji-font.css');
const CHARS_FILE = join(SRC, 'styles', 'kanjiFontChars.ts');
// น้ำหนักปกติอย่างเดียว: คันจิตัวหนาในเว็บมีน้อย เบราว์เซอร์ทำตัวหนาให้เองได้ (ประหยัด ~140 KB)
const WEIGHTS = [400];
// ขอ woff2 แบบเบราว์เซอร์ปัจจุบัน
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function* sourceFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) yield path;
  }
}

/** ไฟล์ที่แสดงบนทุกหน้า/หน้าแรก — คันจิในไฟล์พวกนี้อยู่ในฟอนต์ไฟล์เล็ก */
const isUiFile = (path) => {
  const rel = path.slice(SRC.length + 1).replaceAll('\\', '/');
  return (
    rel.startsWith('app/') ||
    rel.startsWith('components/') ||
    /^pages\/(HomePage|N5HubPage|KanaHubPage|ReviewHubPage|NotFoundPage)\.tsx$/.test(rel)
  );
};

const HAN = /\p{Script=Han}/u;
const all = new Set();
const ui = new Set();
for await (const file of sourceFiles(SRC)) {
  for (const c of await readFile(file, 'utf8')) {
    if (!HAN.test(c)) continue;
    all.add(c);
    if (isUiFile(file)) ui.add(c);
  }
}
// 々 (ซ้ำตัวหน้า) ไม่ใช่ Script=Han แต่ใช้ในคำ เช่น 時々
all.add('々');
const content = [...all].filter((c) => !ui.has(c));
const text = [...all].sort().join('');
console.log(`คันจิที่ใช้ในเว็บ: ${all.size} ตัว (หัวเว็บ/หน้าแรก ${ui.size} ตัว · เนื้อหา ${content.length} ตัว)`);

const range = (chars) =>
  [...chars]
    .map((c) => c.codePointAt(0))
    .sort((a, b) => a - b)
    .map((cp) => `U+${cp.toString(16)}`)
    .join(',');

await mkdir(FONT_DIR, { recursive: true });
const faces = [];
for (const weight of WEIGHTS) {
  for (const [part, chars] of [
    ['ui-', [...ui]],
    ['', content],
  ]) {
    const want = chars.sort().join('');
    const url = `https://fonts.googleapis.com/css2?family=Klee+One:wght@${weight}&text=${encodeURIComponent(want)}`;
    const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
    const src = /src:\s*url\(([^)]+)\)\s*format\('woff2'\)/.exec(css)?.[1];
    if (!src) throw new Error(`ไม่พบไฟล์ woff2 ของน้ำหนัก ${weight}:\n${css.slice(0, 400)}`);
    const font = Buffer.from(await (await fetch(src)).arrayBuffer());
    const name = `klee-one-kanji-${part}${weight}.woff2`;
    await writeFile(join(FONT_DIR, name), font);
    console.log(`✔ ${name} ${(font.length / 1024).toFixed(1)} KB`);
    faces.push({ weight, name, range: range(chars) });
  }
}

const out = [
  '/*',
  ' * สร้างอัตโนมัติด้วย npm run data:kanji-font (scripts/fetch-kanji-font.mjs) — อย่าแก้เอง',
  ` * Klee One ชุดย่อยเฉพาะคันจิ ${all.size} ตัวที่เว็บใช้ · SIL Open Font License 1.1 (© Fontworks Inc.)`,
  ' * 2 ไฟล์แยกด้วย unicode-range: หัวเว็บ/หน้าแรก (ไฟล์เล็ก) และเนื้อหา — เบราว์เซอร์โหลดเฉพาะไฟล์ที่หน้านั้นใช้',
  ' */',
  '',
  ...faces.flatMap(({ weight, name, range: r }) => [
    '@font-face {',
    "  font-family: 'Klee One';",
    '  font-style: normal;',
    '  font-display: swap;',
    `  font-weight: ${weight};`,
    `  src: url('../assets/fonts/${name}') format('woff2');`,
    `  unicode-range: ${r};`,
    '}',
    '',
  ]),
].join('\n');
await writeFile(CSS_FILE, out, 'utf8');
console.log(`✔ ${CSS_FILE}`);

// รายชื่อคันจิในฟอนต์ ให้เทสตรวจว่าครอบคลุมคันจิทุกตัวในเว็บ (Vitest อ่านไฟล์ CSS ไม่ได้)
await writeFile(
  CHARS_FILE,
  [
    '// สร้างอัตโนมัติด้วย npm run data:kanji-font — อย่าแก้เอง (ใช้ในเทส kanjiFont.test.ts เท่านั้น)',
    `export const KANJI_FONT_CHARS = '${text}';`,
    '',
  ].join('\n'),
  'utf8',
);
console.log(`✔ ${CHARS_FILE}`);
