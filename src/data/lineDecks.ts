import { useEffect, useState } from 'react';
import type { ConjDeck } from './conj/types';
import type { GrammarDeck } from './grammar/types';
import type { KanjiDeck } from './kanji/types';
import type { PhraseDeck } from './phrase/types';
import type { VocabDeck } from './vocab';

/**
 * ข้อมูลสายบทเรียน (N5: คำศัพท์ · คันจิ · ไวยากรณ์ · ผันคำ + สายวลี: ท่องเที่ยว · ชีวิตประจำวัน · การ์ตูน) โหลดแยกจากก้อนหลักของเว็บ
 * หน้าของแต่ละสาย import ข้อมูลตรงๆ ได้ตามเดิม (หน้าพวกนั้นโหลดแยกอยู่แล้ว)
 * — หน้าแรกจะได้เปิดเร็ว · ส่วนที่อยู่ในก้อนหลัก (หน้าแรก · หัวเว็บ) ต้องใช้ตัวนี้แทน
 * ห้าม import data/(vocab|kanji|grammar|conj)/n5 · data/(travel|daily|anime) ตรงๆ
 */
export interface LineDecks {
  vocab: VocabDeck;
  kanji: KanjiDeck;
  grammar: GrammarDeck;
  conj: ConjDeck;
  travel: PhraseDeck;
  daily: PhraseDeck;
  anime: PhraseDeck;
}

let loaded: LineDecks | null = null;
let loading: Promise<LineDecks> | null = null;

export function loadLineDecks(): Promise<LineDecks> {
  loading ??= Promise.all([
    import('./vocab/n5'),
    import('./kanji/n5'),
    import('./grammar/n5'),
    import('./conj/n5'),
    import('./travel'),
    import('./daily'),
    import('./anime'),
  ])
    .then(
      ([v, k, g, c, t, d, a]) =>
        (loaded = {
          vocab: v.N5_DECK,
          kanji: k.KANJI_N5,
          grammar: g.GRAMMAR_N5,
          conj: c.CONJ_N5,
          travel: t.TRAVEL_DECK,
          daily: d.DAILY_DECK,
          anime: a.ANIME_DECK,
        }),
    )
    .catch((err: unknown) => {
      // โหลดไม่สำเร็จ (เช่น ออฟไลน์ก่อนแคชเสร็จ) — ครั้งหน้าลองใหม่
      loading = null;
      throw err;
    });
  return loading;
}

/**
 * ข้อมูลสาย N5 สำหรับคอมโพเนนต์ — null ระหว่างโหลด (หรือเมื่อ enabled = false)
 * ถ้าเคยโหลดแล้วได้ทันทีในการเรนเดอร์แรก (ไม่กะพริบเวลากลับมาหน้าเดิม)
 */
export function useLineDecks(enabled = true): LineDecks | null {
  const [decks, setDecks] = useState<LineDecks | null>(loaded);
  useEffect(() => {
    if (!enabled || decks) return;
    let alive = true;
    loadLineDecks().then(
      (d) => alive && setDecks(d),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [enabled, decks]);
  return enabled ? decks : null;
}
