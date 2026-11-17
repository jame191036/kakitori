import type { MinimalPair, PairWord } from '../../data/minimalPairs';
import { SpeakButton } from '../../components/SpeakButton';
import styles from './listening.module.css';

/** คู่คำฟังเทียบ: ซ้าย = ไม่มีตัวควบ/っ/เสียงยาว · ขวา = มี (ปุ่มเสียงซ่อนเองถ้าเครื่องไม่มีเสียงญี่ปุ่น) */
export function PairList({ pairs }: { pairs: readonly MinimalPair[] }) {
  return (
    <ul className={styles.pairs}>
      {pairs.map((p) => (
        <li key={p.marked.kana} className={styles.pair}>
          <Word word={p.plain} />
          <Word word={p.marked} />
        </li>
      ))}
    </ul>
  );
}

function Word({ word }: { word: PairWord }) {
  return (
    <div className={styles.word}>
      <SpeakButton text={word.kana} label={`ฟังเสียง ${word.kana}`} size="sm" />
      <div className={styles.wordText}>
        <span className={styles.wordKana} lang="ja">
          <span className="kana">{word.kana}</span>
          {word.kanji && <span className={styles.wordKanji}>（{word.kanji}）</span>}
        </span>
        <span className={styles.wordMeta}>
          <strong>{word.romaji}</strong> — {word.meaning}
        </span>
      </div>
    </div>
  );
}
