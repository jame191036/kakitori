import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import { useKanjiStrokes } from '../../data/kanji/strokes';
import type { KanjiEntry } from '../../data/kanji/types';
import type { VocabDeck, VocabWord } from '../../data/vocab';
import { cx } from '../../lib/cx';
import { StrokeDraw } from '../writing/StrokeDraw';
import styles from './kanji.module.css';

const KIND_LABEL = { on: 'อง', kun: 'คุง' } as const;

/** ตัวคันจิที่เขียนตัวเองตามลำดับขีด (แตะเพื่อดูอีกครั้ง) — ต้องอยู่ใน <Suspense> */
function AnimatedKanji({ char }: { char: string }) {
  const data = useKanjiStrokes().chars[char];
  if (!data) return <span className={cx('kana', styles.bigChar)}>{char}</span>;
  return <StrokeDraw data={data} label={`ลำดับขีดของ ${char} (แตะเพื่อดูอีกครั้ง)`} className={styles.anim} />;
}

/** คำที่เขียนด้วยคันจิ โดยเน้นตัวคันจิที่กำลังเรียน */
export function Highlighted({ text, char }: { text: string; char: string }) {
  return (
    <span className="kana" lang="ja">
      {[...text].map((c, i) =>
        c === char ? (
          <strong key={i} className={styles.hl}>
            {c}
          </strong>
        ) : (
          c
        ),
      )}
    </span>
  );
}

function ExampleWord({ word, char }: { word: VocabWord; char: string }) {
  return (
    <li className={styles.example}>
      <span className={styles.exWritten}>
        <Highlighted text={word.kanji ?? word.kana} char={char} />
      </span>
      <span className={cx('kana', styles.exKana)} lang="ja">
        {word.kana}
      </span>
      <span className={styles.exThai}>{word.thai}</span>
      <SpeakButton text={word.kana} size="sm" label={`ฟังเสียง ${word.kana}`} />
    </li>
  );
}

interface KanjiCardsProps {
  items: readonly KanjiEntry[];
  vocab: VocabDeck;
  /** ดูครบทุกตัวแล้วกด "ไปฝึก" */
  onDone: () => void;
}

/**
 * ขั้น "เรียน" ของบทคันจิ: การ์ดทีละตัว — ตัวคันจิเขียนตัวเองตามลำดับขีด จำนวนขีด ความหมาย
 * คำอ่าน (เฉพาะที่ใช้ในคำ N5) พร้อมคำตัวอย่างจากคลังคำศัพท์ และคำที่อ่านพิเศษทั้งคำ
 */
export function KanjiCards({ items, vocab, onDone }: KanjiCardsProps) {
  const [index, setIndex] = useState(0);
  const entry = items[index]!;
  const last = index === items.length - 1;
  const special = (entry.special ?? []).map((id) => vocab.words[id]).filter((w): w is VocabWord => !!w);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(items.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

  return (
    <div className={styles.learn}>
      <section className={cx('card', styles.card)} aria-live="polite" aria-label={`คันจิตัวที่ ${index + 1} จาก ${items.length}`}>
        <div className={styles.cardTop}>
          <span className={styles.counter}>
            {index + 1} / {items.length}
          </span>
          <span className={styles.strokes}>{entry.strokes} ขีด</span>
        </div>

        <div key={entry.id} className={styles.cardBody}>
          <div className={styles.glyphBox}>
            <Suspense fallback={<span className={cx('kana', styles.bigChar)}>{entry.char}</span>}>
              <AnimatedKanji char={entry.char} />
            </Suspense>
          </div>

          <div className={styles.info}>
            <p className={styles.meaning}>{entry.thai}</p>

            {entry.readings.length > 0 && (
              <ul className={styles.readings} aria-label="คำอ่านและคำตัวอย่าง">
                {entry.readings.map((r) => (
                  <li key={r.kana + r.kind} className={styles.reading}>
                    <p className={styles.readingHead}>
                      <span className={cx(styles.kind, styles[r.kind])}>{KIND_LABEL[r.kind]}</span>
                      <span className={cx('kana', styles.readingKana)} lang="ja">
                        {r.kana}
                      </span>
                    </p>
                    {r.words.length > 0 && (
                      <ul className={styles.examples}>
                        {r.words.map((id) => {
                          const w = vocab.words[id];
                          return w ? <ExampleWord key={id} word={w} char={entry.char} /> : null;
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {(entry.extra?.length ?? 0) > 0 && (
              <ul className={styles.examples} aria-label="ตัวอย่าง">
                {entry.extra!.map((x) => (
                  <li key={x.written} className={styles.example}>
                    <span className={styles.exWritten}>
                      <Highlighted text={x.written} char={entry.char} />
                    </span>
                    <span className={cx('kana', styles.exKana)} lang="ja">
                      {x.kana}
                    </span>
                    <span className={styles.exThai}>{x.thai}</span>
                    <SpeakButton text={x.kana} size="sm" label={`ฟังเสียง ${x.kana}`} />
                  </li>
                ))}
              </ul>
            )}

            {special.length > 0 && (
              <div className={styles.special}>
                <p className={styles.specialHead}>อ่านพิเศษทั้งคำ (จำเป็นคำ)</p>
                <ul className={styles.examples}>
                  {special.map((w) => (
                    <ExampleWord key={w.id} word={w} char={entry.char} />
                  ))}
                </ul>
              </div>
            )}

            {entry.note && <p className={styles.note}>{entry.note}</p>}
          </div>
        </div>

        <div className={styles.cardNav}>
          <button
            type="button"
            className="btn"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            aria-label="ตัวก่อนหน้า"
          >
            <ArrowLeft size={18} strokeWidth={1.8} aria-hidden />
          </button>
          <ol className={styles.dots} aria-hidden>
            {items.map((x, i) => (
              <li key={x.id} className={cx(i === index && styles.dotOn, i < index && styles.dotSeen)} />
            ))}
          </ol>
          {last ? (
            <button type="button" className="btn btn-primary" onClick={onDone}>
              ไปฝึกเขียน
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>
              ตัวถัดไป
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </section>

      {/* ภาพรวมคันจิในบท: กดเพื่อไปที่การ์ดนั้น */}
      <ul className={styles.list} aria-label="คันจิในบทนี้">
        {items.map((x, i) => (
          <li key={x.id}>
            <button
              type="button"
              className={cx(styles.chip, i === index && styles.chipOn)}
              onClick={() => setIndex(i)}
              aria-current={i === index ? 'true' : undefined}
            >
              <span className="kana" lang="ja">
                {x.char}
              </span>
              <span className={styles.chipThai}>{x.thai}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
