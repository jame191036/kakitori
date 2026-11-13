import type { ExampleWord as Word } from '../data/types';
import { SpeakButton } from './SpeakButton';
import styles from './ExampleWord.module.css';

/** คำศัพท์ตัวอย่าง โดยเน้นตัวอักษรที่กำลังฝึก */
export function ExampleWord({ word, char }: { word: Word; char: string }) {
  return (
    <div className={styles.example}>
      <span className={styles.label}>ตัวอย่างคำ</span>
      <span className={styles.word} lang="ja">
        <span className="kana">
          {[...word.kana].map((k, i) =>
            k === char ? (
              <mark key={i} className={styles.mark}>
                {k}
              </mark>
            ) : (
              k
            ),
          )}
        </span>
        {word.kanji && <span className={styles.kanji}>（{word.kanji}）</span>}
      </span>
      <span className={styles.meaning}>
        <strong>{word.romaji}</strong> — {word.meaning}
        {word.origin && <span className="muted"> · มาจาก “{word.origin}”</span>}
      </span>
      {/* อ่านจากรูปคันจิ (ถ้ามี) เพื่อให้เสียงสูงต่ำถูกต้อง เช่น 雨 (ฝน) กับ 飴 (ลูกอม) เขียนเป็นคานะเหมือนกัน */}
      <SpeakButton text={word.kanji ?? word.kana} label={`ฟังเสียงคำ ${word.kana}`} size="sm" />
    </div>
  );
}
