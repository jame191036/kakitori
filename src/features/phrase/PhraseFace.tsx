import { Ear, MessageCircle, Signpost } from 'lucide-react';
import { SpeakButton } from '../../components/SpeakButton';
import { hasWrittenForm } from '../../data/phrase/build';
import type { Phrase, PhraseText } from '../../data/phrase/types';
import { cx } from '../../lib/cx';
import { updateSettings, useSettings } from '../settings/settings';
import styles from './phrase.module.css';

const KIND_TAG = {
  say: { icon: MessageCircle, label: 'ประโยคที่พูด', className: styles.kindSay },
  hear: { icon: Ear, label: 'ประโยคที่จะได้ยิน', className: styles.kindHear },
  sign: { icon: Signpost, label: 'ป้าย', className: styles.kindSign },
} as const;

/** ป้าย "พูด" / "ได้ยิน" / "ป้าย" */
export function KindTag({ phrase }: { phrase: Phrase }) {
  const { icon: Icon, label, className } = KIND_TAG[phrase.kind];
  return (
    <span className={cx(styles.kind, className)}>
      <Icon size={14} strokeWidth={2} aria-hidden /> {label}
    </span>
  );
}

/** ปุ่มแสดง/ซ่อนโรมาจิ (จำค่าไว้ในเครื่อง · ใช้ร่วมกันทุกสายวลี) */
export function RomajiToggle() {
  const { romaji } = useSettings();
  return (
    <button
      type="button"
      className={cx('btn btn-sm', styles.romajiToggle)}
      aria-pressed={romaji}
      onClick={() => updateSettings({ romaji: !romaji })}
    >
      <span className={styles.romajiToggleAbc} aria-hidden>
        abc
      </span>
      {romaji ? 'ซ่อนโรมาจิ' : 'แสดงโรมาจิ'}
    </button>
  );
}

/**
 * ตัวสุดท้าย + เครื่องหมายท้าย (。？！…) ติดกันเสมอ — ชิ้นที่ยาวเกินจอแคบจะถูกตัดตรงที่ล้น
 * (overflow-wrap) ซึ่งอาจเหลือ 。 ตัวเดียวขึ้นบรรทัดใหม่ ภาษาญี่ปุ่นไม่ขึ้นบรรทัดด้วยเครื่องหมายแบบนี้
 */
function GlueEnd({ text }: { text: string }) {
  const m = /.[。？！…]+$/u.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      {text.slice(0, m.index)}
      <span className={styles.nobr}>{m[0]}</span>
    </>
  );
}

interface TextLinesProps {
  text: PhraseText;
  /** แบบเขียนจริงตัวเล็ก (ถ้ามีคันจิ) */
  written?: boolean;
}

/** คานะใหญ่ · แบบเขียนจริงตัวเล็ก · โรมาจิ (ตามค่าตั้ง) — ใช้ทั้งวลี แบบกันเอง และบทสนทนา */
export function TextLines({ text, written = true }: TextLinesProps) {
  const { romaji } = useSettings();
  return (
    <>
      <p className={cx('kana', styles.kana)} lang="ja">
        <GlueEnd text={text.kana} />
      </p>
      {written && hasWrittenForm(text) && (
        <p className={cx('kana', styles.written)} lang="ja">
          <GlueEnd text={text.written} />
        </p>
      )}
      {romaji && (
        <p className={styles.romaji} lang="ja-Latn">
          {text.romaji}
        </p>
      )}
    </>
  );
}

interface PhraseFaceProps {
  phrase: Phrase;
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
  const { romaji } = useSettings();
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
            </span>
            {romaji && (
              <>
                {' '}
                · <span lang="ja-Latn">{phrase.romaji}</span>
              </>
            )}
          </p>
        )}
        {thai && <p className={styles.thai}>{phrase.thai}</p>}
        {speak && !hideReading && <SpeakButton text={phrase.kana} size={size === 'sm' ? 'sm' : 'md'} label="ฟังคำอ่าน" />}
      </div>
    );
  }
  return (
    <div className={cx(styles.face, size === 'sm' && styles.faceSm, className)}>
      <TextLines text={phrase} />
      {thai && <p className={styles.thai}>{phrase.thai}</p>}
      {speak && <SpeakButton text={phrase.written} size={size === 'sm' ? 'sm' : 'md'} label="ฟังวลีนี้" />}
    </div>
  );
}
