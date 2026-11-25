import { Delete } from 'lucide-react';
import { useState } from 'react';
import { cx } from '../../lib/cx';
import type { ConjQuestion } from './conjLogic';
import styles from './conj.module.css';

interface ConjBuildProps {
  q: ConjQuestion;
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
}

/**
 * เรียงชิ้นคานะให้เป็นรูปที่ผันแล้ว: แตะตามลำดับ (แตะช่องที่วางแล้วเพื่อเอาออก) — ครบช่องแล้วตรวจทันที
 * ท้ายรูปสุภาพ (เช่น ませんでした) และคำนามหน้า する เป็นชิ้นเดียว
 */
export function ConjBuild({ q, disabled, onAnswer }: ConjBuildProps) {
  const { tiles, slots, answer } = q;
  const [picked, setPicked] = useState<number[]>([]);

  const pick = (i: number) => {
    if (disabled || picked.includes(i) || picked.length >= slots) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === slots) onAnswer(next.map((k) => tiles[k]).join('') === answer);
  };

  return (
    <div className={styles.build}>
      <ol className={styles.slots} aria-label="คำที่เรียง">
        {Array.from({ length: slots }, (_, s) => {
          const tile = picked[s];
          return (
            <li key={s}>
              <button
                type="button"
                className={cx('kana', styles.slot, tile !== undefined && styles.slotFilled)}
                onClick={() => !disabled && setPicked((p) => p.filter((_x, k) => k !== s))}
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
        {tiles.map((t, i) => (
          <button
            key={i}
            type="button"
            className={cx('kana', styles.tile)}
            onClick={() => pick(i)}
            disabled={disabled || picked.includes(i)}
            lang="ja"
          >
            {t}
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
