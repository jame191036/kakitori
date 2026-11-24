import { describe, expect, it } from 'vitest';
import { lessonCode } from '../line';
import { phraseText } from '../phrase/build';
import type { PhraseText } from '../phrase/types';
import { DAILY_DECK } from './index';

const deck = DAILY_DECK;
const phrases = Object.values(deck.words);
const HAN = /\p{Script=Han}/u;
const ROMAJI = /^[a-z][a-z ,'?!.-]*$/;

function checkText(t: PhraseText, where: string) {
  expect(HAN.test(t.kana), where).toBe(false);
  expect(t.kana.includes('/') || t.written.includes('/'), where).toBe(false);
  expect(t.romaji, where).toMatch(ROMAJI);
  expect(t.romaji, where).not.toMatch(/ {2}/);
  // ประโยคเดียวต่อบรรทัด (。 กลางประโยคทำให้คานะ/โรมาจิผิด)
  expect(t.kana.slice(0, -1), where).not.toMatch(/[。？！]/);
}

describe('daily phrase text', () => {
  it('keeps a trailing … as the end mark (soft refusal)', () => {
    const t = phraseText('その {日|ひ}は ちょっと…');
    expect(t.kana).toBe('その ひは ちょっと…');
    expect(t.romaji).toBe('sono hi wa chotto...');
  });

  it('splits desu ne / desu yo / mashou ka in romaji', () => {
    expect(phraseText('おいしそうですね。').romaji).toBe('oishisou desu ne');
    expect(phraseText('{大丈夫|だいじょうぶ}ですよ。').romaji).toBe('daijoubu desu yo');
    expect(phraseText('{何時|なんじ}/に しましょうか？').romaji).toBe('nanji ni shimashou ka?');
  });

  it('reads は as a particle only when it is not the end of a kanji reading', () => {
    expect(phraseText('{父|ちち}/と {母|はは}/が います。').romaji).toBe('chichi to haha ga imasu');
    expect(phraseText('{母|はは}は {元気|げんき}です。').romaji).toBe('haha wa genki desu');
  });

  it('writes the greetings konnichiwa / konbanwa as one word (dialogue lines have no romaji override)', () => {
    expect(phraseText('こんにちは。').romaji).toBe('konnichiwa');
    expect(phraseText('はい、こんばんは。').romaji).toBe('hai, konbanwa');
    // 今晩は (คืนนี้ + คำช่วย) ไม่ใช่คำทักทาย
    expect(phraseText('でも、{今晩|こんばん}は ちょっと…').romaji).toBe('demo, konban wa chotto...');
  });
});

describe('daily deck', () => {
  it('has stable ids, station-sized lessons with 3+ phrases to say, and segments opened in order', () => {
    for (const [key, x] of Object.entries(deck.words)) expect(x.id).toBe(key);
    for (const l of deck.lessons) {
      expect(l.words.length, l.id).toBeGreaterThanOrEqual(5);
      expect(l.words.length, l.id).toBeLessThanOrEqual(8);
      expect(l.words.filter((id) => deck.words[id]!.kind === 'say').length, l.id).toBeGreaterThanOrEqual(3);
    }
    expect(lessonCode(deck, deck.lessons[0]!)).toBe('D01');
    const open = deck.segments.map((s) => s.lessons.length > 0);
    expect(open.indexOf(false) === -1 || !open.slice(open.indexOf(false)).includes(true)).toBe(true);
    expect(deck.segments.length).toBe(9);
  });

  it('gives every phrase its own Thai meaning and only real ids in avoid', () => {
    const thai = phrases.map((x) => x.thai);
    expect(thai.filter((t, i) => thai.indexOf(t) !== i)).toEqual([]);
    for (const x of phrases) for (const id of x.avoid ?? []) expect(deck.words[id], `${x.id} → ${id}`).toBeTruthy();
  });

  it('writes kanji with readings, kana without kanji, romaji in plain letters (casual forms too)', () => {
    for (const x of phrases) {
      for (const seg of x.sentence.segs) if (HAN.test(seg.text)) expect(seg.ruby, `${x.id}: ${seg.text}`).toBeTruthy();
      expect(x.kind, x.id).not.toBe('sign');
      expect(x.sentence.end || x.kana.endsWith('…'), `${x.id} ต้องมีเครื่องหมายท้าย`).toBeTruthy();
      checkText(x, x.id);
      if (x.casual) checkText(x.casual, `${x.id} (กันเอง)`);
      if (x.arrange) expect(x.kanaSentence.chunks.length, x.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('gives every lesson an example dialogue between two speakers', () => {
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
