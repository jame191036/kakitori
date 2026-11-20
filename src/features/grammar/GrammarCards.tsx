import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import type { GrammarPoint } from '../../data/grammar/types';
import { cx } from '../../lib/cx';
import { FuriganaToggle, JaText } from './JaText';
import styles from './grammar.module.css';

interface GrammarCardsProps {
  items: readonly GrammarPoint[];
  /** ดูครบทุกรูปแล้วกด "ไปฝึก" */
  onDone: () => void;
}

/**
 * ขั้น "เรียน" ของบทไวยากรณ์: การ์ดทีละรูป — รูปประโยค ความหมาย คำอธิบาย
 * และประโยคตัวอย่าง (เน้นส่วนไวยากรณ์ · มีคำอ่านเหนือคันจิ · ฟังเสียงได้)
 */
export function GrammarCards({ items, onDone }: GrammarCardsProps) {
  const [index, setIndex] = useState(0);
  const point = items[index]!;
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
      <section
        className={cx('card', styles.card)}
        aria-live="polite"
        aria-label={`ไวยากรณ์ข้อที่ ${index + 1} จาก ${items.length}`}
      >
        <div className={styles.cardTop}>
          <span className={styles.counter}>
            {index + 1} / {items.length}
          </span>
          <FuriganaToggle />
        </div>

        <div key={point.id} className={styles.cardBody}>
          <div>
            <p className={cx('kana', styles.pattern)} lang="ja">
              {point.pattern}
            </p>
            <p className={styles.title}>{point.title}</p>
          </div>

          <div className={styles.explain}>
            {point.explain.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>

          <p className={styles.examplesHead}>ประโยคตัวอย่าง</p>
          <ul className={styles.examples}>
            {point.examples.map((ex) => (
              <li key={ex.sentence.src} className={styles.example}>
                <JaText segs={ex.sentence.segs} end={ex.sentence.end} mode="highlight" className={styles.exJa} />
                <span className={styles.exThai}>{ex.thai}</span>
                <SpeakButton text={ex.sentence.plain} size="sm" label="ฟังประโยคนี้" />
              </li>
            ))}
          </ul>

          {point.note && <p className={styles.note}>{point.note}</p>}
        </div>

        <div className={styles.cardNav}>
          <button
            type="button"
            className="btn"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            aria-label="ข้อก่อนหน้า"
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
              ข้อถัดไป
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </section>

      {/* ภาพรวมไวยากรณ์ในบท: กดเพื่อไปที่การ์ดนั้น */}
      <ul className={styles.list} aria-label="ไวยากรณ์ในบทนี้">
        {items.map((x, i) => (
          <li key={x.id}>
            <button
              type="button"
              className={cx(styles.chip, i === index && styles.chipOn)}
              onClick={() => setIndex(i)}
              aria-current={i === index ? 'true' : undefined}
            >
              <span className={cx('kana', styles.chipPattern)} lang="ja">
                {x.pattern}
              </span>
              <span className={styles.chipThai}>{x.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
