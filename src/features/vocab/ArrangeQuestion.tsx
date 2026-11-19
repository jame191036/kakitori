import { Delete } from 'lucide-react';
import { useState } from 'react';
import { kanaOf, type VocabWord } from '../../data/vocab';
import { cx } from '../../lib/cx';
import styles from './vocab.module.css';

interface ArrangeQuestionProps {
  word: VocabWord;
  /** ตัวคานะที่สลับลำดับแล้ว (มีตัวหลอกปน) */
  tiles: readonly string[];
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
}

/** เรียงตัวคานะให้เป็นคำ: แตะตัวอักษรตามลำดับ (แตะช่องที่วางแล้วเพื่อเอาออก) — ครบแล้วตรวจทันที */
export function ArrangeQuestion({ word, tiles, disabled, onAnswer }: ArrangeQuestionProps) {
  const target = kanaOf(word);
  const [picked, setPicked] = useState<number[]>([]);

  const pick = (i: number) => {
    if (disabled || picked.includes(i) || picked.length >= target.length) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === target.length) onAnswer(next.map((k) => tiles[k]).join('') === word.kana);
  };

  const unpick = (slot: number) => {
    if (disabled) return;
    setPicked((p) => p.filter((_, s) => s !== slot));
  };

  return (
    <div className={styles.arrange}>
      <ol className={styles.slots} aria-label="คำที่เรียง">
        {target.map((_, s) => {
          const tile = picked[s];
          return (
            <li key={s}>
              <button
                type="button"
                className={cx('kana', styles.slot, tile !== undefined && styles.slotFilled)}
                onClick={() => unpick(s)}
                disabled={disabled || tile === undefined}
                aria-label={tile === undefined ? `ช่องที่ ${s + 1} ว่าง` : `เอา ${tiles[tile]} ออก`}
                lang="ja"
              >
                {tile !== undefined ? tiles[tile] : ''}
              </button>
            </li>
          );
        })}
      </ol>
      <div className={styles.tiles}>
        {tiles.map((ch, i) => (
          <button
            key={i}
            type="button"
            className={cx('kana', styles.tile)}
            onClick={() => pick(i)}
            disabled={disabled || picked.includes(i)}
            lang="ja"
          >
            {ch}
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
