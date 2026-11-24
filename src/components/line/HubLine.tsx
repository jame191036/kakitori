import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import type { LineDeck } from '../../data/line';
import { deckProgress, lessonStates, nextLesson, wordsPassed } from '../../features/line/lineLogic';
import type { ProgressData } from '../../features/progress/progressLogic';
import { cx } from '../../lib/cx';
import { tone, type Tone } from '../../lib/tone';
import styles from './HubPage.module.css';

interface HubLineProps {
  deck: LineDeck;
  data: ProgressData;
  /** สีสาย */
  lineTone: Tone;
  glyph: string;
  name: string;
  desc: string;
  /** หน่วยนับ เช่น คำ · ตัว · วลี */
  unit: string;
  href: string;
}

/** การ์ดสายบทเรียนในหน้าศูนย์รวม (N5 · บทสนทนา): ความคืบหน้า + ปุ่มไปบทถัดไป */
export function HubLine({ deck, data, lineTone, glyph, name, desc, unit, href }: HubLineProps) {
  const progress = deckProgress(deck, data);
  const passed = lessonStates(deck, progress).filter((s) => s === 'done').length;
  const next = nextLesson(deck, progress);
  return (
    <li className="tone" style={tone(lineTone)}>
      <Link to={href} className={cx(styles.line, styles.live)}>
        <span className={cx('kana', styles.badge)} lang="ja">
          {glyph}
        </span>
        <span className={styles.info}>
          <span className={styles.name}>{name}</span>
          <span className={styles.desc}>
            {desc} · ผ่านแล้ว {passed}/{deck.lessons.length} บท · ตอบถูก {wordsPassed(deck, progress)} {unit}
          </span>
          <span className={styles.track} aria-hidden>
            <span style={{ width: `${(passed / Math.max(1, deck.lessons.length)) * 100}%` }} />
          </span>
        </span>
        <span className={styles.go}>
          {next ? `ต่อ: ${next.title}` : 'ดูแผนที่สาย'} <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </li>
  );
}
