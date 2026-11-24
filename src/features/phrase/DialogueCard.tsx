import { MessagesSquare, Volume2 } from 'lucide-react';
import { SpeakButton } from '../../components/SpeakButton';
import type { Dialogue } from '../../data/phrase/types';
import { cx } from '../../lib/cx';
import { speakSequence, useSpeech } from '../speech/useSpeech';
import { TextLines } from './PhraseFace';
import styles from './phrase.module.css';

/** บทสนทนาตัวอย่างของบท: ฟองคำพูดซ้าย-ขวา · ฟังทีละบรรทัดหรือทั้งบท (title: สายการ์ตูนเรียกว่า "ฉากตัวอย่าง") */
export function DialogueCard({ dialogue, title = 'บทสนทนาตัวอย่าง' }: { dialogue: Dialogue; title?: string }) {
  const { available } = useSpeech();
  return (
    <section className={cx('card', styles.dialogue)} aria-labelledby="dialogue-title">
      <div className={styles.dialogueHead}>
        <h2 id="dialogue-title" className={styles.dialogueTitle}>
          <MessagesSquare size={18} strokeWidth={1.8} aria-hidden /> {title}
        </h2>
        {available && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => speakSequence(dialogue.lines.map((l) => ({ text: l.written, pitch: l.side === 'a' ? 0.9 : 1.15 })))}
          >
            <Volume2 size={16} aria-hidden /> ฟังทั้งบท
          </button>
        )}
      </div>
      <p className={styles.dialogueScene}>{dialogue.scene}</p>
      <ol className={styles.dialogueLines}>
        {dialogue.lines.map((line, i) => (
          <li key={i} className={cx(styles.bubbleRow, line.side === 'b' && styles.bubbleRowB)}>
            <span className={styles.speaker}>{line.speaker}</span>
            <div className={cx(styles.bubble, line.side === 'b' && styles.bubbleB)}>
              <div className={styles.bubbleText}>
                <TextLines text={line} />
                <p className={styles.bubbleThai}>{line.thai}</p>
              </div>
              <SpeakButton text={line.written} size="sm" label="ฟังประโยคนี้" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
