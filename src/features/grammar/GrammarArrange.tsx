import { Delete } from 'lucide-react';
import { useState } from 'react';
import { plainOf } from '../../data/grammar/sentence';
import type { GrammarExample } from '../../data/grammar/types';
import { cx } from '../../lib/cx';
import { JaText } from './JaText';
import styles from './grammar.module.css';

interface GrammarArrangeProps {
  example: GrammarExample;
  /** ลำดับชิ้นที่สลับแล้ว (index ของ chunks) */
  tiles: readonly number[];
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
}

/**
 * เรียงชิ้นประโยคตามคำแปล: แตะชิ้นตามลำดับ (แตะชิ้นที่วางแล้วเพื่อเอาออก) — ครบแล้วตรวจทันที
 * เทียบด้วยข้อความ ชิ้นที่หน้าตาเหมือนกันสลับกันได้
 */
export function GrammarArrange({ example, tiles, disabled, onAnswer }: GrammarArrangeProps) {
  const { chunks, end, plain } = example.sentence;
  const [picked, setPicked] = useState<number[]>([]);

  const pick = (t: number) => {
    if (disabled || picked.includes(t)) return;
    const next = [...picked, t];
    setPicked(next);
    if (next.length === tiles.length) onAnswer(next.map((i) => plainOf(chunks[tiles[i]!]!)).join('') === plain);
  };

  return (
    <div className={styles.arrange}>
      <ol className={styles.answerLine} aria-label="ประโยคที่เรียง">
        {picked.length === 0 && <li className={styles.answerEmpty}>แตะชิ้นด้านล่างเรียงเป็นประโยค</li>}
        {picked.map((t, slot) => (
          <li key={t}>
            <button
              type="button"
              className={cx(styles.tile, styles.placed)}
              onClick={() => !disabled && setPicked((p) => p.filter((_, s) => s !== slot))}
              disabled={disabled}
              aria-label={`เอา ${plainOf(chunks[tiles[t]!]!)} ออก`}
            >
              <JaText segs={chunks[tiles[t]!]!} />
            </button>
          </li>
        ))}
        {picked.length === tiles.length && end && (
          <li className={cx('kana', styles.end)} lang="ja">
            {end}
          </li>
        )}
      </ol>
      <div className={styles.tiles}>
        {tiles.map((c, t) => (
          <button
            key={t}
            type="button"
            className={styles.tile}
            onClick={() => pick(t)}
            disabled={disabled || picked.includes(t)}
            aria-label={plainOf(chunks[c]!)}
          >
            <JaText segs={chunks[c]!} />
          </button>
        ))}
      </div>
      {!disabled && picked.length > 0 && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicked([])}>
          <Delete size={16} strokeWidth={1.8} aria-hidden />
          ล้าง
        </button>
      )}
    </div>
  );
}
