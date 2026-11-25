import { describe, expect, it } from 'vitest';
import { CONJ_N5 } from '../../data/conj/n5';
import { FORM_INFO } from '../../data/conj/types';
import { GRAMMAR_N5 } from '../../data/grammar/n5';
import { getLesson, lessonCode, lessonWords, type LineDeck } from '../../data/line';
import { presetPrefs } from '../conj/conjLogic';
import { CONJ_LABELS, conjLinksFor, FORM_LINKS, GRAMMAR_LABELS, grammarLinksFor } from './formLinks';

describe('links between grammar and conjugation lessons', () => {
  it('names lessons exactly as their lines do', () => {
    const decks: [LineDeck, typeof CONJ_LABELS][] = [
      [CONJ_N5, CONJ_LABELS],
      [GRAMMAR_N5, GRAMMAR_LABELS],
    ];
    for (const [deck, labels] of decks) {
      for (const [id, label] of Object.entries(labels)) {
        const lesson = getLesson(deck, id);
        expect(lesson, id).toBeDefined();
        expect([lessonCode(deck, lesson!), lesson!.title], id).toEqual([...label]);
      }
    }
    // ไม่มีชื่อบทที่ไม่ได้ใช้ และทุกบทที่ใช้มีชื่อ
    expect(Object.keys(GRAMMAR_LABELS).sort()).toEqual(Object.keys(FORM_LINKS).sort());
    expect(Object.keys(CONJ_LABELS).sort()).toEqual([...new Set(Object.values(FORM_LINKS).flatMap((l) => l.conj))].sort());
  });

  it('keeps the pairs the owner chose', () => {
    const pairs = Object.fromEntries(
      GRAMMAR_N5.lessons
        .map((l) => [lessonCode(GRAMMAR_N5, l), conjLinksFor(l.id).map((x) => x.code ?? x.title)] as const)
        .filter(([, links]) => links.length > 0),
    );
    expect(pairs).toEqual({
      G07: ['C01', 'C03', 'C04', 'C05'],
      G10: ['C06'],
      G11: ['C06'],
      G12: ['C03', 'C04'],
      G13: ['C17', 'C18', 'C19'],
      G14: ['C20'],
      G15: ['C22'],
      G19: ['C01', 'C07', 'C08', 'C09', 'C10'],
      G20: ['ฝึกอิสระเฉพาะรูป て'],
      G21: ['ฝึกอิสระเฉพาะรูป て'],
      G22: ['ฝึกอิสระเฉพาะรูป て'],
      G23: ['C12', 'C13', 'C14'],
      G24: ['C14'],
      G25: ['C15', 'C16'],
      G26: ['C11'],
      G27: ['C18', 'C22'],
    });
  });

  it('links back from every conjugation lesson but two', () => {
    const back = Object.fromEntries(
      CONJ_N5.lessons.map((l) => [lessonCode(CONJ_N5, l), grammarLinksFor(l.id).map((x) => x.code)]),
    );
    expect(Object.keys(back).filter((c) => !back[c]!.length)).toEqual(['C02', 'C21']);
    expect(back.C07).toEqual(['G19', 'G20', 'G21', 'G22']);
    expect(back.C14).toEqual(['G23', 'G24']);
    expect(back.C22).toEqual(['G15', 'G27']);
    expect(Object.values(back).every((l) => l.length <= 4)).toBe(true);
  });

  it('opens free practice with forms that the linked lessons teach', () => {
    for (const [id, link] of Object.entries(FORM_LINKS)) {
      if (!link.free) continue;
      const forms = link.conj.flatMap((c) => lessonWords(CONJ_N5, getLesson(CONJ_N5, c)!).map((r) => r.form));
      for (const f of link.free.forms) {
        expect(forms, id).toContain(f);
        expect(link.free.title, id).toContain(FORM_INFO[f].ja);
      }
      const query = new URL(conjLinksFor(id)[0]!.href, 'https://x').searchParams.get('forms');
      expect(presetPrefs(query)?.topics, id).toEqual([...link.free.forms]);
    }
  });
});
