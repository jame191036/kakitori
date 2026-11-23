#!/usr/bin/env node
/**
 * สร้างตารางเนื้อหาภาษาญี่ปุ่นทั้งหมด ไว้ส่งให้ผู้รู้ภาษาญี่ปุ่นช่วยตรวจ
 *
 *   npm run content:review
 *
 * ได้ 3 ไฟล์ (ดึงจากข้อมูลจริงในโค้ดทุกครั้ง จึงตรงกับเว็บเสมอ):
 *   docs/content-review.md   — อ่านบน GitHub หรือพิมพ์ออกมาได้
 *   docs/content-review.csv  — ตารางเดียวยาว (ใช้เทียบการเปลี่ยนแปลงใน git)
 *   docs/content-review.xlsx — ไฟล์ที่ส่งให้ผู้ตรวจ: แท็บวิธีตรวจ · แท็บควรดูก่อน · แท็บแยกตามหมวด
 *                              (ผลตรวจที่ส่งกลับมา อ่านด้วย scripts/read-content-review.mjs)
 * ไฟล์ .xlsx เขียนใหม่เฉพาะเมื่อเนื้อหาเปลี่ยน (ไฟล์ไบนารีจะได้ไม่เปลี่ยนใน git ทุกครั้งที่รัน)
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { createServer } from 'vite';
import {
  EXAM_PRIORITY,
  GRAMMAR_PRIORITY,
  KANA_PRIORITY,
  KANJI_PRIORITY,
  VOCAB_PRIORITY,
} from './content-review-priority.mjs';

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
const { N5_DECK } = await server.ssrLoadModule('/src/data/vocab/n5/index.ts');
const { KANJI_N5 } = await server.ssrLoadModule('/src/data/kanji/n5/index.ts');
const { GRAMMAR_N5 } = await server.ssrLoadModule('/src/data/grammar/n5/index.ts');
const { parseInline, plainOf } = await server.ssrLoadModule('/src/data/grammar/sentence.ts');
const { EXAM_SETS } = await server.ssrLoadModule('/src/data/exam/n5/index.ts');
const { KIND_INFO } = await server.ssrLoadModule('/src/data/exam/build.ts');
const { examPlain, examWithReading, passageSegs } = await server.ssrLoadModule('/src/data/exam/text.ts');
const { answerSentence } = await server.ssrLoadModule('/src/features/exam/examLogic.ts');
await server.close();

// จุดที่ควรให้ผู้ตรวจดูก่อน — ตรวจว่า id ในรายการมีอยู่จริง (กันพิมพ์ผิดแล้วหายเงียบ)
const usedPriority = new Set();
const PRIORITY_TABLES = {
  kana: KANA_PRIORITY,
  vocab: VOCAB_PRIORITY,
  kanji: KANJI_PRIORITY,
  grammar: GRAMMAR_PRIORITY,
  exam: EXAM_PRIORITY,
};
const priorityOf = (tag, key) => {
  const reason = PRIORITY_TABLES[tag][key];
  if (reason) usedPriority.add(`${tag}:${key}`);
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

/**
 * แถวของตาราง (ลำดับตาม COLUMNS) + `key` = รหัสถาวรของแถว ใช้จับคู่ผลตรวจที่ส่งกลับมากับข้อมูลในโค้ด
 * และ `sheet` = แท็บในไฟล์ Excel
 */
const rows = [];
const tag = (row, key, sheet) => Object.assign(row, { key, sheet });
for (const pack of scriptList) {
  for (const c of pack.chars) {
    const group = pack.groups.find((g) => g.id === c.group);
    const ex = c.example;
    rows.push(tag([
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
      pack.id === 'hiragana' ? priorityOf('kana', c.id) : '',
      '',
      '',
    ], `${pack.id}:${c.id}`, pack.name));
  }
}

// คู่คำฝึกฟัง: 1 แถวต่อ 1 คำ — หมายเหตุบอกว่าคู่กับคำไหน
const wordCell = (w) => (w.kanji ? `${w.kana}（${w.kanji}）` : w.kana);
for (const p of MINIMAL_PAIRS) {
  for (const [w, other] of [
    [p.plain, p.marked],
    [p.marked, p.plain],
  ]) {
    rows.push(
      tag(
        [PAIRS_SET, PAIR_KIND_LABEL[p.kind], '', '', '', `คู่กับ ${other.kana}`, wordCell(w), w.romaji, w.meaning, '', '', '', ''],
        `pair:${w.kana}`,
        PAIRS_SET,
      ),
    );
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
        rows.push(tag([
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
          priorityOf('vocab', id),
          '',
          '',
        ], `${deck.id}:${id}`, deck.name));
      }
    }
  }
}

// คันจิ: 1 แถวต่อ 1 ตัว — "คำอ่านไทย" ใช้แสดงคำอ่าน (อง/คุง), "คำตัวอย่าง" = คำศัพท์ที่ใช้คำอ่านนั้น
const kanjiSet = (segment) => `${KANJI_N5.name} · ${segment.title}`;
const KIND_TH = { on: 'อง', kun: 'คุง' };
for (const segment of KANJI_N5.segments) {
  for (const lesson of segment.lessons) {
    for (const id of lesson.words) {
      const e = KANJI_N5.words[id];
      const readings = e.readings.map((r) => `${KIND_TH[r.kind]} ${r.kana}`).join(' · ');
      const word = (wid) => {
        const w = N5_DECK.words[wid];
        return w ? `${w.kanji ?? w.kana}（${w.kana}）` : wid;
      };
      const examples = [
        ...e.readings.flatMap((r) => r.words.map(word)),
        ...(e.extra ?? []).map((x) => `${x.written}（${x.kana}）`),
        ...(e.special ?? []).map((wid) => `${word(wid)} [อ่านพิเศษ]`),
      ].join(' ');
      rows.push(tag([
        kanjiSet(segment),
        `${lessonCode(KANJI_N5, lesson)} ${lesson.title}`,
        e.char,
        '',
        readings,
        [`${e.strokes} ขีด`, e.note].filter(Boolean).join(' · '),
        examples,
        '',
        e.thai,
        '',
        priorityOf('kanji', e.char),
        '',
        '',
      ], `${KANJI_N5.id}:${e.char}`, KANJI_N5.name));
    }
  }
}

// ไวยากรณ์: 1 แถวต่อรูป (รูปประโยค ความหมาย คำอธิบาย) + 1 แถวต่อประโยคตัวอย่าง
// แถวประโยค: "คำตัวอย่าง" = ประโยคแบบเขียนจริง（คานะ）· "หมายเหตุ" = ส่วนไวยากรณ์ + ตัวเลือกผิดในข้อเติมคำ
const grammarSet = (segment) => `${GRAMMAR_N5.name} · ${segment.title}`;
for (const segment of GRAMMAR_N5.segments) {
  for (const lesson of segment.lessons) {
    for (const id of lesson.words) {
      const p = GRAMMAR_N5.words[id];
      const where = `${lessonCode(GRAMMAR_N5, lesson)} ${lesson.title}`;
      rows.push(tag([
        grammarSet(segment),
        where,
        p.pattern,
        '',
        '',
        [...p.explain, p.note].filter(Boolean).join(' · '),
        '',
        '',
        p.title,
        '',
        priorityOf('grammar', id),
        '',
        '',
      ], `${GRAMMAR_N5.id}:${id}`, GRAMMAR_N5.name));
      p.examples.forEach((ex, i) => {
        const s = ex.sentence;
        const wrong = ex.wrong.map((w) => plainOf(parseInline(w))).join(' / ');
        rows.push(tag([
          grammarSet(segment),
          where,
          '',
          '',
          '',
          `ส่วนไวยากรณ์: ${s.target} · ตัวเลือกผิด: ${wrong}${ex.arrange ? ' · ใช้ทำข้อเรียงประโยค' : ''}`,
          `${s.plain}${s.end}（${s.kana}）`,
          '',
          ex.thai,
          '',
          '',
          '',
          '',
        ], `${GRAMMAR_N5.id}:${id}#${i + 1}`, GRAMMAR_N5.name));
      });
    }
  }
}

// ข้อสอบจำลอง: 1 แถวต่อบทความ + 1 แถวต่อข้อ
// แถวข้อ: "คำตัวอย่าง" = โจทย์（คำอ่าน）— ข้อเติมคำ/เรียงประโยคแสดงประโยคที่เติมคำตอบแล้ว · "หมายเหตุ" = ตัวเลือก (✓ = ข้อที่ถูก) + เหตุผล
const EXAM_NAME = 'ข้อสอบจำลอง N5';
const oneLine = (s) => s.replaceAll('\n', ' / ');
for (const set of EXAM_SETS) {
  set.sections.forEach((section, si) => {
    for (const m of section.mondai) {
      m.groups.forEach((g, gi) => {
        const where = `ส่วนที่ ${si + 1} もんだい${m.no} · ${KIND_INFO[m.kind].th}`;
        if (g.passage) {
          rows.push(tag([
            `${EXAM_NAME} · ${set.title}`,
            where,
            '',
            '',
            '',
            `บทความของข้อ ${g.questions.map((q) => q.no).join(', ')}`,
            oneLine(examWithReading(passageSegs(g.passage))),
            '',
            g.passageThai,
            '',
            '',
            '',
            '',
          ], `exam-n5:n5-${set.id}:${section.id}${m.no}-p${gi + 1}`, EXAM_NAME));
        }
        for (const q of g.questions) {
          const filled = ['context', 'grammar-form', 'composition'].includes(q.kind);
          const choices = q.choices.map((c, i) => `${i + 1} ${examPlain(c)}${i === q.answer ? ' ✓' : ''}`).join(' · ');
          rows.push(tag([
            `${EXAM_NAME} · ${set.title}`,
            `${where} ข้อ ${q.no}`,
            '',
            '',
            '',
            `ตัวเลือก: ${choices} — เหตุผล: ${q.explain}`,
            q.stem ? oneLine(examWithReading(filled ? answerSentence(q) : q.stem)) : `(ช่อง ${q.no} ในบทความ)`,
            '',
            q.thai,
            '',
            priorityOf('exam', q.id),
            '',
            '',
          ], `exam-n5:${q.id}`, EXAM_NAME));
        }
      });
    }
  });
}

const missing = Object.entries(PRIORITY_TABLES)
  .flatMap(([tag, table]) => Object.keys(table).map((k) => `${tag}:${k}`))
  .filter((k) => !usedPriority.has(k));
if (missing.length) throw new Error(`content-review-priority: ไม่พบ id ${missing.join(', ')}`);
const priorityRows = rows.filter((r) => r[PRIORITY_COL]);

const keys = rows.map((r) => r.key);
const dupKeys = keys.filter((k, i) => keys.indexOf(k) !== i);
if (dupKeys.length) throw new Error(`รหัสแถวซ้ำ: ${[...new Set(dupKeys)].join(', ')}`);

// ── คำอธิบายสำหรับผู้ตรวจ (ใช้ทั้งใน .md และแท็บ "วิธีตรวจ" ของ .xlsx — ** = ตัวหนาใน Markdown) ──
const GENERAL_NOTES = [
  '**คำอ่านไทย** เป็นเสียงโดยประมาณ — ถ้ามีแบบที่คนไทยใช้กันแพร่หลายกว่า ช่วยแนะนำได้เลย',
  '**หมายเหตุ** คือข้อความที่แสดงใต้ตัวอักษร / คำ / คันจิบนเว็บ',
  '**คำตัวอย่าง** ตั้งใจเลือกคำพื้นฐาน ใช้เฉพาะตัวที่เว็บสอนแล้ว (รวมตัวเล็กและตัวควบ) และใส่คันจิเฉพาะคำที่ปกติเขียนด้วยคันจิ — ตัวควบบางตัว (เช่น にょ ひゅ みゅ) แทบไม่มีคำพื้นฐานที่ใช้ จึงเว้นว่างไว้ ถ้านึกคำที่เหมาะได้ช่วยแนะนำ',
  '**ตัวเล็ก (ゃ ゅ ょ っ) และ ー** ไม่มีเสียงของตัวเอง โรมาจิ/คำอ่านไทยในแถวเหล่านี้เป็นแค่ป้ายกำกับ ช่วยดูที่หมายเหตุเป็นหลัก',
  '**โรมาจิของคำ** สะกดตามตัวคานะ (おう = ou, ー = สระซ้ำ) เพื่อให้มือใหม่เทียบทีละตัวได้',
  'ลำดับขีดมาจากข้อมูล KanjiVG และตรวจจำนวนขีดกับตำราแล้ว — ถ้าเห็นตัวไหนลำดับขีดแปลก ช่วยบอกด้วย',
  'อีกหน้าที่มีเนื้อหาภาษาญี่ปุ่นคือหน้า **“เริ่มต้นที่นี่”** บนเว็บ (ลิงก์อยู่ท้ายทุกหน้า) ไม่ได้อยู่ในตารางนี้ ช่วยอ่านบนเว็บด้วย — ส่วนคู่คำในบทเรียน "ตัวเล็กและเสียงยาว" ของหน้านั้นอยู่ในตารางแล้ว',
];
const PAIRS_NOTE =
  'คู่คำที่ต่างกันแค่ตัวควบ / っ / เสียงยาว ใช้ฟังเทียบและในแบบฝึก "ฟังแล้วเลือกคำที่ได้ยิน" — ช่วยดูว่าเป็นคู่ที่ดี ความหมายถูก และออกเสียงต่างกันชัด';
const VOCAB_INTRO =
  'รายการคำมาจากรายการ JLPT N5 ของ Jonathan Waller · คำอ่านและคันจิตรวจกับพจนานุกรม JMdict · **ความหมายภาษาไทยและหมายเหตุเขียนโดยผู้พัฒนา ยังไม่มีใครตรวจ** — ช่วยดูว่าความหมายถูก เหมาะกับผู้เริ่มต้น และหมายเหตุ (วิธีใช้ / ความสุภาพ) ไม่ทำให้เข้าใจผิด';
const VOCAB_NOTES = [
  'คันจิใส่เฉพาะคำที่ปกติเขียนด้วยคันจิ (คำที่ปกติเขียนด้วยคานะจะเว้นไว้)',
  "โรมาจิใช้แบบ Hepburn ที่สะกดตามคานะ (おう = ou, ー = สระซ้ำ, ん ก่อนสระ = n') ยกเว้น は ที่อ่านว่า wa ในวลีทักทายและ では / それでは (こんにちは = konnichiwa)",
  'คำที่ความหมายเหมือนกัน (เช่น あに กับ おにいさん) ตั้งใจให้ความหมายไทยตรงกัน แล้วอธิบายความต่างในหมายเหตุ',
  'ตรวจรอบแรกโดยผู้ช่วย AI อีกชุดแล้ว (2026-11-19: แก้ไป ~35 จุด) แต่ยังต้องการผู้รู้ภาษาญี่ปุ่นตัวจริงยืนยัน',
];
const KANJI_INTRO =
  'รายการคันจิ จำนวนขีด และคำอ่านจาก KANJIDIC2 · ลำดับขีดจาก KanjiVG · **ความหมายไทยและหมายเหตุเขียนโดยผู้พัฒนา ยังไม่มีใครตรวจ**';
const GRAMMAR_INTRO =
  'รายการรูปไวยากรณ์ตามที่ตำราเรียนระดับต้นทั่วไปสอน (JLPT ไม่มีรายการทางการ) · **คำอธิบาย ประโยคตัวอย่าง และคำแปลเขียนโดยผู้พัฒนา ยังไม่มีใครตรวจ**';
const GRAMMAR_NOTES = [
  'แต่ละรูปมี 1 แถวคำอธิบาย ตามด้วยแถวประโยคตัวอย่าง — ช่วยดูว่าคำอธิบายถูก ประโยคเป็นธรรมชาติ และคำแปลตรง',
  'ข้อเติมคำ: ผู้เรียนเห็นประโยคที่เว้น "ส่วนไวยากรณ์" ไว้ พร้อมคำแปลไทยเป็นคำใบ้ แล้วเลือกจาก 4 ตัวเลือก — ช่วยดูว่าตัวเลือกผิดผิดจริงทุกตัว (ไม่มีตัวไหนถูกได้อีก)',
  'ประโยคที่เขียนว่า "ใช้ทำข้อเรียงประโยค" ผู้เรียนต้องเรียงชิ้นประโยคตามคำแปล — ช่วยดูว่าเรียงได้แบบเดียวจริง',
  'คันจิในประโยคใช้เฉพาะคันจิ N5 พร้อมคำอ่านตัวเล็กด้านบน คำที่มีคันจินอก N5 เขียนเป็นคานะ (แบบข้อสอบ N5)',
];
const EXAM_INTRO =
  'ข้อสอบจำลองแบบเดียวกับ JLPT N5 จริง (ส่วนคำศัพท์ และส่วนไวยากรณ์ + การอ่าน ยังไม่มีการฟัง) 2 ชุด ชุดละ 43 ข้อ · **โจทย์ บทความ ตัวเลือก คำแปล และเหตุผล ผู้พัฒนาแต่งเอง ยังไม่มีใครตรวจ**';
const EXAM_NOTES = [
  'แต่ละข้อมี 4 ตัวเลือก (✓ = ข้อที่ถูก) — ช่วยดูว่ามีคำตอบถูกข้อเดียวจริง ตัวเลือกผิดผิดชัด และโจทย์เป็นภาษาญี่ปุ่นที่เป็นธรรมชาติ',
  'ข้อเติมคำและข้อเรียงประโยค แสดงประโยคที่เติมคำตอบแล้ว (ระหว่างสอบผู้เรียนเห็นเป็นช่องว่าง) — ข้อเรียงประโยคต้องเรียงได้แบบเดียว',
  'ระหว่างสอบไม่มีคำอ่านเหนือคันจิ (เหมือนสอบจริง) และใช้เฉพาะคันจิ N5 ยกเว้นตัวเลือกผิดในข้อเขียนคันจิที่ตั้งใจใช้ตัวที่หน้าคล้ายกัน',
  'บทความ/ประกาศอยู่แถวแรกของแต่ละกลุ่ม คำแปลไทยแสดงตอนดูเฉลย',
];
const KANJI_NOTES = [
  'คำอ่านเขียนเป็นฮิรางานะ (อง = เสียงจีน · คุง = เสียงญี่ปุ่น) แสดงเฉพาะคำอ่านที่ใช้ในคำศัพท์ N5 ของเว็บ — คำอ่านที่เสียงเปลี่ยนในคำเขียนคู่กัน เช่น ひ・び',
  'ช่วยดูว่าความหมายถูก คำอ่านจับคู่กับคำตัวอย่างถูก และคำที่ทำเครื่องหมาย [อ่านพิเศษ] อ่านพิเศษทั้งคำจริง',
];

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
  'ในไฟล์ Excel รวมไว้ในแท็บ "ควรดูก่อน")',
  '',
  '| ชุด | ตัวอักษร / คำ | ความหมาย / คำอ่าน | เรื่องที่อยากให้ดู |',
  '| --- | --- | --- | --- |',
  // แถวตัวอักษร: คำอ่านไทย (ช่อง 4) · แถวคำศัพท์และคันจิ: ความหมาย (ช่อง 8)
  ...priorityRows.map(
    (r) =>
      `| ${[r[0], itemCell(r), r[0].startsWith(KANJI_N5.name) ? r[8] : r[4] || r[8], r[PRIORITY_COL]].map(mdCell).join(' | ')} |`,
  ),
  '',
];

const md = [
  '# ตารางตรวจเนื้อหาภาษาญี่ปุ่น',
  '',
  '> ไฟล์นี้สร้างอัตโนมัติด้วย `npm run content:review` — อย่าแก้ไฟล์นี้โดยตรง ให้แก้ที่ `src/data/scripts/*.ts`',
  '> (ตัวอักษร), `src/data/vocab/n5/*.ts` (คำศัพท์), `src/data/kanji/n5/*.ts` (คันจิ), `src/data/grammar/n5/*.ts` (ไวยากรณ์)',
  '> หรือ `src/data/exam/n5/*.ts` (ข้อสอบจำลอง) แล้วรันใหม่',
  '> · รายการ "ควรดูก่อน" อยู่ที่ `scripts/content-review-priority.mjs`',
  '',
  '## สำหรับผู้ช่วยตรวจ',
  '',
  'ขอบคุณที่ช่วยตรวจครับ เว็บนี้สอนคนไทยที่ไม่รู้ภาษาญี่ปุ่นเลยให้อ่านเขียนฮิรางานะ คาตาคานะ คำศัพท์ คันจิ และไวยากรณ์ JLPT N5',
  'รบกวนช่วยดูว่าข้อมูลแต่ละแถวถูกต้องและเหมาะกับผู้เริ่มต้นไหม แล้วใส่ ✓ หรือ ✗ ในคอลัมน์ "ถูกต้อง?" พร้อมความเห็น',
  '(ไฟล์สำหรับกรอกผลคือ `content-review.xlsx` — เปิดใน Excel / Google Sheets ได้ มีแท็บวิธีตรวจและแท็บแยกตามหมวด)',
  '',
  `มีทั้งหมด ${rows.length} แถว — ถ้ามีเวลาน้อย เริ่มจากหัวข้อ **"เริ่มตรงนี้ก่อน"** ด้านล่าง (${priorityRows.length} จุด)`,
  '',
  ...GENERAL_NOTES.map((n) => `- ${n}`),
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
  PAIRS_NOTE,
  '',
  mdTable(rows.filter((r) => r[0] === PAIRS_SET)),
  '',
  ...vocabDecks.flatMap((deck) => [
    `## ${deck.name} — ${Object.keys(deck.words).length} คำ (${deck.lessons.length} บท)`,
    '',
    VOCAB_INTRO,
    ...VOCAB_NOTES.map((n) => `- ${n}`),
    '',
    ...deck.segments
      .filter((s) => s.lessons.length)
      .flatMap((s) => [`### ${s.title} (${s.name})`, '', mdTable(rows.filter((r) => r[0] === segmentSet(deck, s))), '']),
  ]),
  `## ${KANJI_N5.name} — ${Object.keys(KANJI_N5.words).length} ตัว (${KANJI_N5.lessons.length} บท)`,
  '',
  KANJI_INTRO,
  '- คอลัมน์ "คำอ่านไทย" ในส่วนนี้ใช้แสดงคำอ่านของคันจิ (อง = เสียงจีน · คุง = เสียงญี่ปุ่น) เขียนเป็นฮิรางานะ',
  ...KANJI_NOTES.map((n) => `- ${n}`),
  '',
  ...KANJI_N5.segments
    .filter((s) => s.lessons.length)
    .flatMap((s) => [`### ${s.title} (${s.name})`, '', mdTable(rows.filter((r) => r[0] === kanjiSet(s))), '']),
  `## ${GRAMMAR_N5.name} — ${Object.keys(GRAMMAR_N5.words).length} รูป (${GRAMMAR_N5.lessons.length} บท · เปิดแล้ว ${GRAMMAR_N5.segments.filter((s) => s.lessons.length).length} จาก ${GRAMMAR_N5.segments.length} ช่วง)`,
  '',
  GRAMMAR_INTRO,
  ...GRAMMAR_NOTES.map((n) => `- ${n}`),
  '',
  ...GRAMMAR_N5.segments
    .filter((s) => s.lessons.length)
    .flatMap((s) => [`### ${s.title} (${s.name})`, '', mdTable(rows.filter((r) => r[0] === grammarSet(s))), '']),
  `## ${EXAM_NAME} — ${EXAM_SETS.length} ชุด (ชุดละ ${EXAM_SETS[0].questions.length} ข้อ)`,
  '',
  EXAM_INTRO,
  ...EXAM_NOTES.map((n) => `- ${n}`),
  '',
  ...EXAM_SETS.flatMap((set) => [
    `### ${set.title}`,
    '',
    mdTable(rows.filter((r) => r[0] === `${EXAM_NAME} · ${set.title}`)),
    '',
  ]),
].join('\n');

// ── Excel สำหรับส่งให้ผู้ตรวจ ──
const plain = (s) => s.replaceAll('**', '').replaceAll('`', '');
const FONT = 'Tahoma';
const solid = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const INPUT_FILL = solid('FFFFF4C2'); // ช่องที่ผู้ตรวจกรอก
const HEADER_FILL = solid('FF3D55A8');
const STAR_FILL = solid('FFFBE7E2');
const KEY_FONT = { name: FONT, size: 8, color: { argb: 'FF8A857A' } };
const OK = 'ถูกต้อง? (✓/✗)';
const COMMENT = 'ความเห็นผู้ตรวจ';
const KEY = 'รหัส (ห้ามแก้)';

const at = (i) => (r) => r[i];
const segmentOfSet = (r) => r[0].split(' · ').slice(1).join(' · ');
const meaningOf = (r) => (r[0].startsWith(KANJI_N5.name) ? r[8] : r[4] || r[8]);
/** คอลัมน์ของแต่ละแท็บ: [หัวคอลัมน์, ค่า, ความกว้าง] — ต่อท้ายด้วยช่องกรอก 2 ช่องและรหัสแถวเสมอ */
const SHEETS = [
  ...scriptList.map((pack) => ({
    name: pack.name,
    match: (r) => r.sheet === pack.name,
    cols: [
      ['แถว', at(1), 14],
      ['ตัวอักษร', at(2), 9],
      ['โรมาจิ', at(3), 9],
      ['คำอ่านไทย', at(4), 12],
      ['หมายเหตุ', at(5), 42],
      ['คำตัวอย่าง', at(6), 18],
      ['โรมาจิของคำ', at(7), 13],
      ['ความหมาย', at(8), 16],
      ['ที่มาของคำ', at(9), 16],
    ],
  })),
  {
    name: PAIRS_SET,
    match: (r) => r.sheet === PAIRS_SET,
    note: PAIRS_NOTE,
    cols: [
      ['ประเภท', at(1), 12],
      ['คำ', at(6), 18],
      ['โรมาจิ', at(7), 13],
      ['ความหมาย', at(8), 22],
      ['คู่กับ', at(5), 16],
    ],
  },
  ...vocabDecks.map((deck) => ({
    name: deck.name,
    match: (r) => r.sheet === deck.name,
    cols: [
      ['ช่วง', segmentOfSet, 22],
      ['บท', at(1), 22],
      ['คำ', at(6), 22],
      ['โรมาจิ', at(7), 16],
      ['ความหมาย', at(8), 30],
      ['ชนิดคำ · หมายเหตุ', at(5), 46],
    ],
  })),
  {
    name: KANJI_N5.name,
    match: (r) => r.sheet === KANJI_N5.name,
    cols: [
      ['ช่วง', segmentOfSet, 22],
      ['บท', at(1), 22],
      ['คันจิ', at(2), 8],
      ['ความหมาย', at(8), 22],
      ['คำอ่าน', at(4), 26],
      ['จำนวนขีด · หมายเหตุ', at(5), 40],
      ['คำตัวอย่าง', at(6), 46],
    ],
  },
  {
    name: GRAMMAR_N5.name,
    match: (r) => r.sheet === GRAMMAR_N5.name,
    cols: [
      ['ช่วง', segmentOfSet, 20],
      ['บท', at(1), 22],
      ['รูปไวยากรณ์', at(2), 24],
      ['ความหมาย / คำแปล', at(8), 30],
      ['ประโยคตัวอย่าง（คำอ่าน）', at(6), 44],
      ['คำอธิบาย / ส่วนไวยากรณ์และตัวเลือกผิด', at(5), 56],
    ],
  },
  {
    name: EXAM_NAME,
    match: (r) => r.sheet === EXAM_NAME,
    cols: [
      ['ชุด', segmentOfSet, 10],
      ['ข้อ', at(1), 26],
      ['โจทย์ / บทความ（คำอ่าน）', at(6), 50],
      ['คำแปล', at(8), 34],
      ['ตัวเลือก (✓ = ข้อที่ถูก) · เหตุผล', at(5), 56],
    ],
  },
];
// ทุกแท็บหมวดมีคอลัมน์ "ควรดูก่อน" (เหตุผลเต็ม) ยกเว้นคู่คำซึ่งไม่มีจุดที่ทำเครื่องหมาย
for (const s of SHEETS) if (s.name !== PAIRS_SET) s.cols.push(['ควรดูก่อน', at(PRIORITY_COL), 30]);
const PRIORITY_SHEET = `ควรดูก่อน (${priorityRows.length})`;

function addTable(ws, cols, list, startRow) {
  const all = [...cols, [OK, () => '', 13], [COMMENT, () => '', 44], [KEY, (r) => r.key, 18]];
  all.forEach(([, , width], i) => (ws.getColumn(i + 1).width = width));
  const head = ws.getRow(startRow);
  all.forEach(([title], i) => {
    const c = head.getCell(i + 1);
    c.value = title;
    c.font = { name: FONT, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = HEADER_FILL;
    c.alignment = { vertical: 'middle', wrapText: true };
  });
  const okCol = cols.length + 1;
  const starCol = cols.findIndex(([title]) => title === 'ควรดูก่อน' || title === 'เรื่องที่อยากให้ดู') + 1;
  list.forEach((r, n) => {
    const row = ws.getRow(startRow + 1 + n);
    all.forEach(([, value], i) => {
      const c = row.getCell(i + 1);
      c.value = value(r) || null;
      c.font = { name: FONT, size: 10 };
      c.alignment = { vertical: 'top', wrapText: true };
    });
    row.getCell(okCol).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"✓,✗"'],
      showErrorMessage: true,
      errorTitle: 'ใส่ได้แค่ ✓ หรือ ✗',
      error: 'เลือก ✓ (ถูกต้อง) หรือ ✗ (ควรแก้) จากรายการ แล้วเขียนรายละเอียดในช่องความเห็น',
    };
    row.getCell(okCol).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(okCol).fill = INPUT_FILL;
    row.getCell(okCol + 1).fill = INPUT_FILL;
    row.getCell(okCol + 2).font = KEY_FONT;
    if (starCol > 0 && r[PRIORITY_COL]) row.getCell(starCol).fill = STAR_FILL;
  });
  ws.views = [{ state: 'frozen', ySplit: startRow }];
  ws.autoFilter = { from: { row: startRow, column: 1 }, to: { row: startRow + list.length, column: all.length } };
}

const wb = new ExcelJS.Workbook();
wb.creator = 'kakitori';

// แท็บ 1: วิธีตรวจ
{
  const ws = wb.addWorksheet('วิธีตรวจ', { properties: { tabColor: { argb: 'FFD9462B' } } });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 110;
  let n = 1;
  const line = (text, font = {}) => {
    const c = ws.getRow(n++).getCell(2);
    c.value = plain(text);
    c.font = { name: FONT, size: 11, ...font };
    c.alignment = { vertical: 'top', wrapText: true };
    return c;
  };
  const gap = () => n++;
  line('ตารางตรวจเนื้อหาภาษาญี่ปุ่น — เว็บ kakitori', { size: 16, bold: true });
  line(`สร้างจากข้อมูลบนเว็บเมื่อ ${new Date().toISOString().slice(0, 10)} · ทั้งหมด ${rows.length} แถว`, {
    color: { argb: 'FF6B665C' },
  });
  gap();
  line(
    'ขอบคุณที่ช่วยตรวจครับ kakitori เป็นเว็บฟรีสอนคนไทยที่ไม่รู้ภาษาญี่ปุ่นเลย ให้อ่านเขียนฮิรางานะ คาตาคานะ คำศัพท์ คันจิ และไวยากรณ์ JLPT N5 ' +
      'เนื้อหาภาษาไทยทั้งหมด (คำอ่าน ความหมาย หมายเหตุ) ประโยคตัวอย่างไวยากรณ์ และข้อสอบจำลอง ผู้พัฒนาเขียนเอง ยังไม่เคยมีผู้รู้ภาษาญี่ปุ่นตรวจ',
  );
  gap();
  line('วิธีกรอก', { size: 13, bold: true });
  line('1. ดูแต่ละแถวว่าถูกต้องและเหมาะกับผู้เริ่มต้นไหม');
  line('2. กรอกเฉพาะ 2 ช่องสีเหลืองท้ายแถว: "ถูกต้อง?" เลือก ✓ (ถูกต้อง) หรือ ✗ (ควรแก้) และ "ความเห็นผู้ตรวจ" บอกว่าควรแก้เป็นอะไร');
  line('3. ไม่ต้องแก้ช่องอื่น และห้ามแก้คอลัมน์ "รหัส" (ใช้จับคู่ผลตรวจกับข้อมูลบนเว็บ) · แถวที่ไม่แน่ใจ เว้นว่างหรือเขียนในความเห็นได้');
  line('4. ตรวจเสร็จ (หรือเสร็จบางส่วน) บันทึกไฟล์แล้วส่งกลับให้คนที่ส่งไฟล์นี้มา');
  gap();
  line('ตัวอย่างการกรอก (ข้อมูลสมมติ)', { bold: true });
  {
    const head = ws.getRow(n++);
    const ex = ws.getRow(n++);
    const cells = [
      ['คำ', 'ねこ（猫）'],
      ['ความหมาย', 'สุนัข'],
      [OK, '✗'],
      [COMMENT, 'ねこ แปลว่า แมว'],
    ];
    // ตัวอย่างใช้คอลัมน์ C เป็นต้นไป จะได้ไม่ทับข้อความยาวในคอลัมน์ B
    head.getCell(2).value = 'ในแท็บหมวด ช่องท้ายแถวจะหน้าตาแบบนี้ →';
    head.getCell(2).font = { name: FONT, size: 10, color: { argb: 'FF6B665C' } };
    cells.forEach(([title, value], i) => {
      const h = head.getCell(3 + i);
      h.value = title;
      h.font = { name: FONT, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      h.fill = HEADER_FILL;
      const c = ex.getCell(3 + i);
      c.value = value;
      c.font = { name: FONT, size: 10 };
      if (title === OK || title === COMMENT) c.fill = INPUT_FILL;
    });
    [16, 14, 13, 30].forEach((w, i) => (ws.getColumn(3 + i).width = w));
  }
  gap();
  line('เวลาน้อย? เริ่มจากแท็บ "ควรดูก่อน"', { size: 13, bold: true });
  line(
    `แท็บ "${PRIORITY_SHEET}" รวม ${priorityRows.length} จุดที่ผู้พัฒนาไม่แน่ใจที่สุด พร้อมเรื่องที่อยากให้ดู · ` +
      'แถวเหล่านี้อยู่ในแท็บหมวดด้วย (ช่อง "ควรดูก่อน" สีชมพู) — กรอกที่ไหนก็ได้ที่เดียวพอ',
  );
  gap();
  line('แท็บในไฟล์นี้', { size: 13, bold: true });
  line(`${PRIORITY_SHEET} — ${priorityRows.length} แถว`);
  for (const s of SHEETS) line(`${s.name} — ${rows.filter(s.match).length} แถว`);
  gap();
  line('เรื่องที่ควรรู้ก่อนตรวจ', { size: 13, bold: true });
  for (const note of GENERAL_NOTES) line(`• ${note}`);
  gap();
  line('คำศัพท์ N5', { bold: true });
  line(VOCAB_INTRO);
  for (const note of VOCAB_NOTES) line(`• ${note}`);
  gap();
  line('คันจิ N5', { bold: true });
  line(KANJI_INTRO);
  for (const note of KANJI_NOTES) line(`• ${note}`);
  gap();
  line('ไวยากรณ์ N5', { bold: true });
  line(GRAMMAR_INTRO);
  for (const note of GRAMMAR_NOTES) line(`• ${note}`);
  gap();
  line(EXAM_NAME, { bold: true });
  line(EXAM_INTRO);
  for (const note of EXAM_NOTES) line(`• ${note}`);
  gap();
  line('คู่คำฝึกฟัง', { bold: true });
  line(PAIRS_NOTE);
}

// แท็บ 2: ควรดูก่อน · แท็บต่อไป: แยกตามหมวด
addTable(
  wb.addWorksheet(PRIORITY_SHEET, { properties: { tabColor: { argb: 'FFF2C14E' } } }),
  [
    ['หมวด', at(0), 26],
    ['ตัวอักษร / คำ', itemCell, 18],
    ['ความหมาย / คำอ่าน', meaningOf, 22],
    ['หมายเหตุบนเว็บ', at(5), 36],
    ['เรื่องที่อยากให้ดู', at(PRIORITY_COL), 48],
  ],
  priorityRows,
  1,
);
for (const s of SHEETS) {
  const ws = wb.addWorksheet(s.name, { properties: { tabColor: { argb: 'FF3D55A8' } } });
  addTable(ws, s.cols, rows.filter(s.match), 1);
}
const sheeted = SHEETS.reduce((n, s) => n + rows.filter(s.match).length, 0);
if (sheeted !== rows.length) throw new Error(`มีแถวที่ไม่อยู่ในแท็บใด (${sheeted} จาก ${rows.length})`);

await mkdir(OUT_DIR, { recursive: true });
const csvPath = join(OUT_DIR, 'content-review.csv');
const xlsxPath = join(OUT_DIR, 'content-review.xlsx');
const csvBefore = existsSync(csvPath) ? await readFile(csvPath, 'utf8') : null;
await writeFile(join(OUT_DIR, 'content-review.md'), md, 'utf8');
await writeFile(csvPath, csv, 'utf8');
// เขียน .xlsx ใหม่เมื่อเนื้อหาเปลี่ยน (เทียบจาก CSV) หรือสั่ง --xlsx
const xlsxChanged = csvBefore !== csv || !existsSync(xlsxPath) || process.argv.includes('--xlsx');
if (xlsxChanged) await wb.xlsx.writeFile(xlsxPath);
console.log(
  `✔ ${rows.length} แถว → docs/content-review.md, docs/content-review.csv` +
    (xlsxChanged ? ', docs/content-review.xlsx' : ' (content-review.xlsx ไม่เปลี่ยน)'),
);
