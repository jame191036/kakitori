#!/usr/bin/env node
/**
 * ดึงข้อมูลลำดับขีด (stroke order) จาก KanjiVG แล้วแปลงเป็น JSON ขนาดเล็ก
 * สำหรับใช้ในเว็บ — รันเฉพาะตอนต้องการอัปเดตข้อมูลเท่านั้น (ไม่ได้รันตอน build)
 *
 *   npm run data:strokes                 # สร้างทุกชุด
 *   npm run data:strokes -- hiragana     # สร้างเฉพาะชุดที่ระบุ
 *   KANJIVG_REF=<sha|tag> npm run data:strokes   # ล็อกเวอร์ชันของ KanjiVG
 *
 * ข้อมูล KanjiVG: Copyright (C) Ulrich Apel, ใช้สัญญาอนุญาต CC BY-SA 3.0
 * https://kanjivg.tagaini.net  —  ไฟล์ JSON ที่ได้จึงอยู่ภายใต้ CC BY-SA 3.0 เช่นกัน
 *
 * การเพิ่มชุดตัวอักษรใหม่ (เช่น คาตาคานะ): เพิ่มรายการใน SETS ด้านล่าง
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src', 'data', 'strokes');
const REPO = 'KanjiVG/kanjivg';

const SETS = {
  hiragana: [
    'あいうえお',
    'かきくけこ',
    'さしすせそ',
    'たちつてと',
    'なにぬねの',
    'はひふへほ',
    'まみむめも',
    'やゆよ',
    'らりるれろ',
    'わをん',
    'がぎぐげご',
    'ざじずぜぞ',
    'だぢづでど',
    'ばびぶべぼ',
    'ぱぴぷぺぽ',
  ].join(''),
};

async function resolveRef() {
  if (process.env.KANJIVG_REF) return process.env.KANJIVG_REF;
  const res = await fetch(`https://api.github.com/repos/${REPO}/commits/master`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'kana-practice-data-script' },
  });
  if (!res.ok) throw new Error(`ไม่สามารถดึง commit ล่าสุดของ KanjiVG ได้ (${res.status})`);
  const json = await res.json();
  return json.sha;
}

function hexOf(char) {
  return char.codePointAt(0).toString(16).padStart(5, '0');
}

const round2 = (n) => Math.round(n * 100) / 100;

/** แยก path ของแต่ละขีด และตำแหน่งตัวเลขลำดับขีด ออกจากไฟล์ SVG ของ KanjiVG */
function parseKanjiVG(svg, hex) {
  const strokes = [];
  for (const tag of svg.match(/<path\b[^>]*>/g) ?? []) {
    const id = /\bid="kvg:([0-9a-f]+)-s(\d+)"/.exec(tag);
    const d = /\sd="([^"]+)"/.exec(tag);
    if (!id || !d || id[1] !== hex) continue;
    strokes.push({ n: Number(id[2]), d: d[1].trim() });
  }
  strokes.sort((a, b) => a.n - b.n);
  strokes.forEach((s, i) => {
    if (s.n !== i + 1) throw new Error(`ลำดับขีดของ ${hex} ไม่ต่อเนื่อง`);
  });

  const numbers = [];
  const re = /<text transform="matrix\(1 0 0 1 ([\d.-]+) ([\d.-]+)\)">(\d+)<\/text>/g;
  for (let m = re.exec(svg); m; m = re.exec(svg)) {
    numbers[Number(m[3]) - 1] = [round2(Number(m[1])), round2(Number(m[2]))];
  }
  if (numbers.length !== strokes.length || numbers.some((p) => !p)) {
    throw new Error(`ตำแหน่งตัวเลขลำดับขีดของ ${hex} ไม่ครบ`);
  }
  return { strokes: strokes.map((s) => s.d), numbers };
}

async function buildSet(name, chars, ref) {
  const out = {};
  for (const char of chars) {
    const hex = hexOf(char);
    const url = `https://raw.githubusercontent.com/${REPO}/${ref}/kanji/${hex}.svg`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ดาวน์โหลด ${char} (${hex}) ไม่สำเร็จ: ${res.status}`);
    out[char] = parseKanjiVG(await res.text(), hex);
    process.stdout.write(`${char}${out[char].strokes.length} `);
  }
  process.stdout.write('\n');

  const file = {
    source: 'KanjiVG — https://kanjivg.tagaini.net',
    copyright: 'Copyright (C) Ulrich Apel',
    license: 'CC BY-SA 3.0 — https://creativecommons.org/licenses/by-sa/3.0/',
    ref,
    viewBox: 109,
    chars: out,
  };
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.json`);
  await writeFile(path, JSON.stringify(file, null, 1) + '\n', 'utf8');
  console.log(`✔ ${name}: ${Object.keys(out).length} ตัว → ${path}`);
}

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(SETS);
const unknown = names.filter((n) => !SETS[n]);
if (unknown.length) {
  console.error(`ไม่รู้จักชุดตัวอักษร: ${unknown.join(', ')} (มี: ${Object.keys(SETS).join(', ')})`);
  process.exit(1);
}

const ref = await resolveRef();
console.log(`KanjiVG ref: ${ref}`);
for (const name of names) await buildSet(name, [...SETS[name]], ref);
