import { Ear, MessageCircle } from 'lucide-react';
import { SpeakButton } from '../../components/SpeakButton';
import { hasWrittenForm } from '../../data/travel/build';
import type { TravelPhrase } from '../../data/travel/types';
import { cx } from '../../lib/cx';
import styles from './travel.module.css';

/** ป้าย "พูด" / "ได้ยิน" */
export function KindTag({ phrase }: { phrase: TravelPhrase }) {
  return phrase.kind === 'say' ? (
    <span className={cx(styles.kind, styles.kindSay)}>
      <MessageCircle size={14} strokeWidth={2} aria-hidden /> ประโยคที่พูด
    </span>
  ) : (
    <span className={cx(styles.kind, styles.kindHear)}>
      <Ear size={14} strokeWidth={2} aria-hidden /> ประโยคที่จะได้ยิน
    </span>
  );
}

interface PhraseFaceProps {
  phrase: TravelPhrase;
  /** lg = การ์ดเรียน/โจทย์ · sm = เฉลย/ตัวเลือก */
  size?: 'lg' | 'sm';
  /** แสดงความหมายไทยด้วย */
  thai?: boolean;
  /** ปุ่มฟังเสียง */
  speak?: boolean;
  className?: string;
}

/** วลี: คานะตัวใหญ่ (เว้นวรรคตามชิ้น) · แบบเขียนจริงตัวเล็ก (ถ้ามีคันจิ) · โรมาจิ · (ความหมาย) */
export function PhraseFace({ phrase, size = 'lg', thai = false, speak = false, className }: PhraseFaceProps) {
  return (
    <div className={cx(styles.face, size === 'sm' && styles.faceSm, className)}>
      <p className={cx('kana', styles.kana)} lang="ja">
        {phrase.kana}
      </p>
      {hasWrittenForm(phrase) && (
        <p className={cx('kana', styles.written)} lang="ja">
          {phrase.written}
        </p>
      )}
      <p className={styles.romaji} lang="ja-Latn">
        {phrase.romaji}
      </p>
      {thai && <p className={styles.thai}>{phrase.thai}</p>}
      {speak && <SpeakButton text={phrase.written} size={size === 'sm' ? 'sm' : 'md'} label="ฟังวลีนี้" />}
    </div>
  );
}
