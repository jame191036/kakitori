import { useState } from 'react';
import { scripts } from '../../data/scripts';
import { useStrokeSet } from '../../data/useStrokes';
import { kanaOf, type VocabWord } from '../../data/vocab';
import { cx } from '../../lib/cx';
import { STRICTNESS_LENIENCY, useSettings } from '../settings/settings';
import { StrokeCheckBoard } from '../writing/StrokeCheckBoard';
import styles from './vocab.module.css';

interface WriteQuestionProps {
  word: VocabWord;
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
}

/**
 * เขียนคำด้วยมือทีละตัว (ตรวจทีละขีดแบบไม่มีเส้นนำ เหมือนข้อเขียนในแบบทดสอบตัวอักษร)
 * เขียนครบทุกตัวโดยไม่ต้องใช้ตัวช่วย = ถูก · ต้องอยู่ใน <Suspense> (โหลดข้อมูลลำดับขีด)
 */
export function WriteQuestion({ word, disabled, onAnswer }: WriteQuestionProps) {
  const settings = useSettings();
  const hira = useStrokeSet(scripts.hiragana);
  const kata = useStrokeSet(scripts.katakana);
  const chars = kanaOf(word);
  const [pos, setPos] = useState(0);
  const [clean, setClean] = useState(true);
  const ch = chars[pos]!;
  const data = hira.chars[ch] ?? kata.chars[ch];

  return (
    <div className={styles.write}>
      <ol className={styles.slots} aria-label="ตัวที่เขียนแล้ว">
        {chars.map((c, i) => (
          <li key={i}>
            <span className={cx('kana', styles.slot, i < pos && styles.slotFilled, i === pos && !disabled && styles.slotNow)} lang="ja">
              {i < pos || disabled ? c : ''}
            </span>
          </li>
        ))}
      </ol>
      {data && !disabled && (
        <div className={styles.writeBoard}>
          <StrokeCheckBoard
            key={`${word.id}-${pos}`}
            data={data}
            guide={false}
            leniency={STRICTNESS_LENIENCY[settings.strictness]}
            label={`เขียนตัวที่ ${pos + 1} ของคำ ${word.romaji}`}
            hideRestart
            onComplete={({ hintsUsed }) => {
              const ok = clean && hintsUsed === 0;
              if (pos < chars.length - 1) {
                setClean(ok);
                setPos(pos + 1);
              } else {
                onAnswer(ok);
              }
            }}
          />
        </div>
      )}
      {!disabled && (
        <button type="button" className="btn btn-ghost" onClick={() => onAnswer(false)}>
          ไม่รู้ / ดูเฉลย
        </button>
      )}
    </div>
  );
}
