import { Fragment, type ReactNode } from 'react';
import type { Seg } from '../../data/grammar/sentence';
import { cx } from '../../lib/cx';
import { updateSettings, useSettings } from '../settings/settings';
import styles from './grammar.module.css';

interface JaTextProps {
  segs: readonly Seg[];
  /** เครื่องหมายท้ายประโยค */
  end?: string;
  /** highlight = เน้นส่วนไวยากรณ์ · blank = เว้นส่วนไวยากรณ์เป็นช่องว่าง (ข้อเติมคำ) */
  mode?: 'plain' | 'highlight' | 'blank';
  className?: string;
}

/**
 * ข้อความภาษาญี่ปุ่นพร้อมคำอ่านตัวเล็กเหนือคันจิ (<ruby>) — ซ่อนคำอ่านได้จากค่าตั้ง (ซ่อนแบบยังเว้นที่ไว้ บรรทัดจะไม่กระโดด)
 */
export function JaText({ segs, end = '', mode = 'plain', className }: JaTextProps) {
  const { furigana } = useSettings();
  const out: ReactNode[] = [];
  let blanked = false;
  segs.forEach((s, i) => {
    if (s.target && mode === 'blank') {
      if (!blanked) {
        const width = Math.max(2, [...segs.filter((x) => x.target).map((x) => x.text).join('')].length);
        out.push(
          <span key={i} className={styles.blank} style={{ minWidth: `${width + 0.5}em` }} aria-label="ช่องว่าง">
            {'　'}
          </span>,
        );
        blanked = true;
      }
      return;
    }
    const body = s.ruby ? (
      <ruby>
        {s.text}
        <rt>{s.ruby}</rt>
      </ruby>
    ) : (
      s.text
    );
    out.push(
      s.target && mode === 'highlight' ? (
        <strong key={i} className={styles.target}>
          {body}
        </strong>
      ) : (
        <Fragment key={i}>{body}</Fragment>
      ),
    );
  });
  return (
    <span className={cx('kana', styles.ja, !furigana && styles.noFuri, className)} lang="ja">
      {out}
      {end}
    </span>
  );
}

/** ปุ่มแสดง/ซ่อนคำอ่านเหนือคันจิ (จำค่าไว้ในเครื่อง) */
export function FuriganaToggle() {
  const { furigana } = useSettings();
  return (
    <button
      type="button"
      className={cx('btn btn-sm', styles.furiToggle)}
      aria-pressed={furigana}
      onClick={() => updateSettings({ furigana: !furigana })}
    >
      <span className="kana" lang="ja" aria-hidden>
        ふりがな
      </span>
      {furigana ? 'ซ่อนคำอ่าน' : 'แสดงคำอ่าน'}
    </button>
  );
}
