import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { faceText } from '../../data/travel/build';
import type { TravelPhrase } from '../../data/travel/types';
import { cx } from '../../lib/cx';
import { KindTag, PhraseFace } from './PhraseFace';
import styles from './travel.module.css';

interface TravelCardsProps {
  items: readonly TravelPhrase[];
  /** ดูครบทุกวลีแล้วกด "ไปฝึก" */
  onDone: () => void;
}

/** ขั้น "เรียน" ของบทท่องเที่ยว: การ์ดทีละวลี — คานะ แบบเขียนจริง โรมาจิ ความหมาย วิธีใช้ และเสียง */
export function TravelCards({ items, onDone }: TravelCardsProps) {
  const [index, setIndex] = useState(0);
  const phrase = items[index]!;
  const last = index === items.length - 1;

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
      <section className={cx('card', styles.card)} aria-live="polite" aria-label={`วลีที่ ${index + 1} จาก ${items.length}`}>
        <div className={styles.cardTop}>
          <span className={styles.counter}>
            {index + 1} / {items.length}
          </span>
          <KindTag phrase={phrase} />
        </div>

        <div key={phrase.id} className={styles.cardBody}>
          <PhraseFace phrase={phrase} speak />
          <p className={styles.cardThai}>{phrase.thai}</p>
          {phrase.note && <p className={styles.note}>{phrase.note}</p>}
        </div>

        <div className={styles.cardNav}>
          <button
            type="button"
            className="btn"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            aria-label="วลีก่อนหน้า"
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
              ไปฝึก
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>
              วลีถัดไป
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </section>

      {/* ภาพรวมวลีในบท: กดเพื่อไปที่การ์ดนั้น */}
      <ul className={styles.list} aria-label="วลีในบทนี้">
        {items.map((x, i) => (
          <li key={x.id}>
            <button
              type="button"
              className={cx(styles.chip, i === index && styles.chipOn)}
              onClick={() => setIndex(i)}
              aria-current={i === index ? 'true' : undefined}
            >
              <span className={cx('kana', styles.chipKana)} lang="ja">
                {faceText(x)}
              </span>
              <span className={styles.chipThai}>
                {x.kind === 'hear' && <span className={styles.chipHear}>ได้ยิน · </span>}
                {x.thai}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
