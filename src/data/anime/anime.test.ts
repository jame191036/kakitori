import { describe, expect, it } from 'vitest';
import { lessonCode } from '../line';
import { phraseText } from '../phrase/build';
import type { PhraseText } from '../phrase/types';
import { ANIME_DECK } from './index';

const deck = ANIME_DECK;
const phrases = Object.values(deck.words);
const HAN = /\p{Script=Han}/u;
const ROMAJI = /^[a-z][a-z ,'?!.-]*$/;

function checkText(t: PhraseText, where: string) {
  expect(HAN.test(t.kana), where).toBe(false);
  expect(t.kana.includes('/') || t.written.includes('/'), where).toBe(false);
  expect(t.romaji, where).toMatch(ROMAJI);
  expect(t.romaji, where).not.toMatch(/ {2}/);
  // ประโยคเดียวต่อบรรทัด (。 กลางประโยคทำให้คานะ/โรมาจิผิด)
  expect(t.kana.replace(/[。？！…]+$/u, ''), where).not.toMatch(/[。？！]/);
}

describe('anime phrase text', () => {
  it('keeps both marks of ！？ in romaji', () => {
    expect(phraseText('なに！？').romaji).toBe('nani!?');
    expect(phraseText('なん/だ/と！？').romaji).toBe('nan da to!?');
  });

  it('reads casual speech endings as separate words', () => {
    expect(phraseText('そう/っす！').romaji).toBe('sou ssu!');
    expect(phraseText('いい/わ/よ。').romaji).toBe('ii wa yo');
    expect(phraseText('ハルト/{様|さま}！').romaji).toBe('haruto sama!');
    expect(phraseText('{話|はなし}/が ある/ん/だ。').romaji).toBe('hanashi ga aru n da');
    expect(phraseText('{使|つか}える/んですか？').romaji).toBe('tsukaeru n desu ka?');
    expect(phraseText('{間|ま}に{合|あ}った…').romaji).toBe('maniatta...');
  });
});

describe('anime deck', () => {
  it('has stable ids, station-sized lessons with 3+ phrases to say, and segments opened in order', () => {
    for (const [key, x] of Object.entries(deck.words)) expect(x.id).toBe(key);
    for (const l of deck.lessons) {
      expect(l.words.length, l.id).toBeGreaterThanOrEqual(5);
      expect(l.words.length, l.id).toBeLessThanOrEqual(8);
      expect(l.words.filter((id) => deck.words[id]!.kind === 'say').length, l.id).toBeGreaterThanOrEqual(3);
    }
    expect(lessonCode(deck, deck.lessons[0]!)).toBe('A01');
    const open = deck.segments.map((s) => s.lessons.length > 0);
    expect(open.indexOf(false) === -1 || !open.slice(open.indexOf(false)).includes(true)).toBe(true);
    expect(deck.segments.length).toBe(9);
    expect(deck.dialogueLabel).toBe('ฉากตัวอย่าง');
  });

  it('gives every phrase its own Thai meaning and only real ids in avoid', () => {
    const thai = phrases.map((x) => x.thai);
    expect(thai.filter((t, i) => thai.indexOf(t) !== i)).toEqual([]);
    for (const x of phrases) for (const id of x.avoid ?? []) expect(deck.words[id], `${x.id} → ${id}`).toBeTruthy();
  });

  it('writes kanji with readings, kana without kanji, romaji in plain letters (polite forms too)', () => {
    for (const x of phrases) {
      for (const seg of x.sentence.segs) if (HAN.test(seg.text)) expect(seg.ruby, `${x.id}: ${seg.text}`).toBeTruthy();
      expect(x.kind, x.id).not.toBe('sign');
      expect(x.sentence.end || x.kana.endsWith('…'), `${x.id} ต้องมีเครื่องหมายท้าย`).toBeTruthy();
      checkText(x, x.id);
      if (x.polite) checkText(x.polite, `${x.id} (สุภาพ)`);
      if (x.arrange) expect(x.kanaSentence.chunks.length, x.id).toBeGreaterThanOrEqual(3);
      // สายนี้วลีหลักเป็นแบบกันเองอยู่แล้ว — ไม่มีช่องแบบกันเองซ้อน
      expect(x.casual, x.id).toBeUndefined();
    }
  });

  it('marks rough words and anime-only speech as things to hear, with a caution', () => {
    // คำด่า / คำห้วนที่ห้ามพูดจริง ต้องเป็นชนิด "ได้ยิน" และมีคำเตือน
    const rough = ['urusai', 'baka', 'fuzakeru-na', 'omae', 'anta', 'temee', 'kisama', 'mukatsuku'];
    // รอบ 2: คำท้าตี คำห้วน ประโยคตัวร้าย
    rough.push('okureru-na', 'baka-da-na', 'kao-mo', 'hen-na-yatsu', 'kakatte-koi', 'jama-suru-na', 'oboetero');
    // รอบ 3: ปากแข็ง คำห้วน ประโยคตัวร้าย และคำบอกรักที่ชีวิตจริงไม่พูด
    rough.push('betsu-ni', 'kanchigai-shinaide', 'aishiteru', 'ki-o-tsukero', 'yoku-kita', 'yurusanai', 'soko-made-da', 'nanimono');
    for (const id of rough) {
      expect(deck.words[id]?.kind, id).toBe('hear');
      expect(deck.words[id]?.caution, id).toBeTruthy();
    }
  });

  it('gives every lesson an example scene between two sides', () => {
    for (const l of deck.lessons) {
      const dlg = deck.dialogues?.[l.id];
      expect(dlg, l.id).toBeTruthy();
      expect(dlg!.lines.length, l.id).toBeGreaterThanOrEqual(4);
      expect(new Set(dlg!.lines.map((x) => x.side)).size, l.id).toBe(2);
      dlg!.lines.forEach((line, i) => {
        checkText(line, `${l.id} บรรทัด ${i + 1}`);
        expect(line.thai.trim(), `${l.id} บรรทัด ${i + 1}`).not.toBe('');
      });
    }
  });
});
