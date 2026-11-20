import { useEffect, useState } from 'react';
import type { GrammarDeck } from './grammar/types';
import type { KanjiDeck } from './kanji/types';
import type { VocabDeck } from './vocab';

/**
 * ข้อมูลสาย N5 (คำศัพท์ · คันจิ · ไวยากรณ์) โหลดแยกจากก้อนหลักของเว็บ — หน้าแรกจะได้เปิดเร็ว
 * หน้าในหมวด N5 import ข้อมูลตรงๆ ได้ตามเดิม (หน้าพวกนั้นโหลดแยกอยู่แล้ว)
 * ส่วนที่อยู่ในก้อนหลัก (หน้าแรก · หัวเว็บ) ต้องใช้ตัวนี้แทน — ห้าม import data/(vocab|kanji|grammar)/n5 ตรงๆ
 */
export interface LineDecks {
  vocab: VocabDeck;
  kanji: KanjiDeck;
  grammar: GrammarDeck;
}

let loaded: LineDecks | null = null;
let loading: Promise<LineDecks> | null = null;

export function loadLineDecks(): Promise<LineDecks> {
  loading ??= Promise.all([import('./vocab/n5'), import('./kanji/n5'), import('./grammar/n5')])
    .then(([v, k, g]) => (loaded = { vocab: v.N5_DECK, kanji: k.KANJI_N5, grammar: g.GRAMMAR_N5 }))
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
