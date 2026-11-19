import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import { WORD_KIND_LABEL, type VocabWord } from '../../data/vocab';
import { cx } from '../../lib/cx';
import { WordFace } from './WordFace';
import styles from './vocab.module.css';

interface LearnCardsProps {
  words: readonly VocabWord[];
  /** ดูครบทุกคำแล้วกด "ไปฝึก" */
  onDone: () => void;
}

/**
 * ขั้น "เรียน": การ์ดทีละคำ — คานะตัวใหญ่ คันจิตัวเล็ก ความหมายไทย ปุ่มฟังเสียง
 * โรมาจิซ่อนไว้ (ให้ลองอ่านคานะเองก่อน) กดเปิดได้ · ปุ่มลูกศรซ้าย/ขวาบนคีย์บอร์ดเปลี่ยนการ์ดได้
 */
export function LearnCards({ words, onDone }: LearnCardsProps) {
  const [index, setIndex] = useState(0);
  const [romaji, setRomaji] = useState(false);
  const word = words[index]!;
  const last = index === words.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(words.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [words.length]);

  return (
    <div className={styles.learn}>
      <section className={cx('card', styles.wordCard)} aria-live="polite" aria-label={`คำที่ ${index + 1} จาก ${words.length}`}>
        <div className={styles.cardTop}>
          <span className={styles.counter}>
            {index + 1} / {words.length}
          </span>
          <button
            type="button"
            className={cx('btn btn-sm', romaji && styles.toggleOn)}
            aria-pressed={romaji}
            onClick={() => setRomaji((r) => !r)}
          >
            {romaji ? 'ซ่อนโรมาจิ' : 'แสดงโรมาจิ'}
          </button>
        </div>

        <div key={word.id} className={styles.cardBody}>
          <WordFace word={word} size="xl" romaji={romaji} />
          <SpeakButton text={word.kana} label={`ฟังเสียง ${word.kana}`} />
          <p className={styles.meaning}>{word.thai}</p>
          <span className={styles.kindTag}>{WORD_KIND_LABEL[word.kind]}</span>
          {word.note && <p className={styles.note}>{word.note}</p>}
        </div>

        <div className={styles.cardNav}>
          <button
            type="button"
            className="btn"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            aria-label="คำก่อนหน้า"
          >
            <ArrowLeft size={18} strokeWidth={1.8} aria-hidden />
          </button>
          <ol className={styles.dots} aria-hidden>
            {words.map((w, i) => (
              <li key={w.id} className={cx(i === index && styles.dotOn, i < index && styles.dotSeen)} />
            ))}
          </ol>
          {last ? (
            <button type="button" className="btn btn-primary" onClick={onDone}>
              ไปฝึก
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>
              คำถัดไป
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </section>

      {/* ภาพรวมคำในบท: กดเพื่อไปที่การ์ดนั้น */}
      <ul className={styles.wordList} aria-label="คำในบทนี้">
        {words.map((w, i) => (
          <li key={w.id}>
            <button
              type="button"
              className={cx(styles.wordChip, i === index && styles.wordChipOn)}
              onClick={() => setIndex(i)}
              aria-current={i === index ? 'true' : undefined}
            >
              <span className="kana" lang="ja">
                {w.kana}
              </span>
              <span className={styles.wordChipThai}>{w.thai}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
