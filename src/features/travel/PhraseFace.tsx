import { Ear, MessageCircle, Signpost } from 'lucide-react';
import { SpeakButton } from '../../components/SpeakButton';
import { hasWrittenForm } from '../../data/travel/build';
import type { TravelPhrase } from '../../data/travel/types';
import { cx } from '../../lib/cx';
import styles from './travel.module.css';

const KIND_TAG = {
  say: { icon: MessageCircle, label: 'ประโยคที่พูด', className: styles.kindSay },
  hear: { icon: Ear, label: 'ประโยคที่จะได้ยิน', className: styles.kindHear },
  sign: { icon: Signpost, label: 'ป้าย', className: styles.kindSign },
} as const;

/** ป้าย "พูด" / "ได้ยิน" / "ป้าย" */
export function KindTag({ phrase }: { phrase: TravelPhrase }) {
  const { icon: Icon, label, className } = KIND_TAG[phrase.kind];
  return (
    <span className={cx(styles.kind, className)}>
      <Icon size={14} strokeWidth={2} aria-hidden /> {label}
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
  /** ป้าย: ซ่อนคำอ่าน (โจทย์ "ป้ายนี้แปลว่าอะไร" ให้อ่านเอง) */
  hideReading?: boolean;
  className?: string;
}

/**
 * วลี: คานะตัวใหญ่ (เว้นวรรคตามชิ้น) · แบบเขียนจริงตัวเล็ก (ถ้ามีคันจิ) · โรมาจิ · (ความหมาย)
 * ป้าย: ตัวหนังสือบนป้ายในกรอบ · คำอ่าน + โรมาจิ
 */
export function PhraseFace({ phrase, size = 'lg', thai = false, speak = false, hideReading = false, className }: PhraseFaceProps) {
  if (phrase.kind === 'sign') {
    return (
      <div className={cx(styles.face, size === 'sm' && styles.faceSm, className)}>
        <p className={cx('kana', styles.sign)} lang="ja">
          {phrase.written}
        </p>
        {!hideReading && (
          <p className={styles.signReading}>
            <span className="kana" lang="ja">
              {phrase.kana}
            </span>{' '}
            · <span lang="ja-Latn">{phrase.romaji}</span>
          </p>
        )}
        {thai && <p className={styles.thai}>{phrase.thai}</p>}
        {speak && !hideReading && <SpeakButton text={phrase.kana} size={size === 'sm' ? 'sm' : 'md'} label="ฟังคำอ่าน" />}
      </div>
    );
  }
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
