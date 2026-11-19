import type { VocabWord } from '../../data/vocab';
import { cx } from '../../lib/cx';
import styles from './vocab.module.css';

interface WordFaceProps {
  word: VocabWord;
  size?: 'xl' | 'lg' | 'md';
  /** แสดงโรมาจิใต้คำ */
  romaji?: boolean;
}

/** คำภาษาญี่ปุ่น: คานะตัวใหญ่ + คันจิตัวเล็ก (ถ้าปกติเขียนด้วยคันจิ) + โรมาจิ (ถ้าเปิด) */
export function WordFace({ word, size = 'lg', romaji = false }: WordFaceProps) {
  return (
    <span className={cx(styles.face, styles[size])}>
      <span className={cx('kana', styles.faceKana)} lang="ja">
        {word.kana}
      </span>
      {word.kanji && (
        <span className={cx('kana', styles.faceKanji)} lang="ja">
          {word.kanji}
        </span>
      )}
      {romaji && <span className={styles.faceRomaji}>{word.romaji}</span>}
    </span>
  );
}
